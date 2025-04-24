import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpRight, Clock, Server, Activity } from 'lucide-react';
import RecentPings from '@/components/validators/recent-pings';
import ValidatorStats from '@/components/validators/validator-stats';
import ValidatorMap from '@/components/validators/validator-map';
import ValidatorSettings from '@/components/validators/validator-settings';
import PingChart from '@/components/validators/ping-chart';
import { comingSoon } from '@/lib/utils';

// Mock data
const validatorData = {
  status: 'Active',
  uptime: 99.8,
  region: 'North America',
  pingCount: 432,
  lastPing: '2 minutes ago',
  performanceScore: 98,
  pendingRewards: 245.8,
  healthStatus: 'Healthy',
  cpuUsage: 32,
  memoryUsage: 48,
  diskUsage: 37,
  networkUsage: 29,
};

const ValidatorDashboard = () => {
  const [isStarted, setIsStarted] = useState(false);
  const { toast } = useToast();
  
  // Simulate validator status check on load
  useEffect(() => {
    setIsStarted(localStorage.getItem('validatorStarted') === 'true');
  }, []);

  const toggleValidator = () => {
    const newStatus = !isStarted;
    setIsStarted(newStatus);
    localStorage.setItem('validatorStarted', newStatus.toString());
    
    toast({
      title: newStatus ? 'Validator Started' : 'Validator Stopped',
      description: newStatus ? 'Your validator is now active and pinging websites.' : 'Your validator has been stopped.',
    });
  };
  
  return (
    <DashboardLayout userType="validator">
      <Routes>
        <Route path="/" element={
          <div className="max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Validator Dashboard</h1>
                <p className="text-muted-foreground">Monitor and manage your validator node</p>
              </div>
              <Button 
                onClick={toggleValidator}
                className={isStarted ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
              >
                {isStarted ? 'Stop Validator' : 'Start Validator'}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${isStarted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div className="text-2xl font-bold">{isStarted ? 'Active' : 'Inactive'}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isStarted ? 'Validator is running' : 'Validator is offline'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{validatorData.uptime}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
                  <Progress value={validatorData.uptime} className="h-2 mt-3" />
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <div className="absolute -right-4 -top-4 bg-primary text-white py-1 px-3 rotate-45 text-xs font-semibold">
                  Coming Soon
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Earnings</CardTitle>
                  <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L4 8L12 12L20 8L12 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M4 16L12 20L20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M4 12L12 16L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold opacity-75">—</div>
                  <Button variant="ghost" className="text-xs text-muted-foreground p-0 h-auto" onClick={comingSoon}>
                    Token rewards launching soon
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pings</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{validatorData.pingCount}</div>
                  <div className="flex items-center pt-1 text-green-500 text-sm">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    12% from last hour
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="performance" className="space-y-4">
              <TabsList>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="map">Location Map</TabsTrigger>
                <TabsTrigger value="system">System Stats</TabsTrigger>
              </TabsList>
              
              <TabsContent value="performance" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Ping Response Time</CardTitle>
                      <CardDescription>Average response time over the last 24 hours</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                      <PingChart />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Pings</CardTitle>
                      <CardDescription>Latest website pings from your validator</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RecentPings />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Score</CardTitle>
                      <CardDescription>Based on response time, uptime, and consistency</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ValidatorStats score={validatorData.performanceScore} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="map">
                <Card>
                  <CardHeader>
                    <CardTitle>Validator Location</CardTitle>
                    <CardDescription>Your validator's geographic position in the network</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ValidatorMap />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="system" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>System Health</CardTitle>
                      <CardDescription>Current resource utilization</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">CPU Usage</span>
                            <span className="text-sm text-muted-foreground">{validatorData.cpuUsage}%</span>
                          </div>
                          <Progress value={validatorData.cpuUsage} className="h-2" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Memory Usage</span>
                            <span className="text-sm text-muted-foreground">{validatorData.memoryUsage}%</span>
                          </div>
                          <Progress value={validatorData.memoryUsage} className="h-2" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Disk Usage</span>
                            <span className="text-sm text-muted-foreground">{validatorData.diskUsage}%</span>
                          </div>
                          <Progress value={validatorData.diskUsage} className="h-2" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Network Usage</span>
                            <span className="text-sm text-muted-foreground">{validatorData.networkUsage}%</span>
                          </div>
                          <Progress value={validatorData.networkUsage} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Validator Requirements</CardTitle>
                      <CardDescription>Minimum system requirements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">CPU</span>
                          <span className="text-sm">2+ cores</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">RAM</span>
                          <span className="text-sm">4+ GB</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Storage</span>
                          <span className="text-sm">20+ GB SSD</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Connection</span>
                          <span className="text-sm">10+ Mbps, Stable</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Uptime</span>
                          <span className="text-sm">95%+ recommended</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        } />
        <Route path="/settings" element={<ValidatorSettings />} />
      </Routes>
    </DashboardLayout>
  );
};

export default ValidatorDashboard;