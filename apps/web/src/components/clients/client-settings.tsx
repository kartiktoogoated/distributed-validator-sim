import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bell, User, Wrench } from 'lucide-react';

const ClientSettings = () => {
  const [formState, setFormState] = useState({
    email: 'user@example.com',
    name: 'John Doe',
    notificationsEnabled: true,
    emailNotifications: true,
  });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: keyof typeof formState, checked: boolean) => {
    setFormState(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Settings Saved',
      description: 'Your client settings have been updated.',
    });
  };

  return (
    <div className="flex-1 pt-10 pb-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">Client Settings</h1>
            <p className="text-muted-foreground">Configure your preferences</p>
          </div>

          <Tabs defaultValue="account" className="space-y-8">
            <TabsList className="bg-muted p-1 rounded-lg mb-6">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" value={formState.name} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" value={formState.email} onChange={handleInputChange} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                  <CardDescription>Simple alerts via email</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/40 rounded-md">
                    <div>
                      <Label htmlFor="enable-notifications">Enable Notifications</Label>
                      <p id="enable-notifications-description" className="text-sm text-muted-foreground">
                        Basic email alerts when website status changes
                      </p>
                    </div>
                    <Switch
                      id="enable-notifications"
                      checked={formState.notificationsEnabled}
                      onCheckedChange={checked => handleSwitchChange('notificationsEnabled', checked)}
                      aria-describedby="enable-notifications-description"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/40 rounded-md">
                    <div>
                      <Label htmlFor="email-alerts">Email Alerts</Label>
                      <p id="email-alerts-description" className="text-sm text-muted-foreground">You'll get alerts at your email</p>
                    </div>
                    <Switch
                      id="email-alerts"
                      checked={formState.emailNotifications}
                      onCheckedChange={checked => handleSwitchChange('emailNotifications', checked)}
                      disabled={!formState.notificationsEnabled}
                      aria-describedby="email-alerts-description"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monitoring">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Monitoring
                  </CardTitle>
                  <CardDescription>This section is coming soon.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-8 h-full min-h-[200px] bg-muted/40 rounded-md border border-dashed border-muted-foreground/30">
                  <p className="text-sm text-muted-foreground text-center">You'll be able to configure intervals, regions, and more.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Billing
                  </CardTitle>
                  <CardDescription>This section is coming soon.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-8 h-full min-h-[200px] bg-muted/40 rounded-md border border-dashed border-muted-foreground/30">
                  <p className="text-sm text-muted-foreground text-center">Plans, invoices, and payment methods will appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-10">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientSettings;
