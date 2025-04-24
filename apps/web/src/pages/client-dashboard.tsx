import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Globe, Activity, Clock, Zap, CheckCircle2, ExternalLink } from 'lucide-react';
import SitesList from '@/components/clients/sites-list';
import AddSiteDialog from '@/components/clients/add-site-dialog';
import ValidatorSelection from '@/components/clients/validator-selection';
import UptimeChart from '@/components/clients/uptime-chart';
import ResponseTimeChart from '@/components/clients/response-time-chart';
import ClientSettings from '@/components/clients/client-settings';
import ClientMap from '@/components/clients/client-map';
import { comingSoon } from '@/lib/utils';

// Demo data
const demoSites = [
  { id: 1, url: 'https://example.com', status: 'online', uptime: 99.9, responseTime: 87, lastChecked: '1 min ago' },
  { id: 2, url: 'https://demo-api.example.org', status: 'online', uptime: 98.7, responseTime: 134, lastChecked: '2 min ago' },
  { id: 3, url: 'https://test.example.net', status: 'offline', uptime: 95.2, responseTime: 0, lastChecked: '3 min ago' },
];

const ClientDashboard = () => {
  const [sites, setSites] = useState(demoSites);
  const [showAddSite, setShowAddSite] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSite, setSelectedSite] = useState<number | null>(1);
  const { toast } = useToast();

  const addNewSite = (url: string) => {
    const newSite = {
      id: sites.length + 1,
      url,
      status: 'pending',
      uptime: 0,
      responseTime: 0,
      lastChecked: 'Just now'
    };
    
    setSites([...sites, newSite]);
    setShowAddSite(false);
    
    // Simulate checking status
    setTimeout(() => {
      setSites(currentSites => 
        currentSites.map(site => 
          site.id === newSite.id 
            ? { ...site, status: 'online', uptime: 100, responseTime: Math.floor(Math.random() * 100) + 50 }
            : site
        )
      );
      
      toast({
        title: "Website Added",
        description: `${url} is now being monitored by our network.`,
      });
    }, 2000);
  };

  return (
    <DashboardLayout userType="client">
      <Routes>
        <Route path="/" element={
          <div className="max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Client Dashboard</h1>
                <p className="text-muted-foreground">Monitor your websites using our distributed validator network</p>
              </div>
              <Button onClick={() => setShowAddSite(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Website
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Websites</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sites.length}</div>
                  <p className="text-xs text-muted-foreground">Monitored websites</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Uptime</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(sites.reduce((acc, site) => acc + site.uptime, 0) / sites.length).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(sites.reduce((acc, site) => site.status === 'online' ? acc + site.responseTime : acc, 0) / 
                      sites.filter(site => site.status === 'online').length)}ms
                  </div>
                  <p className="text-xs text-muted-foreground">Average</p>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden">
                <div className="absolute -right-4 -top-4 bg-primary text-white py-1 px-3 rotate-45 text-xs font-semibold">
                  Coming Soon
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Validators</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold opacity-75">—</div>
                  <Button variant="ghost" className="text-xs text-muted-foreground p-0 h-auto" onClick={comingSoon}>
                    Node selection coming soon
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Websites</CardTitle>
                  <CardDescription>Your monitored sites</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <SitesList 
                    sites={sites} 
                    onSelect={setSelectedSite} 
                    selectedSite={selectedSite} 
                  />
                </CardContent>
                <CardFooter className="border-t p-4">
                  <Button variant="outline" className="w-full" onClick={() => setShowAddSite(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add New
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="md:col-span-3">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Website Analytics</CardTitle>
                      <CardDescription>
                        {selectedSite ? sites.find(s => s.id === selectedSite)?.url : 'Select a website'}
                      </CardDescription>
                    </div>
                    {selectedSite && (
                      <div className="flex items-center gap-2">
                        <Badge variant={sites.find(s => s.id === selectedSite)?.status === 'online' ? 'default' : 'destructive'}>
                          {sites.find(s => s.id === selectedSite)?.status === 'online' ? 'Online' : 'Offline'}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => window.open(sites.find(s => s.id === selectedSite)?.url, '_blank')}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedSite ? (
                    <Tabs defaultValue="uptime" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="uptime">Uptime</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                        <TabsTrigger value="locations">Validators</TabsTrigger>
                      </TabsList>
                      <TabsContent value="uptime">
                        <UptimeChart siteId={selectedSite} />
                      </TabsContent>
                      <TabsContent value="performance">
                        <ResponseTimeChart siteId={selectedSite} />
                      </TabsContent>
                      <TabsContent value="locations">
                        <ClientMap />
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                      <Globe className="h-12 w-12 mb-4 opacity-20" />
                      <h3 className="text-lg font-medium">No Website Selected</h3>
                      <p className="max-w-md mt-2">Select a website from the list to view detailed analytics</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Validator Selection</CardTitle>
                <CardDescription>
                  Select which validator nodes monitor your websites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ValidatorSelection />
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm w-full justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Your websites are currently being monitored from 5 global locations</span>
                </div>
              </CardFooter>
            </Card>
            
            <AddSiteDialog 
              open={showAddSite} 
              onOpenChange={setShowAddSite} 
              onAdd={addNewSite} 
            />
          </div>
        } />
        <Route path="/settings" element={<ClientSettings />} />
      </Routes>
    </DashboardLayout>
  );
};

export default ClientDashboard;