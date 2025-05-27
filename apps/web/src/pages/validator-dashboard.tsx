/* eslint-disable @typescript-eslint/no-explicit-any */
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

interface DashboardData {
  uptime: number
  pingCount: number
  lastPing: string
  performanceScore: number
}

interface LogEntry {
  id: number
  validatorId: number
  region: string
  site: string
  status: 'UP' | 'DOWN'
  latency: number | null
  timestamp: string
}

const POLL_INTERVAL_MS = 60_000

const ValidatorDashboard: React.FC = () => {
  const [isStarted, setIsStarted] = useState(false)
  const [validatorId, setValidatorId] = useState<number | null>(null)
  const { toast } = useToast()
  const skipFirstToggle = useRef(true)
  const wsRef = useRef<WebSocket | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMounted = useRef(true)

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    uptime: 0,
    pingCount: 0,
    lastPing: '',
    performanceScore: 0,
  })

  const totalMessages = useRef(0)
  const totalUpPercent = useRef(0)

  // Get validator ID on mount
  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        if (data.validatorId) {
          setValidatorId(data.validatorId)
        }
      })
      .catch(err => {
        console.error('Failed to get validator ID:', err)
      })
  }, [])

  // Cleanup function for all resources
  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }

  // Initialize WebSocket connection with retry logic
  const initWebSocket = () => {
    if (!isMounted.current) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    cleanup() // Clean up any existing connections

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${window.location.host}/api/ws`)
    wsRef.current = ws

    ws.onopen = () => {
      console.info('WebSocket connected')
      // Reset counters on new connection
      totalMessages.current = 0
      totalUpPercent.current = 0
    }

    ws.onerror = (err) => {
      console.error('WebSocket error', err)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }

    ws.onmessage = (event) => {
      try {
        const { votes } = JSON.parse(event.data) as {
          votes: { status: 'UP' | 'DOWN'; weight: number }[]
        }
        const upCount = votes.filter((v) => v.status === 'UP').length
        const upPercent = Math.round((upCount / votes.length) * 100)

        totalMessages.current += 1
        totalUpPercent.current += upPercent

        setDashboardData((prev) => ({
          ...prev,
          performanceScore: upPercent,
          uptime:
            Math.round((totalUpPercent.current / totalMessages.current) * 10) /
            10,
        }))
      } catch (err) {
        console.error('Failed to parse WebSocket message', err)
      }
    }

    ws.onclose = () => {
      console.info('WebSocket disconnected')
      wsRef.current = null
      
      // Only attempt to reconnect if component is still mounted
      if (isMounted.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          initWebSocket()
        }, 5000)
      }
    }
  }

  // Fetch logs function with error handling
  const fetchLogs = async () => {
    if (!isMounted.current) return

    try {
      const res = await fetch('/api/logs')
      if (!res.ok) throw new Error('Failed to fetch logs')
      
      const { logs }: { logs: LogEntry[] } = await res.json()
      const sorted = logs.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      const count = sorted.length
      const upCount = sorted.filter((l) => l.status === 'UP').length
      const uptime = count ? Math.round((upCount / count) * 100) : 0
      const lastPing = sorted[0]?.timestamp || ''

      if (isMounted.current) {
        setDashboardData((prev) => ({
          ...prev,
          pingCount: count,
          uptime,
          lastPing,
        }))
      }
    } catch (err: any) {
      console.error('Failed to fetch logs', err)
      // Don't show toast for polling errors to avoid spam
    }
  }

  // Initialize WebSocket and start polling on mount
  useEffect(() => {
    isMounted.current = true
    initWebSocket()
    fetchLogs()
    pollingIntervalRef.current = setInterval(fetchLogs, POLL_INTERVAL_MS)

    return () => {
      isMounted.current = false
      cleanup()
    }
  }, [])

  // Handle validator start/stop with better error handling
  useEffect(() => {
    if (skipFirstToggle.current) {
      skipFirstToggle.current = false
      return
    }

    const path = isStarted ? '/api/simulate/start' : '/api/simulate/stop'
    fetch(path, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ validatorId })
    })
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({ message: 'Unknown error' }))
          throw new Error(error.message || 'Failed to toggle validator')
        }
        
        if (!isStarted) {
          // Reset counters when stopping
          totalMessages.current = 0
          totalUpPercent.current = 0
          setDashboardData(prev => ({
            ...prev,
            performanceScore: 0,
            uptime: 0
          }))
        }

        toast({
          title: isStarted ? 'Validator Started' : 'Validator Stopped',
          description: `Validator ${validatorId} is now ${isStarted ? 'running' : 'stopped'}`,
          variant: isStarted ? 'default' : 'destructive'
        })
      })
      .catch((err) => {
        console.error(`Failed to ${isStarted ? 'start' : 'stop'} validator`, err)
        toast({
          title: 'Error',
          description: err.message || 'Failed to toggle validator',
          variant: 'destructive',
        })
        setIsStarted((prev) => !prev)
      })
  }, [isStarted, toast, validatorId])

  const toggleValidator = () => {
    setIsStarted((prev) => !prev)
  }

  return (
    <DashboardLayout userType="validator">
      <Routes>
        <Route
          path="/"
          element={
            <div className="max-w-[1600px] mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Validator Dashboard
                  </h1>
                  <p className="text-muted-foreground">
                    {validatorId ? `Validator ${validatorId}` : 'Loading validator...'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={fetchLogs} variant="outline">
                    Reload
                  </Button>
                  <Button
                    onClick={toggleValidator}
                    disabled={!validatorId}
                    className={
                      isStarted
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-green-500 hover:bg-green-600'
                    }
                  >
                    {isStarted ? 'Stop Validator' : 'Start Validator'}
                  </Button>
                </div>
              </div>

              {/* Summary */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                    <Progress
                      value={dashboardData.uptime}
                      className="h-2 mt-3"
                    />
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 bg-primary text-white py-1 px-3 rotate-45 text-xs font-semibold">
                    Coming Soon
                  </div>
                  <CardHeader className="flex justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Earnings</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
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
                        <PingChart isStarted={isStarted} />
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
                        <RecentPings isStarted={isStarted} />
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
                        Your validator's geographic position in the network
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ValidatorMap />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="system" className="space-y-4">
                  {/* …system stats panels unchanged… */}
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