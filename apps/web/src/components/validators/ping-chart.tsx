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
  pingTime: number
}

// ─── module-level cache ──────────────────────────────────────────────
let historyCache: LogEntry[] | null = null
let historyCacheTime = 0

// Turn ISO → "HH:MM"
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
    const pingTime = payload[0].value as number
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

const PingChart = () => {
  const [data, setData] = useState<MinuteBucket[]>([])
  const wsRef = useRef<WebSocket>()

  // load last 60 logs, but only once per minute
  const loadHistory = async () => {
    const now = Date.now()
    if (historyCache && now - historyCacheTime < 60_000) {
      // reuse cached
      const slice = historyCache
        .sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        .slice(-60)
        .map((log) => ({
          formattedTime: formatLabel(log.timestamp),
          pingTime: log.latency,
        }))
      setData(slice)
      return
    }

    try {
      const res = await fetch('/api/logs')
      if (res.status === 429) {
        console.warn('PingChart: rate-limited, skip this fetch')
        return
      }
      const json = await res.json()
      if (json.success) {
        historyCache = json.logs
        historyCacheTime = now
        const slice = (json.logs as LogEntry[])
          .sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
          .slice(-60)
          .map((log) => ({
            formattedTime: formatLabel(log.timestamp),
            pingTime: log.latency,
          }))
        setData(slice)
      }
    } catch (e) {
      console.error('Failed to load logs for chart', e)
    }
  }

  useEffect(() => {
    loadHistory()

    // live WS hookup
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const socket = new WebSocket(`${proto}://${window.location.host}/api`)
    wsRef.current = socket

    socket.onopen = () => console.info('PingChart WS open')
    socket.onerror = (err) => console.error('PingChart WS error', err)

    socket.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data) as {
          timeStamp: string
          responseTime: number
        }
        setData((prev) => [
          ...prev.slice(-59),
          {
            formattedTime: formatLabel(msg.timeStamp),
            pingTime: msg.responseTime,
          },
        ])
      } catch {
        // ignore non-ping messages
      }
    }

    const id = setInterval(loadHistory, 60_000)
    return () => {
      clearInterval(id)
      socket.close()
    }
  }, [])

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.3}
          />
          <XAxis
            dataKey="formattedTime"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            domain={['dataMin - 10', 'dataMax + 10']}
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
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PingChart
