import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SitesListProps {
  sites: Array<{
    id: number;
    url: string;
    status: string;
    uptime: number;
    responseTime: number;
    lastChecked: string;
  }>;
  onSelect: (id: number) => void;
  selectedSite: number | null;
}

const SitesList = ({ sites, onSelect, selectedSite }: SitesListProps) => {
  return (
    <ScrollArea className="h-[400px]">
      <div className="px-1">
        {sites.map((site) => (
          <div
            key={site.id}
            className={cn(
              "flex flex-col space-y-1 px-3 py-2 cursor-pointer",
              "hover:bg-accent hover:text-accent-foreground rounded-md",
              "transition-colors",
              selectedSite === site.id && "bg-accent text-accent-foreground"
            )}
            onClick={() => onSelect(site.id)}
          >
            <div className="flex justify-between items-start">
              <div className="max-w-[160px] overflow-hidden">
                <div className="font-medium truncate">{new URL(site.url).hostname}</div>
                <div className="text-xs text-muted-foreground truncate">{site.url}</div>
              </div>
              <Badge variant={site.status === 'online' ? 'default' : 'destructive'} className="ml-auto">
                {site.status}
              </Badge>
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground pt-1">
              <span>{site.uptime.toFixed(1)}% uptime</span>
              <span>{site.lastChecked}</span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default SitesList;