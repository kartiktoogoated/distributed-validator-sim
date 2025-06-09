// src/components/validators/recent-pings.tsx
import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: number;
  validatorId: number;
  site: string;
  status: 'UP' | 'DOWN';
  latency: number | null;
  timestamp: string;
  location: string;
}

interface RecentPingsProps {
  validatorId: number | null;
  logs: LogEntry[];
  onNewPing?: (ping: LogEntry) => void;
}

const formatTime = (timestamp: string) => {
  const then = new Date(timestamp).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
};

const RecentPings: React.FC<RecentPingsProps> = ({ validatorId, logs, onNewPing }) => {
  const [pings, setPings] = useState<LogEntry[]>([]);
  const lastPingIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!validatorId) {
      setPings([]);
      return;
    }

    // Deduplicate logs by site, timestamp, and validatorId
    const seen = new Set<string>();
    const uniqueLogs = logs.filter(log => {
      if (log.validatorId === 0) return false; // Skip aggregator logs
      const key = `${log.site}-${log.timestamp}-${log.validatorId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by timestamp and take the most recent 15
    const sortedLogs = uniqueLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15);

    setPings(sortedLogs);

    // Notify parent if a new ping is detected
    const newPingIds = new Set(sortedLogs.map(p => `${p.site}-${p.timestamp}-${p.validatorId}`));
    for (const log of sortedLogs) {
      const key = `${log.site}-${log.timestamp}-${log.validatorId}`;
      if (!lastPingIdsRef.current.has(key) && onNewPing) {
        onNewPing(log);
      }
    }
    lastPingIdsRef.current = newPingIds;
  }, [validatorId, logs, onNewPing]);

  return (
    <ScrollArea className="h-[240px]">
      <div className="space-y-3">
        {!validatorId ? null : (
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
        )}
      </div>
    </ScrollArea>
  );
};

export default RecentPings;
