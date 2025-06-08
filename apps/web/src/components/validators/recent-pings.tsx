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
  validatorId: number;
  location: string;
}

interface RecentPingsProps {
  validatorId: number | null;
  onNewPing?: (ping: LogEntry) => void;
}

const formatTime = (timestamp: string) => {
  const then = new Date(timestamp).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
};

const RecentPings: React.FC<RecentPingsProps> = ({ validatorId, onNewPing }) => {
  const [pings, setPings] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const lastPingIdsRef = useRef<Set<string>>(new Set());

  const load = async () => {
    if (!validatorId) return;
    try {
      const res = await fetch(`/api/logs?validatorId=${validatorId}`);
      if (!res.ok) return;
      const data = await res.json();
      const logs = data.success ? data.logs : [];
      
      // Deduplicate logs by site, timestamp, and validatorId, and filter out validatorId === 0
      const seen = new Set();
      const uniqueLogs = [];
      for (const log of logs) {
        if (log.validatorId === 0) continue; // Skip aggregator logs
        const key = `${log.site}-${log.timestamp}-${log.validatorId}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueLogs.push(log);
        }
      }
      
      // Sort by timestamp and take the most recent 15
      const sortedLogs = uniqueLogs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15);
      
      setPings(sortedLogs);
      setLoading(false);
      lastUpdateRef.current = Date.now();
      // Notify parent if a new ping is detected
      const newPingIds = new Set(sortedLogs.map(p => `${p.site}-${p.timestamp}-${p.validatorId}`));
      for (const log of sortedLogs) {
        const key = `${log.site}-${log.timestamp}-${log.validatorId}`;
        if (!lastPingIdsRef.current.has(key) && onNewPing) {
          onNewPing(log);
        }
      }
      lastPingIdsRef.current = newPingIds;
    } catch (e) {
      console.error('Failed to load recent pings', e);
    }
  };

  useEffect(() => {
    if (validatorId) {
      setLoading(true);
      load();
      // Refresh more frequently (every 5 seconds) to catch retries
      intervalRef.current = setInterval(load, 5000);
    } else {
      setPings([]);
      setLoading(false);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [validatorId]);

  return (
    <ScrollArea className="h-[240px]">
      <div className="space-y-3">
        {!validatorId ? null : (
          loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-3 w-[80px]" />
                </div>
                <Skeleton className="h-6 w-[60px]" />
              </div>
            ))
          ) : (
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
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    {ping.status === 'UP' ? (
                      <>
                        <span>{ping.latency}ms</span>
                        <span>•</span>
                        <span>{formatTime(ping.timestamp)}</span>
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
            ))
          )
        )}
      </div>
    </ScrollArea>
  );
};

export default RecentPings;
