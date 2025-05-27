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
      // Load data from all validators
      const [validator1Res, validator2Res] = await Promise.all([
        fetch('/api/logs?validatorId=1'),
        fetch('/api/logs?validatorId=2')
      ]);
      
      if (!validator1Res.ok || !validator2Res.ok) return;
      
      const [validator1Data, validator2Data] = await Promise.all([
        validator1Res.json(),
        validator2Res.json()
      ]);

      const allLogs = [
        ...(validator1Data.success ? validator1Data.logs : []),
        ...(validator2Data.success ? validator2Data.logs : [])
      ];

      // Sort by timestamp and take the most recent 15
      const sortedLogs = allLogs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 15);

      setPings(sortedLogs);
      setLoading(false);
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
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  {ping.status === 'UP' ? (
                    <>
                      <span>{ping.latency}ms</span>
                      <span>•</span>
                      <span>Validator {ping.validatorId}</span>
                      <span>•</span>
                      <span>{ping.location}</span>
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
          ))}
      </div>
    </ScrollArea>
  );
};

export default RecentPings;
