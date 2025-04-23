import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Demo data for recent pings
const generatePingData = () => {
  const websites = [
    'example.com',
    'test-api.cloud.com',
    'dashboard.app.io',
    'mail.service.com',
    'cdn.network.io',
    'login.secure.org',
    'payment.stripe.com',
    'static.cloudfront.net',
  ];
  
  const statuses = ['success', 'success', 'success', 'warning', 'success', 'error'];
  const timestamps = [];
  const now = Date.now();
  
  for (let i = 0; i < 15; i++) {
    timestamps.push(now - i * 60000 - Math.random() * 30000);
  }
  
  return Array.from({ length: 15 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const responseTime = status === 'error' ? 0 : Math.floor(50 + Math.random() * 200);
    
    return {
      id: i + 1,
      website: websites[Math.floor(Math.random() * websites.length)],
      status,
      responseTime,
      timestamp: timestamps[i],
    };
  }).sort((a, b) => b.timestamp - a.timestamp);
};

const RecentPings = () => {
  const [pings, setPings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPings(generatePingData());
      setLoading(false);
    }, 1000);
    
    // Add new pings periodically
    const interval = setInterval(() => {
      setPings(prev => {
        const newPing = {
          id: Date.now(),
          website: ['example.com', 'test-api.cloud.com', 'dashboard.app.io'][
            Math.floor(Math.random() * 3)
          ],
          status: ['success', 'success', 'success', 'warning', 'error'][
            Math.floor(Math.random() * 5)
          ],
          responseTime: Math.floor(50 + Math.random() * 200),
          timestamp: Date.now(),
        };
        
        return [newPing, ...prev.slice(0, 14)];
      });
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);
  
  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) {
      return `${seconds}s ago`;
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m ago`;
    } else {
      return `${Math.floor(seconds / 3600)}h ago`;
    }
  };
  
  return (
    <ScrollArea className="h-[240px]">
      <div className="space-y-3">
        {loading && (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
              <Skeleton className="h-6 w-[60px]" />
            </div>
          ))
        )}
        
        {!loading && pings.map((ping) => (
          <div 
            key={ping.id} 
            className={cn(
              "flex items-center justify-between p-2 rounded-md border border-transparent",
              "animate-in fade-in-0 slide-in-from-top-5 duration-300",
              ping.timestamp > Date.now() - 10000 && "border-primary/20 bg-primary/5"
            )}
            style={{ animationDelay: `${100 * (pings.indexOf(ping) % 5)}ms` }}
          >
            <div>
              <div className="font-medium">{ping.website}</div>
              <div className="text-sm text-muted-foreground flex items-center">
                {ping.status !== 'error' && (
                  <>
                    <span className="mr-2">{ping.responseTime}ms</span>
                    <span>{formatTime(ping.timestamp)}</span>
                  </>
                )}
                {ping.status === 'error' && (
                  <span className="text-destructive">Connection failed</span>
                )}
              </div>
            </div>
            <Badge variant={
              ping.status === 'success' ? 'default' : 
              ping.status === 'warning' ? 'warning' : 
              'destructive'
            }>
              {ping.status === 'success' ? 'OK' : 
               ping.status === 'warning' ? 'Slow' : 
               'Error'}
            </Badge>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default RecentPings;