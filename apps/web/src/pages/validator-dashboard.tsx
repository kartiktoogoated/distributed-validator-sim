// src/pages/ValidatorDashboard.tsx
import { useState, useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router-dom'
import DashboardLayout from '@/components/layout/dashboard-layout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { ArrowUpRight, Clock, Server, Activity } from 'lucide-react'
import RecentPings from '@/components/validators/recent-pings'
import ValidatorStats from '@/components/validators/validator-stats'
import ValidatorMap from '@/components/validators/validator-map'
import ValidatorSettings from '@/components/validators/validator-settings'
import PingChart from '@/components/validators/ping-chart'
import { comingSoon } from '@/lib/utils'

type DashboardData = {
  uptime: number
  pingCount: number
  lastPing: string
  performanceScore: number
}

const ValidatorDashboard = () => {
  const [isStarted, setIsStarted] = useState(
    localStorage.getItem('validatorStarted') === 'true'
  )
  const { toast } = useToast()

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    uptime: 0,
    pingCount: 0,
    lastPing: '',
    performanceScore: 0,
  })

  const totalMessages = useRef(0)
  const totalUpPercent = useRef(0)

  useEffect(() => {
    // kick off the server’s simulation loop
    fetch('/api/simulate').catch(console.error)

    // open WS for consensus broadcasts (connect to backend on 3000)
    const ws = new WebSocket('ws://localhost:3000')

    ws.onopen = () => console.info('WebSocket connected')
    ws.onerror = (err) => console.error('WebSocket error', err)

    ws.onmessage = (event) => {
      const { votes, timeStamp } = JSON.parse(event.data) as {
        votes: { status: 'UP' | 'DOWN'; weight: number }[]
        timeStamp: string
      }

      // compute UP%
      const upCount = votes.filter((v) => v.status === 'UP').length
      const upPercent = Math.round((upCount / votes.length) * 100)

      totalMessages.current += 1
      totalUpPercent.current += upPercent

      setDashboardData((prev) => ({
        pingCount: prev.pingCount + 1,
        lastPing: timeStamp,
        performanceScore: upPercent,
        uptime:
          Math.round((totalUpPercent.current / totalMessages.current) * 10) / 10,
      }))
    }

    return () => {
      ws.close()
    }
  }, [])

  const toggleValidator = () => {
    const next = !isStarted
    setIsStarted(next)
    localStorage.setItem('validatorStarted', next.toString())
    toast({
      title: next ? 'Validator Started' : 'Validator Stopped',
      description: next
        ? 'Your validator is now active and pinging websites.'
        : 'Your validator has been stopped.',
    })
  }

  return (
    <DashboardLayout userType="validator">
      <Routes>
        <Route
          path="/"
          element={
            <div className="max-w-[1600px] mx-auto space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Validator Dashboard
                  </h1>
                  <p className="text-muted-foreground">
                    Monitor and manage your validator node
                  </p>
                </div>
                <Button
                  onClick={toggleValidator}
                  className={
                    isStarted
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-green-500 hover:bg-green-600'
                  }
                >
                  {isStarted ? 'Stop Validator' : 'Start Validator'}
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Status */}
                <Card>
                  <CardHeader className="flex justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          isStarted ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <div className="text-2xl font-bold">
                        {isStarted ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isStarted
                        ? 'Validator is running'
                        : 'Validator is offline'}
                    </p>
                  </CardContent>
                </Card>

                {/* Uptime */}
                <Card>
                  <CardHeader className="flex justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardData.uptime}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last 30 days
                    </p>
                    <Progress value={dashboardData.uptime} className="h-2 mt-3" />
                  </CardContent>
                </Card>

                {/* Earnings */}
                <Card className="relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 bg-primary text-white py-1 px-3 rotate-45 text-xs font-semibold">
                    Coming Soon
                  </div>
                  <CardHeader className="flex justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Earnings</CardTitle>
                    <svg
                      className="h-4 w-4 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 4L4 8L12 12L20 8L12 4Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4 16L12 20L20 16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4 12L12 16L20 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold opacity-75">—</div>
                    <Button
                      variant="ghost"
                      className="text-xs text-muted-foreground p-0 h-auto"
                      onClick={comingSoon}
                    >
                      Token rewards launching soon
                    </Button>
                  </CardContent>
                </Card>

                {/* Pings */}
                <Card>
                  <CardHeader className="flex justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pings</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardData.pingCount}
                    </div>
                    <div className="flex items-center pt-1 text-green-500 text-sm">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      {dashboardData.performanceScore}% from last message
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
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
                        <CardDescription>
                          Average response time over the last 24 hours
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pl-2">
                        <PingChart />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Pings</CardTitle>
                        <CardDescription>
                          Latest website pings from your validator
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <RecentPings />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Performance Score</CardTitle>
                        <CardDescription>
                          Based on response time, uptime, and consistency
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ValidatorStats score={dashboardData.performanceScore} />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="map">
                  <Card>
                    <CardHeader>
                      <CardTitle>Validator Location</CardTitle>
                      <CardDescription>
                        Your validator’s geographic position in the network
                      </CardDescription>
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
                        <CardDescription>
                          Current resource utilization
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">
                                CPU Usage
                              </span>
                              <span className="text-sm text-muted-foreground">
                                0%
                              </span>
                            </div>
                            <Progress value={0} className="h-2" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">
                                Memory Usage
                              </span>
                              <span className="text-sm text-muted-foreground">
                                0%
                              </span>
                            </div>
                            <Progress value={0} className="h-2" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">
                                Disk Usage
                              </span>
                              <span className="text-sm text-muted-foreground">
                                0%
                              </span>
                            </div>
                            <Progress value={0} className="h-2" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">
                                Network Usage
                              </span>
                              <span className="text-sm text-muted-foreground">
                                0%
                              </span>
                            </div>
                            <Progress value={0} className="h-2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Validator Requirements</CardTitle>
                        <CardDescription>
                          Minimum system requirements
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            ['CPU', '2+ cores'],
                            ['RAM', '4+ GB'],
                            ['Storage', '20+ GB SSD'],
                            ['Connection', '10+ Mbps, Stable'],
                            ['Uptime', '95%+ recommended'],
                          ].map(([k, v]) => (
                            <div
                              key={k}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm font-medium">{k}</span>
                              <span className="text-sm">{v}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          }
        />
        <Route path="/settings" element={<ValidatorSettings />} />
      </Routes>
    </DashboardLayout>
  )
}

export default ValidatorDashboard
