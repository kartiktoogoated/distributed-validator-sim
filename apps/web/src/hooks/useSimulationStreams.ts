/* eslint-disable no-empty */
// src/hooks/useSimulationStream.ts
import { useEffect, useRef, useState } from 'react'

export interface SimulationEvent {
  url: string
  consensus: 'UP' | 'DOWN'
  votes: { validatorId: number; status: 'UP'|'DOWN'; weight: number }[]
  timeStamp: string  // ISO
}

export function useSimulationStream(siteUrl: string) {
  const [events, setEvents] = useState<SimulationEvent[]>([])
  const wsRef = useRef<WebSocket| null>(null)

  useEffect(() => {
    if (!siteUrl) return
    const ws = new WebSocket(`ws://${window.location.host}`)
    wsRef.current = ws

    ws.onmessage = (ev) => {
      try {
        const payload: SimulationEvent = JSON.parse(ev.data)
        if (payload.url === siteUrl) {
          setEvents(evts => {
            const next = [...evts, payload]
            // keep last 30 for uptime, last 24 for perf
            return next.slice(-100) 
          })
        }
      } catch {}
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [siteUrl])

  return events
}
