import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Cpu, Network, HardDrive, Zap, Save } from 'lucide-react';
import DashboardLayout from '@/components/layout/dashboard-layout';

const ValidatorSettings = () => {
  const [formState, setFormState] = useState({
    name: 'My Validator Node',
    cpuLimit: 70,
    memoryLimit: 80,
    diskLimit: 90,
    networkLimit: 75,
    autoRestart: true,
    notificationsEnabled: true,
    emailNotifications: true,
    region: 'north-america',
  });
  
  const { toast } = useToast();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormState(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSliderChange = (name: string, value: number[]) => {
    setFormState(prev => ({ ...prev, [name]: value[0] }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Settings Saved',
      description: 'Your validator settings have been updated.',
    });
  };
  
  return (
    <DashboardLayout userType="validator">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Validator Settings</h1>
          <p className="text-muted-foreground">Configure your validator node settings</p>
        </div>
        
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure basic validator settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Validator Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={formState.name} 
                    onChange={handleInputChange} 
                  />
                  <p className="text-sm text-muted-foreground">
                    A friendly name to identify your validator
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <select 
                    id="region" 
                    name="region" 
                    value={formState.region}
                    onChange={(e) => setFormState(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="north-america">North America</option>
                    <option value="europe">Europe</option>
                    <option value="asia-pacific">Asia Pacific</option>
                    <option value="south-america">South America</option>
                    <option value="africa">Africa</option>
                  </select>
                  <p className="text-sm text-muted-foreground">
                    Geographic region where your validator is located
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-restart">Auto Restart</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically restart the validator if it crashes
                    </p>
                  </div>
                  <Switch 
                    id="auto-restart" 
                    checked={formState.autoRestart} 
                    onCheckedChange={(checked) => handleSwitchChange('autoRestart', checked)} 
                  />
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
          
          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle>Resource Limits</CardTitle>
                <CardDescription>Set limits for resource usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="cpu-limit" className="flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        CPU Limit
                      </Label>
                      <span className="text-sm">{formState.cpuLimit}%</span>
                    </div>
                    <Slider 
                      id="cpu-limit" 
                      min={10} 
                      max={100} 
                      step={5} 
                      value={[formState.cpuLimit]} 
                      onValueChange={(value) => handleSliderChange('cpuLimit', value)} 
                    />
                    <p className="text-sm text-muted-foreground">
                      Maximum CPU usage before throttling
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="memory-limit" className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Memory Limit
                      </Label>
                      <span className="text-sm">{formState.memoryLimit}%</span>
                    </div>
                    <Slider 
                      id="memory-limit" 
                      min={10} 
                      max={100} 
                      step={5} 
                      value={[formState.memoryLimit]} 
                      onValueChange={(value) => handleSliderChange('memoryLimit', value)} 
                    />
                    <p className="text-sm text-muted-foreground">
                      Maximum memory usage
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="disk-limit" className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        Disk Limit
                      </Label>
                      <span className="text-sm">{formState.diskLimit}%</span>
                    </div>
                    <Slider 
                      id="disk-limit" 
                      min={10} 
                      max={100} 
                      step={5} 
                      value={[formState.diskLimit]} 
                      onValueChange={(value) => handleSliderChange('diskLimit', value)} 
                    />
                    <p className="text-sm text-muted-foreground">
                      Maximum disk space usage
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="network-limit" className="flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        Network Limit
                      </Label>
                      <span className="text-sm">{formState.networkLimit}%</span>
                    </div>
                    <Slider 
                      id="network-limit" 
                      min={10} 
                      max={100} 
                      step={5} 
                      value={[formState.networkLimit]} 
                      onValueChange={(value) => handleSliderChange('networkLimit', value)} 
                    />
                    <p className="text-sm text-muted-foreground">
                      Maximum network bandwidth usage
                    </p>
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
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure alerts and notifications</CardDescription>
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
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
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
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your@email.com" 
                    disabled={!formState.notificationsEnabled || !formState.emailNotifications}
                  />
                  <p className="text-sm text-muted-foreground">
                    Where to send email notifications
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
          
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Configure advanced validator options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ping-interval">Ping Interval (seconds)</Label>
                  <Input 
                    id="ping-interval" 
                    type="number" 
                    defaultValue={30} 
                    min={5} 
                    max={300}
                  />
                  <p className="text-sm text-muted-foreground">
                    How often to ping monitored websites
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ping-timeout">Ping Timeout (milliseconds)</Label>
                  <Input 
                    id="ping-timeout" 
                    type="number" 
                    defaultValue={5000} 
                    min={1000} 
                    max={10000}
                    step={500}
                  />
                  <p className="text-sm text-muted-foreground">
                    How long to wait for a response before timing out
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="concurrent-pings">Concurrent Pings</Label>
                  <Input 
                    id="concurrent-pings" 
                    type="number" 
                    defaultValue={10} 
                    min={1} 
                    max={50}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum number of concurrent pings
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="log-level">Log Level</Label>
                  <select 
                    id="log-level" 
                    className="w-full flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info" selected>Info</option>
                    <option value="debug">Debug</option>
                    <option value="trace">Trace</option>
                  </select>
                  <p className="text-sm text-muted-foreground">
                    Logging verbosity level
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ValidatorSettings;