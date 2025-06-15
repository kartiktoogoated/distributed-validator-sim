import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Cpu, Network, HardDrive, Zap, Save } from 'lucide-react';

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

  const handleSwitchChange = (name: keyof typeof formState, checked: boolean) => {
    setFormState(prev => ({ ...prev, [name]: checked }));
  };

  const handleSliderChange = (name: 'cpuLimit' | 'memoryLimit' | 'diskLimit' | 'networkLimit', value: number[]) => {
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
    <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* --- GENERAL --- */}
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
                  onChange={(e) =>
                    setFormState(prev => ({ ...prev, region: e.target.value }))
                  }
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring"
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
                  onCheckedChange={(checked) =>
                    handleSwitchChange('autoRestart', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- RESOURCES --- */}
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resource Limits</CardTitle>
              <CardDescription>Set limits for resource usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {([
                { key: 'cpuLimit', label: 'CPU Limit', icon: <Cpu />, value: formState.cpuLimit },
                { key: 'memoryLimit', label: 'Memory Limit', icon: <Zap />, value: formState.memoryLimit },
                { key: 'diskLimit', label: 'Disk Limit', icon: <HardDrive />, value: formState.diskLimit },
                { key: 'networkLimit', label: 'Network Limit', icon: <Network />, value: formState.networkLimit },
              ] as const).map(({ key, label, icon, value }) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor={key} className="flex items-center gap-2">
                      {icon}
                      {label}
                    </Label>
                    <span className="text-sm">{value}%</span>
                  </div>
                  <Slider
                    id={key}
                    min={10}
                    max={100}
                    step={5}
                    value={[value]}
                    onValueChange={(v) =>
                      handleSliderChange(key, v)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- NOTIFICATIONS --- */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications-enabled">
                    Enable Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts for important events
                  </p>
                </div>
                <Switch
                  id="notifications-enabled"
                  checked={formState.notificationsEnabled}
                  onCheckedChange={(checked) =>
                    handleSwitchChange('notificationsEnabled', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={formState.emailNotifications}
                  onCheckedChange={(checked) =>
                    handleSwitchChange('emailNotifications', checked)
                  }
                  disabled={!formState.notificationsEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ADVANCED --- */}
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="ping-timeout">Ping Timeout (ms)</Label>
                <Input
                  id="ping-timeout"
                  type="number"
                  defaultValue={5000}
                  min={1000}
                  max={10000}
                  step={500}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button type="submit">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default ValidatorSettings;
