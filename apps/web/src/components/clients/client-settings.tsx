// import { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Switch } from '@/components/ui/switch';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card';
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// import { useToast } from '@/hooks/use-toast';
// import { Save, Bell, Clock, Webhook, User, CreditCard, Badge } from 'lucide-react';

// const ClientSettings = () => {
//   const [formState, setFormState] = useState({
//     email: 'user@example.com',
//     notificationsEnabled: true,
//     emailNotifications: true,
//     pushNotifications: false,
//     downAlerts: true,
//     uptimeAlerts: true,
//     latencyAlerts: false,
//     sslAlerts: true,
//     alertThreshold: 'medium',
//     refreshInterval: 60,
//     timezone: 'UTC',
//   });
//   const { toast } = useToast();

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormState(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSwitchChange = (name: keyof typeof formState, checked: boolean) => {
//     setFormState(prev => ({ ...prev, [name]: checked }));
//   };

//   const handleRadioChange = (name: keyof typeof formState, value: string) => {
//     setFormState(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     toast({
//       title: 'Settings Saved',
//       description: 'Your client settings have been updated.',
//     });
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-6">
//       <div>
//         <h1 className="text-3xl font-bold tracking-tight">Client Settings</h1>
//         <p className="text-muted-foreground">Configure your monitoring preferences</p>
//       </div>

//       <Tabs defaultValue="notifications" className="space-y-4">
//         <TabsList>
//           <TabsTrigger value="notifications">Notifications</TabsTrigger>
//           <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
//           <TabsTrigger value="account">Account</TabsTrigger>
//           <TabsTrigger value="billing">Billing</TabsTrigger>
//         </TabsList>

//         {/* --- Notifications Tab --- */}
//         <TabsContent value="notifications">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Bell className="h-5 w-5" />
//                 Notification Settings
//               </CardTitle>
//               <CardDescription>Configure how you receive alerts</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               {/* Enable Notifications */}
//               <div className="flex justify-between items-center">
//                 <div>
//                   <Label htmlFor="notificationsEnabled">Enable Notifications</Label>
//                   <p className="text-sm text-muted-foreground">
//                     Receive alerts for important events
//                   </p>
//                 </div>
//                 <Switch
//                   id="notificationsEnabled"
//                   checked={formState.notificationsEnabled}
//                   onCheckedChange={checked => handleSwitchChange('notificationsEnabled', checked)}
//                 />
//               </div>

//               {/* Channels */}
//               <div className="space-y-4 mt-6">
//                 <Label>Channels</Label>
//                 <div className="flex justify-between items-center">
//                   <div>
//                     <Label htmlFor="emailNotifications" className="font-normal">Email</Label>
//                     <p className="text-sm text-muted-foreground">Alerts via email</p>
//                   </div>
//                   <Switch
//                     id="emailNotifications"
//                     checked={formState.emailNotifications}
//                     onCheckedChange={checked => handleSwitchChange('emailNotifications', checked)}
//                     disabled={!formState.notificationsEnabled}
//                   />
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <div>
//                     <Label htmlFor="pushNotifications" className="font-normal">Push</Label>
//                     <p className="text-sm text-muted-foreground">Browser notifications</p>
//                   </div>
//                   <Switch
//                     id="pushNotifications"
//                     checked={formState.pushNotifications}
//                     onCheckedChange={checked => handleSwitchChange('pushNotifications', checked)}
//                     disabled={!formState.notificationsEnabled}
//                   />
//                 </div>
//               </div>

//               {/* Alert Types */}
//               <div className="space-y-4 mt-6">
//                 <Label>Alert Types</Label>
//                 {['downAlerts','uptimeAlerts','latencyAlerts','sslAlerts'].map((key) => (
//                   <div key={key} className="flex justify-between items-center">
//                     <div>
//                       <Label htmlFor={key} className="font-normal">
//                         {{
//                           downAlerts: 'Downtime',
//                           uptimeAlerts: 'Uptime',
//                           latencyAlerts: 'Latency',
//                           sslAlerts: 'SSL Certificate',
//                         }[key as keyof typeof formState]}
//                       </Label>
//                       <p className="text-sm text-muted-foreground">
//                         {{
//                           downAlerts: 'When site goes offline',
//                           uptimeAlerts: 'When site comes back',
//                           latencyAlerts: 'When response slow',
//                           sslAlerts: 'When cert expires soon',
//                         }[key as keyof typeof formState]}
//                       </p>
//                     </div>
//                     <Switch
//                       id={key}
//                       checked={formState[key as keyof typeof formState] as boolean}
//                       onCheckedChange={checked => handleSwitchChange(key as any, checked)}
//                       disabled={!formState.notificationsEnabled}
//                     />
//                   </div>
//                 ))}
//               </div>

//               {/* Sensitivity */}
//               <div className="space-y-4 mt-6">
//                 <Label>Alert Sensitivity</Label>
//                 <RadioGroup
//                   value={formState.alertThreshold}
//                   onValueChange={value => handleRadioChange('alertThreshold', value)}
//                   disabled={!formState.notificationsEnabled}
//                 >
//                   {['low','medium','high'].map(level => (
//                     <div key={level} className="flex items-center space-x-2">
//                       <RadioGroupItem value={level} id={`threshold-${level}`} />
//                       <Label htmlFor={`threshold-${level}`} className="font-normal capitalize">
//                         {level}
//                       </Label>
//                     </div>
//                   ))}
//                 </RadioGroup>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* --- Monitoring Tab --- */}
//         <TabsContent value="monitoring">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Clock className="h-5 w-5" />
//                 Monitoring Settings
//               </CardTitle>
//               <CardDescription>Configure check intervals and timezone</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               <div className="space-y-2">
//                 <Label htmlFor="refreshInterval">Refresh Interval (s)</Label>
//                 <Input
//                   id="refreshInterval"
//                   name="refreshInterval"
//                   type="number"
//                   min={30}
//                   max={3600}
//                   value={formState.refreshInterval}
//                   onChange={handleInputChange}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="timezone">Timezone</Label>
//                 <select
//                   id="timezone"
//                   name="timezone"
//                   value={formState.timezone}
//                   onChange={handleInputChange}
//                   className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
//                 >
//                   <option value="UTC">UTC</option>
//                   <option value="America/New_York">ET</option>
//                   <option value="Europe/London">GMT</option>
//                   <option value="Asia/Tokyo">JST</option>
//                   <option value="Australia/Sydney">AEDT</option>
//                 </select>
//               </div>
//               <div className="space-y-4 mt-6">
//                 <Label>Webhook URL</Label>
//                 <div className="flex items-center gap-2">
//                   <Webhook className="h-4 w-4 text-muted-foreground" />
//                   <Input id="webhookUrl" type="url" placeholder="https://example.com/webhook" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* --- Account Tab --- */}
//         <TabsContent value="account">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <User className="h-5 w-5" />
//                 Account Settings
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               <div className="space-y-2">
//                 <Label htmlFor="accountName">Full Name</Label>
//                 <Input id="accountName" defaultValue="John Doe" />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="accountEmail">Email</Label>
//                 <Input
//                   id="accountEmail"
//                   name="email"
//                   type="email"
//                   value={formState.email}
//                   onChange={handleInputChange}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="password">Password</Label>
//                 <Input id="password" type="password" disabled value="••••••••" />
//                 <Button variant="outline" size="sm">Change Password</Button>
//               </div>
//               <div className="pt-4 border-t">
//                 <Button variant="destructive">Delete Account</Button>
//                 <p className="text-sm text-muted-foreground mt-2">
//                   This action is irreversible.
//                 </p>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         {/* --- Billing Tab --- */}
//         <TabsContent value="billing">
//           <Card>
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <CreditCard className="h-5 w-5" />
//                 Billing Settings
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               <div className="border rounded-md p-4">
//                 <div className="flex justify-between">
//                   <div>
//                     <h3 className="font-semibold">Current Plan</h3>
//                     <p className="text-sm text-muted-foreground">Free Trial</p>
//                   </div>
//                   <Badge>Active</Badge>
//                 </div>
//                 <Button variant="outline" className="mt-4">Upgrade Plan</Button>
//               </div>
//               <div className="space-y-2">
//                 <h3 className="font-semibold">Payment Method</h3>
//                 <div className="border rounded-md p-4">
//                   <p className="text-sm text-muted-foreground">No payment method added</p>
//                   <Button variant="outline" size="sm" className="mt-2">
//                     Add Payment Method
//                   </Button>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>

//       {/* Global Save */}
//       <div className="flex justify-end">
//         <Button type="submit">
//           <Save className="mr-2 h-4 w-4" />
//           Save Changes
//         </Button>
//       </div>
//     </form>
//   );
// };

// export default ClientSettings;
