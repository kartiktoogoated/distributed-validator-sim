/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/validators/ping-chart.tsx
import { useState, useEffect, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'

interface LogEntry {
  timestamp: string
  latency: number
}

interface MinuteBucket {
  formattedTime: string
  pingTime: number | null
  isDown?: boolean
}

let historyCache: LogEntry[] | null = null
let historyCacheTime = 0

const formatLabel = (iso: string) => {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const entry = payload[0].payload as MinuteBucket
    if (entry.isDown) {
      return (
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-sm font-semibold text-red-500">Down</p>
          </CardContent>
        </Card>
      )
    }

    const pingTime = entry.pingTime!
    let quality: string, qualityColor: string
    if (pingTime < 60) {
      quality = 'Excellent'
      qualityColor = 'text-green-500'
    } else if (pingTime < 100) {
      quality = 'Good'
      qualityColor = 'text-blue-500'
    } else if (pingTime < 150) {
      quality = 'Fair'
      qualityColor = 'text-yellow-500'
    } else {
      quality = 'Poor'
      qualityColor = 'text-red-500'
    }

    return (
      <Card>
        <CardContent className="p-4 space-y-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm">
            Ping Time: <span className="font-semibold">{pingTime} ms</span>
          </p>
          <div className="flex items-center gap-1">
            <div className={qualityColor}>●</div>
            <span className="text-xs">{quality}</span>
          </div>
        </CardContent>
      </Card>
    )
  }
  return null
}

export interface PingChartProps {
  isStarted: boolean
}

const PingChart: React.FC<PingChartProps> = ({ isStarted }) => {
  const [data, setData] = useState<MinuteBucket[]>([])
  const wsRef = useRef<WebSocket>()

  // 1) initial load once:
  useEffect(() => {
    const loadHistory = async () => {
      const now = Date.now()
      if (historyCache && now - historyCacheTime < 5_000) {
        const slice = historyCache
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .slice(-60)
          .map((log) => ({
            formattedTime: formatLabel(log.timestamp),
            pingTime: log.latency === 0 ? null : log.latency,
            isDown: log.latency === 0,
          }))
        setData(slice)
        return
      }
      try {
        const res = await fetch('/api/logs')
        if (res.status === 429) return
        const json = await res.json()
        if (json.success && Array.isArray(json.logs)) {
          historyCache = json.logs
          historyCacheTime = now
          const slice = (json.logs as LogEntry[])
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .slice(-60)
            .map((log) => ({
              formattedTime: formatLabel(log.timestamp),
              pingTime: log.latency === 0 ? null : log.latency,
              isDown: log.latency === 0,
            }))
          setData(slice)
        }
      } catch (e) {
        console.error('Failed to load logs for chart', e)
      }
    }

    loadHistory()
  }, [])

  // 2) polling only when started
  useEffect(() => {
    if (!isStarted) return
    const id = setInterval(() => {
      fetch('/api/logs')
        .then((r) => (r.status === 429 ? null : r.json()))
        .then((json: any) => {
          if (json?.success && Array.isArray(json.logs)) {
            historyCache = json.logs
            historyCacheTime = Date.now()
            const slice = (json.logs as LogEntry[])
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
              .slice(-60)
              .map((log) => ({
                formattedTime: formatLabel(log.timestamp),
                pingTime: log.latency === 0 ? null : log.latency,
                isDown: log.latency === 0,
              }))
            setData(slice)
          }
        })
        .catch(() => {})
    }, 30_000)
    return () => clearInterval(id)
  }, [isStarted])

  // 3) websocket only updates UI when started
  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const socket = new WebSocket(`${proto}://${window.location.host}/api/ws`)
    wsRef.current = socket

    socket.onmessage = (ev) => {
      if (!isStarted) return
      try {
        const msg = JSON.parse(ev.data) as {
          timeStamp: string
          consensus: 'UP' | 'DOWN'
          responseTime?: number
        }
        const isDown = msg.consensus === 'DOWN'
        const pingTime = isDown ? null : msg.responseTime ?? null
        setData((prev) => [
          ...prev.slice(-59),
          {
            formattedTime: formatLabel(msg.timeStamp),
            pingTime,
            isDown,
          },
        ])
      } catch {
        // ignore
      }
    }

    return () => {
      socket.close()
    }
  }, [isStarted])

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="formattedTime"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            domain={[0, 'dataMax + 10']}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(v) => `${v} ms`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="pingTime"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{
              r: 4,
              stroke: 'hsl(var(--primary))',
              strokeWidth: 2,
              fill: 'hsl(var(--background))',
            }}
            activeDot={{
              r: 6,
              stroke: 'hsl(var(--background))',
              strokeWidth: 2,
            }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PingChart
