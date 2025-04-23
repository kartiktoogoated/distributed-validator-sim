import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  const [userType, setUserType] = useState<'validator' | 'client'>('validator');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check URL params for user type
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type');
    if (typeParam === 'validator' || typeParam === 'client') {
      setUserType(typeParam);
    }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // In a real app, this would call your API
      await login(email, password, userType);
      
      // Redirect to the appropriate dashboard
      toast({
        title: "Success!",
        description: "You've successfully logged in.",
      });
      
      if (userType === 'validator') {
        navigate('/validator-dashboard');
      } else {
        navigate('/client-dashboard');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid credentials. For demo, use any email/password.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link to="/">Home</Link>
        </Button>
        <ThemeToggle />
      </div>
      
      <div className="mb-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.84 6.72 2.28A8.98 8.98 0 0 1 21 12z" />
            <path d="M12 3c-2.55 0-4.93.84-6.85 2.28" />
            <path d="M12 2v10" />
          </svg>
          DePin
        </Link>
        <p className="text-muted-foreground mt-2">Distributed Validator Network</p>
      </div>
      
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={userType} className="w-full" onValueChange={(value) => setUserType(value as 'validator' | 'client')}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="validator">Validator</TabsTrigger>
              <TabsTrigger value="client">Client</TabsTrigger>
            </TabsList>
            <TabsContent value="validator">
              <form onSubmit={handleLogin}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="validator-email">Email</Label>
                    <Input
                      id="validator-email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="validator-password">Password</Label>
                    <Input
                      id="validator-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In as Validator"}
                  </Button>
                  <div className="text-center text-sm text-muted-foreground mt-2">
                    <span>Demo Note: Use any credentials to log in</span>
                  </div>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="client">
              <form onSubmit={handleLogin}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="client-email">Email</Label>
                    <Input
                      id="client-email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="client-password">Password</Label>
                    <Input
                      id="client-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In as Client"}
                  </Button>
                  <div className="text-center text-sm text-muted-foreground mt-2">
                    <span>Demo Note: Use any credentials to log in</span>
                  </div>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link to={userType === 'validator' ? "/signup?type=validator" : "/signup?type=client"}>
                Sign up
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;