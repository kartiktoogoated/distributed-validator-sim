import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";
import {
  Activity,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  Bell,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: "validator" | "client";
}

export default function DashboardLayout({
  children,
  userType,
}: DashboardLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // notifications state & seen tracking
  const [notifications, setNotifications] = useState<string[]>([]);
  const seenSites = useRef<Set<string>>(new Set());

  // handle resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // open WS & listen for first‐ping and high‐latency
  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${window.location.host}/api/ws`);

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const payload = msg.data ?? msg;
        const url: string = payload.url;
        const rt: number | undefined =
          payload.responseTime ?? payload.latency;

        // first ping
        if (!seenSites.current.has(url)) {
          seenSites.current.add(url);
          setNotifications((prev) => [
            `✅ First ping for ${url}`,
            ...prev,
          ]);
        }
        // latency spike
        if (rt !== undefined && rt > 200) {
          setNotifications((prev) => [
            `⚠️ High latency (${rt} ms) for ${url}`,
            ...prev,
          ]);
        }
      } catch {
        // ignore
      }
    };

    ws.onerror = () => {
      setNotifications((prev) => [
        `❌ WebSocket error`,
        ...prev,
      ]);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const menuItems = [
    {
      name: "Dashboard",
      href:
        userType === "validator"
          ? "/validator-dashboard"
          : "/client-dashboard",
      icon: <LayoutDashboard className="w-5 h-5 text-foreground" />,
    },
    {
      name: "Settings",
      href:
        userType === "validator"
          ? "/validator-dashboard/settings"
          : "/client-dashboard/settings",
      icon: <Settings className="w-5 h-5 text-foreground" />,
    },
  ];

  // sidebar JSX
  const renderSidebar = () => (
    <div className="h-full w-64 flex flex-col bg-card border-r">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground">DeepFry</span>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-2 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              window.location.pathname === item.href ||
                window.location.pathname + "/" === item.href
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50 text-foreground hover:text-foreground"
            )}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="mt-6 px-3">
        <div className="border rounded-md p-4 text-center">
          <div className="text-sm font-medium text-foreground mb-2">
            {userType === "validator" ? "Validator Status" : "Website Status"}
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-sm text-foreground">All systems online</span>
          </div>
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link
              to={
                userType === "validator"
                  ? "/validator-dashboard"
                  : "/client-dashboard"
              }
            >
              View Details
            </Link>
          </Button>
        </div>
      </div>
      <div className="mt-auto p-4 border-t flex items-center gap-4">
        <Avatar>
          <img
            src="/user2.avif"
            alt="User avatar"
            className="rounded-full object-cover w-full h-full"
          />
          <AvatarFallback>
            {user?.email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {user?.email}
          </p>
          <p className="text-xs text-secondary-foreground capitalize">
            {userType}
          </p>
        </div>
        <Button size="icon" variant="ghost" onClick={handleLogout}>
          <LogOut className="h-4 w-4 text-foreground" />
        </Button>
      </div>
    </div>
  );

  // notifications dropdown
  const NotificationsMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-foreground" />
          {notifications.length > 0 && (
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-60 overflow-auto">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
        ) : (
          notifications.map((note, i) => (
            <DropdownMenuItem key={i} className="whitespace-normal">
              {note}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen flex">
      {/* Mobile Header */}
      {isMobile && (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
          <div className="flex h-14 items-center px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="h-5 w-5 text-foreground" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="pr-0 sm:max-w-xs">
                {renderSidebar()}
              </SheetContent>
            </Sheet>
            <Link to="/" className="flex items-center gap-2 mr-4">
              <Activity className="h-6 w-6 text-primary" />
              <span className="font-bold text-foreground">DeepFry</span>
            </Link>
            <div className="flex-1" />
            <NotificationsMenu />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2">
                  <Avatar>
                    <img
                      src="/user2.avif"
                      alt="User avatar"
                      className="rounded-full object-cover w-full h-full"
                    />
                    <AvatarFallback>
                      {user?.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    to={
                      userType === "validator"
                        ? "/validator-dashboard/settings"
                        : "/client-dashboard/settings"
                    }
                  >
                    <Settings className="mr-2 h-4 w-4 text-foreground" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4 text-foreground" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
      )}

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        {!isMobile && <aside className="hidden md:block">{renderSidebar()}</aside>}

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {!isMobile && (
            <header className="sticky top-0 z-30 bg-background border-b">
              <div className="mx-auto flex h-16 items-center justify-between px-6 max-w-7xl">
                <div className="flex items-center gap-2">
                  <Link to="/">
                    <Home className="h-5 w-5 text-foreground" />
                  </Link>
                  <NotificationsMenu />
                  <ThemeToggle />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Avatar>
                        <img
                          src="/user2.avif"
                          alt="User avatar"
                          className="rounded-full object-cover w-full h-full"
                        />
                        <AvatarFallback>
                          {user?.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="max-w-[150px] truncate text-foreground">
                        {user?.email}
                      </span>
                      <ChevronDown className="h-4 w-4 text-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to={
                          userType === "validator"
                            ? "/validator-dashboard/settings"
                            : "/client-dashboard/settings"
                        }
                      >
                        <Settings className="mr-2 h-4 w-4 text-foreground" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4 text-foreground" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
          )}

          <main className="flex-1 overflow-auto bg-background">
            <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
