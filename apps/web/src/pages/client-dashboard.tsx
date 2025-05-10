/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import DashboardLayout from '@/components/layout/dashboard-layout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import SitesList from '@/components/clients/sites-list'
import AddSiteDialog, { Website as NewWebsite } from '@/components/clients/add-site-dialog'
import ValidatorSelection from '@/components/clients/validator-selection'
import UptimeChart from '@/components/clients/uptime-chart'
import ResponseTimeChart from '@/components/clients/response-time-chart'
import ClientMap from '@/components/clients/client-map'
import ClientSettings from '@/components/clients/client-settings'
import { useToast } from '@/hooks/use-toast'
import { Plus, Globe, Activity, Clock, Zap, ExternalLink } from 'lucide-react'
import { comingSoon } from '@/lib/utils'

interface WebsiteSummary {
  id: number
  url: string
  description?: string
  status: 'online' | 'offline'
  uptime: number
  responseTime: number
  lastChecked: string
}

const ClientDashboard: React.FC = () => {
  const [sites, setSites] = useState<WebsiteSummary[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)
  const [showAddSite, setShowAddSite] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')

  // 1) Load sites + summaries
  const loadSites = async () => {
    if (!token) {
      toast({ title: 'Not logged in', variant: 'destructive' })
      navigate('/login', { replace: true, state: { from: location } })
      return
    }

    try {
      // fetch list
      const listRes = await fetch('/api/websites', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (listRes.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      if (!listRes.ok) throw new Error('Failed to fetch websites')
      const { websites }: { websites: Array<{ id: number; url: string }> } =
        await listRes.json()

      // enrich each with real summary (including latency)
      const enriched = await Promise.all(
        websites.map(async (w) => {
          const sumRes = await fetch(`/api/websites/${w.id}/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!sumRes.ok) throw new Error('Failed to fetch summary')
          // pull latency from summary
          const {
            status: rawStatus,
            uptime: upStr,
            lastChecked,
            latency,
          } = (await sumRes.json()) as {
            status: string
            uptime: string
            lastChecked: string | null
            latency: number | null
          }

          const isUp = rawStatus.toUpperCase() === 'UP'
          const numUp = parseFloat(upStr) || 0

          return {
            id: w.id,
            url: w.url,
            status: isUp ? 'online' : 'offline',
            uptime: numUp,
            responseTime: latency ?? 0,
            lastChecked: lastChecked
              ? new Date(lastChecked).toLocaleString()
              : '—',
          } as WebsiteSummary
        })
      )

      setSites(enriched)
      if (enriched.length && !enriched.find((s) => s.id === selectedSiteId)) {
        setSelectedSiteId(enriched[0].id)
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadSites()
  }, [])

  // filtered by search
  const filteredSites = sites.filter((s) =>
    s.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // add & reload
  const addNewSite = (website: NewWebsite) => {
    setShowAddSite(false)
    toast({ title: 'Website Added', description: `Now monitoring ${website.url}` })
    loadSites()
    setSelectedSiteId(Number(website.id))
  }

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || null
  const siteCount = sites.length
  const avgUptime = siteCount
    ? (sites.reduce((sum, s) => sum + s.uptime, 0) / siteCount).toFixed(1)
    : '0'

  // ** NEW: compute average response time **
  const avgResponseTime = siteCount
    ? Math.round(sites.reduce((sum, s) => sum + s.responseTime, 0) / siteCount)
    : 0

  return (
    <DashboardLayout userType="client">
      <Routes>
        <Route
          path="/"
          element={
            <div className="max-w-[1600px] mx-auto space-y-6">
              {/* header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">Client Dashboard</h1>
                  <p className="text-muted-foreground">
                    Monitor your websites using our distributed validator network
                  </p>
                </div>
                <Button onClick={() => setShowAddSite(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Website
                </Button>
              </div>

              {/* stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex justify-between pb-2">
                    <CardTitle className="text-sm">Websites</CardTitle>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{siteCount}</div>
                    <p className="text-xs text-muted-foreground">Monitored websites</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex justify-between pb-2">
                    <CardTitle className="text-sm">Average Uptime</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{avgUptime}%</div>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex justify-between pb-2">
                    <CardTitle className="text-sm">Response Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {avgResponseTime}ms
                    </div>
                    <p className="text-xs text-muted-foreground">Average</p>
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 bg-primary text-white py-1 px-3 rotate-45 text-xs font-semibold">
                    Coming Soon
                  </div>
                  <CardHeader className="flex justify-between pb-2">
                    <CardTitle className="text-sm">Validators</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold opacity-75">—</div>
                    <Button variant="ghost" size="sm" onClick={comingSoon}>
                      Node selection coming soon
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* list + analytics */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
                {/* Sites list */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle>Websites</CardTitle>
                    <CardDescription>Your monitored sites</CardDescription>
                    <div className="mt-2">
                      <Input
                        placeholder="Search websites…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <SitesList
                      sites={filteredSites}
                      onSelect={setSelectedSiteId}
                      selectedSite={selectedSiteId}
                    />
                  </CardContent>
                  <CardFooter className="border-t p-4">
                    <Button variant="outline" onClick={() => setShowAddSite(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Add New
                    </Button>
                  </CardFooter>
                </Card>

                {/* analytics */}
                <Card className="md:col-span-3">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Website Analytics</CardTitle>
                        <CardDescription>
                          {selectedSite?.url || 'Select a website'}
                        </CardDescription>
                      </div>
                      {selectedSite && (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              selectedSite.status === 'online'
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {selectedSite.status === 'online'
                              ? 'Online'
                              : 'Offline'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(selectedSite.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedSite ? (
                      <Tabs defaultValue="uptime">
                        <TabsList className="mb-4">
                          <TabsTrigger value="uptime">Uptime</TabsTrigger>
                          <TabsTrigger value="performance">Performance</TabsTrigger>
                          <TabsTrigger value="locations">Validators</TabsTrigger>
                        </TabsList>
                        <TabsContent value="uptime">
                          <UptimeChart siteId={selectedSite.id} />
                        </TabsContent>
                        <TabsContent value="performance">
                          <ResponseTimeChart
                            siteId={selectedSite.id}
                            siteUrl={selectedSite.url}
                          />
                        </TabsContent>
                        <TabsContent value="locations">
                          <ClientMap />
                        </TabsContent>
                      </Tabs>
                    ) : (
                      <div className="py-12 text-center text-muted-foreground">
                        <Globe className="h-12 w-12 mb-4 opacity-20" />
                        <h3 className="text-lg font-medium">No Website Selected</h3>
                        <p>Select a website to view analytics</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* validator selection + dialog */}
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
              </Card>

              <AddSiteDialog
                open={showAddSite}
                onOpenChange={setShowAddSite}
                onAdd={addNewSite}
              />
            </div>
          }
        />
        {/* ← here is your new settings route */}
        <Route path="/settings" element={<ClientSettings />} />
      </Routes>
    </DashboardLayout>
  )
}

export default ClientDashboard
