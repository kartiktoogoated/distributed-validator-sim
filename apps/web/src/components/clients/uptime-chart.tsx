/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

interface UptimeChartProps {
  siteId: number;
}

interface HistoryLog {
  status: 'UP' | 'DOWN';
  timestamp: string;
}

const UptimeChart = ({ siteId }: UptimeChartProps) => {
  const [data, setData] = useState<{ date: string; uptime: number }[]>([]);
  const token = localStorage.getItem('token')!;
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchHistory = async () => {
      const res = await fetch(`/api/websites/${siteId}/history?limit=1000`, { headers });
      if (!res.ok) return;
      const json = await res.json();
      const logs: HistoryLog[] = json.logs;

      // group by day
      const byDay: Record<string, { up: number; total: number }> = {};
      logs.forEach((l) => {
        const day = format(new Date(l.timestamp), 'MMM dd');
        if (!byDay[day]) byDay[day] = { up: 0, total: 0 };
        byDay[day].total++;
        if (l.status === 'UP') byDay[day].up++;
      });

      const chart = Object.entries(byDay)
        .map(([date, { up, total }]) => ({
          date,
          uptime: total > 0 ? Math.round((up / total) * 100) : 0,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setData(chart);
    };

    fetchHistory();
  }, [siteId]);

  const TooltipContent = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].value as number;
    return (
      <Card>
        <CardContent className="p-2 bg-card border border-border">
          <p className="text-sm">{label}</p>
          <p className="text-base font-semibold">{v}% uptime</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={TooltipContent} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }} />
          <Line type="monotone" dataKey="uptime" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UptimeChart;
