// src/components/validators/recent-pings.tsx
import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: number;
  site: string;
  status: 'UP' | 'DOWN';
  latency: number;
  timestamp: string;
  validatorId?: number;
  location?: string;
  responseTime?: number;
}

interface RecentPingsProps {
  isStarted: boolean;
}

const formatTime = (timestamp: string) => {
  const then = new Date(timestamp).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
};

const RecentPings: React.FC<RecentPingsProps> = ({ isStarted }) => {
  const [pings, setPings] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/logs');
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.logs)) {
        // Sort by timestamp and get the most recent 15 pings
        const sorted = json.logs
          .sort((a: LogEntry, b: LogEntry) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 15);
        setPings(sorted);
        setLoading(false);
      }
    } catch (e) {
      console.error('Failed to load recent pings', e);
    }
  };

  // 1) initial load on mount
  useEffect(() => {
    load();
  }, []);

  // 2) WebSocket for real-time updates
  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${window.location.host}/api/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.info('WebSocket connected for pings');
      // Load initial state
      load();
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'individual-ping') {
          setPings((prev) => [
            {
              id: Date.now() + Math.random(),
              timestamp: data.timestamp,
              status: data.status,
              latency: data.latency,
              site: data.url || 'Unknown',
              validatorId: data.validatorId,
              location: data.location,
            },
            ...prev,
          ].slice(0, 15));
        } else if (data.timeStamp && data.consensus && Array.isArray(data.votes)) {
          // For each validator's vote, add a ping
          setPings((prev) => {
            const newPings = data.votes.map((vote: LogEntry) => ({
              id: Date.now() + Math.random(), // ensure unique
              timestamp: data.timeStamp,
              status: vote.status,
              latency: (vote.responseTime !== undefined ? vote.responseTime : vote.latency) || 0,
              site: data.url || 'Unknown',
              validatorId: vote.validatorId,
              location: vote.location
            }));
            // Prepend new pings, keep only the latest 15
            return [...newPings, ...prev].slice(0, 15);
          });
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message', e);
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // 3) Polling backup (every 30s) when started
  useEffect(() => {
    if (!isStarted) return;
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [isStarted]);

  return (
    <ScrollArea className="h-[240px]">
      <div className="space-y-3">
        {loading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
              <Skeleton className="h-6 w-[60px]" />
            </div>
          ))}

        {!loading &&
          pings.map((ping) => (
            <div
              key={ping.id}
              className={cn(
                'flex items-center justify-between p-2 rounded-md border border-transparent',
                'animate-in fade-in-0 slide-in-from-top-5 duration-300',
                Date.now() - new Date(ping.timestamp).getTime() < 10_000
                  ? 'border-primary/20 bg-primary/5'
                  : ''
              )}
              style={{ animationDelay: `${100 * (pings.indexOf(ping) % 5)}ms` }}
            >
              <div>
                <div className="font-medium">{ping.site}</div>
                <div className="text-sm text-muted-foreground flex items-center space-x-2">
                  {ping.status === 'UP' ? (
                    <>
                      <span>{ping.latency}ms</span>
                      <span>•</span>
                      <span>{formatTime(ping.timestamp)}</span>
                      {ping.validatorId && (
                        <>
                          <span>•</span>
                          <span>Validator {ping.validatorId}</span>
                        </>
                      )}
                      {ping.location && (
                        <>
                          <span>•</span>
                          <span>{ping.location}</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-destructive">Connection failed</span>
                  )}
                </div>
              </div>
              <Badge
                variant={ping.status === 'UP' ? 'default' : 'destructive'}
              >
                {ping.status === 'UP' ? 'OK' : 'Error'}
              </Badge>
            </div>
          ))}
      </div>
    </ScrollArea>
  );
};

export default RecentPings;
