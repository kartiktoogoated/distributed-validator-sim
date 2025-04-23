import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Save, Bell, Clock, Webhook, User, CreditCard, Badge } from 'lucide-react';
import DashboardLayout from '@/components/layout/dashboard-layout';

const ClientSettings = () => {
  const [formState, setFormState] = useState({
    email: 'user@example.com',
    notificationsEnabled: true,
    emailNotifications: true,
    pushNotifications: false,
    downAlerts: true,
    uptimeAlerts: true,
    latencyAlerts: false,
    sslAlerts: true,
    alertThreshold: 'medium',
    refreshInterval: 60,
    timezone: 'UTC',
  });
  
  const { toast } = useToast();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormState(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleRadioChange = (name: string, value: string) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Settings Saved',
      description: 'Your client settings have been updated.',
    });
  };
  
  return (
    <DashboardLayout userType="client">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Settings</h1>
          <p className="text-muted-foreground">Configure your monitoring preferences</p>
        </div>
        
        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure how you receive alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts for important events
                    </p>
                  </div>
                  <Switch 
                    id="notifications-enabled" 
                    checked={formState.notificationsEnabled} 
                    onCheckedChange={(checked) => handleSwitchChange('notificationsEnabled', checked)} 
                  />
                </div>
                
                <div className="space-y-4 mt-6">
                  <Label>Notification Channels</Label>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications" className="font-normal">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts via email
                      </p>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={formState.emailNotifications} 
                      onCheckedChange={(checked) => handleSwitchChange('emailNotifications', checked)} 
                      disabled={!formState.notificationsEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notifications" className="font-normal">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts in your browser
                      </p>
                    </div>
                    <Switch 
                      id="push-notifications" 
                      checked={formState.pushNotifications} 
                      onCheckedChange={(checked) => handleSwitchChange('pushNotifications', checked)} 
                      disabled={!formState.notificationsEnabled}
                    />
                  </div>
                </div>
                
                <div className="space-y-4 mt-6">
                  <Label>Alert Types</Label>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="down-alerts" className="font-normal">Downtime Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        When a website goes offline
                      </p>
                    </div>
                    <Switch 
                      id="down-alerts" 
                      checked={formState.downAlerts} 
                      onCheckedChange={(checked) => handleSwitchChange('downAlerts', checked)} 
                      disabled={!formState.notificationsEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="uptime-alerts" className="font-normal">Uptime Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        When a website comes back online
                      </p>
                    </div>
                    <Switch 
                      id="uptime-alerts" 
                      checked={formState.uptimeAlerts} 
                      onCheckedChange={(checked) => handleSwitchChange('uptimeAlerts', checked)} 
                      disabled={!formState.notificationsEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="latency-alerts" className="font-normal">Latency Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        When response time exceeds threshold
                      </p>
                    </div>
                    <Switch 
                      id="latency-alerts" 
                      checked={formState.latencyAlerts} 
                      onCheckedChange={(checked) => handleSwitchChange('latencyAlerts', checked)} 
                      disabled={!formState.notificationsEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="ssl-alerts" className="font-normal">SSL Certificate Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        When certificates are expiring soon
                      </p>
                    </div>
                    <Switch 
                      id="ssl-alerts" 
                      checked={formState.sslAlerts} 
                      onCheckedChange={(checked) => handleSwitchChange('sslAlerts', checked)} 
                      disabled={!formState.notificationsEnabled}
                    />
                  </div>
                </div>
                
                <div className="space-y-4 mt-6">
                  <Label>Alert Sensitivity</Label>
                  <RadioGroup 
                    defaultValue={formState.alertThreshold}
                    onValueChange={(value) => handleRadioChange('alertThreshold', value)}
                    disabled={!formState.notificationsEnabled}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="sensitivity-low" />
                      <Label htmlFor="sensitivity-low">Low - Only critical issues</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="sensitivity-medium" />
                      <Label htmlFor="sensitivity-medium">Medium - Important issues</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="sensitivity-high" />
                      <Label htmlFor="sensitivity-high">High - All issues</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" onClick={handleSubmit} className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="monitoring">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Monitoring Settings
                </CardTitle>
                <CardDescription>Configure how your websites are monitored</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
                  <Input 
                    id="refresh-interval" 
                    name="refreshInterval"
                    type="number" 
                    value={formState.refreshInterval}
                    onChange={handleInputChange}
                    min={30} 
                    max={3600}
                  />
                  <p className="text-sm text-muted-foreground">
                    How often to check your websites
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select 
                    id="timezone" 
                    value={formState.timezone}
                    onChange={(e) => setFormState(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Central European Time (CET)</option>
                    <option value="Asia/Tokyo">Japan (JST)</option>
                    <option value="Australia/Sydney">Sydney (AEDT)</option>
                  </select>
                  <p className="text-sm text-muted-foreground">
                    Timezone for reports and notifications
                  </p>
                </div>
                
                <div className="space-y-4 mt-6">
                  <Label>Monitoring Checks</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="border">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium">Uptime Check</Label>
                          <Switch defaultChecked />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Monitor if your website is online
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium">SSL Certificate</Label>
                          <Switch defaultChecked />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Check SSL certificate validity
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium">Response Time</Label>
                          <Switch defaultChecked />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Measure website response times
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium">Content Check</Label>
                          <Switch defaultChecked />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Verify specific content is present
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <div className="space-y-2 mt-6">
                  <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="webhook-url" 
                      type="url" 
                      placeholder="https://example.com/webhook"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive monitoring events via webhook
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" onClick={handleSubmit} className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Settings
                </CardTitle>
                <CardDescription>Manage your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    defaultValue="John Doe" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formState.email}
                    onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Your primary contact email
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value="••••••••"
                    disabled
                  />
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <Button variant="destructive">
                    Delete Account
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    This action is irreversible and will delete all your data
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" onClick={handleSubmit} className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Settings
                </CardTitle>
                <CardDescription>Manage your subscription and payment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Current Plan</h3>
                      <p className="text-sm text-muted-foreground">Free Trial</p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline">Upgrade Plan</Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Payment Method</h3>
                  <div className="border rounded-md p-4">
                    <p className="text-sm text-muted-foreground">No payment method added</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Add Payment Method
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Billing History</h3>
                  <div className="border rounded-md p-4">
                    <p className="text-sm text-muted-foreground">No billing history available</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" onClick={handleSubmit} className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ClientSettings;