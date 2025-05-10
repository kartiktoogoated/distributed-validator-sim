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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/logs?validatorId=0');
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.logs)) {
        setPings(json.logs.slice(0, 15));
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

  // 2) start/stop polling when isStarted changes
  useEffect(() => {
    if (isStarted) {
      intervalRef.current = setInterval(load, 10_000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
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
                <div className="text-sm text-muted-foreground flex items-center">
                  {ping.status === 'UP' ? (
                    <>
                      <span className="mr-2">{ping.latency}ms</span>
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
          ))}
      </div>
    </ScrollArea>
  );
};

export default RecentPings;
