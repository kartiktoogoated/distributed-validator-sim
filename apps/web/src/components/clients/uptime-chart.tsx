/* eslint-disable @typescript-eslint/no-explicit-any */
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

// Generate fake uptime data
const generateUptimeData = (days = 30) => {
  const data = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    
    // Generate mostly high uptime values with occasional dips
    let uptime = 100;
    if (i % 7 === 0) {
      uptime = Math.round(Math.max(85, 100 - Math.random() * 15));
    } else if (i % 11 === 0) {
      uptime = Math.round(Math.max(70, 100 - Math.random() * 30));
    } else {
      uptime = Math.round(Math.max(98, 100 - Math.random() * 2));
    }
    
    data.push({
      date,
      uptime,
      formattedDate: format(date, 'MMM dd'),
    });
  }
  
  return data;
};

const UptimeChart = ({ siteId }: UptimeChartProps) => {
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    setData(generateUptimeData());
  }, [siteId]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const uptimeValue = payload[0].value as number;
      const dotColor =
        uptimeValue >= 99 ? 'text-green-500' :
        uptimeValue >= 95 ? 'text-yellow-500' :
        'text-red-500';
      const statusText =
        uptimeValue >= 99 ? 'Good' :
        uptimeValue >= 95 ? 'Warning' :
        'Critical';
      
      return (
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-sm">
              Uptime: <span className="font-semibold">{uptimeValue}%</span>
            </p>
            <div className="flex items-center gap-1">
              <div className={dotColor}>●</div>
              <span className="text-xs">{statusText}</span>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  };
  
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          {/* grid lines */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.3}
          />
          
          {/* X axis */}
          <XAxis 
            dataKey="formattedDate"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            interval="preserveStartEnd"
          />
          
          {/* Y axis */}
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={v => `${v}%`}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* uptime line */}
          <Line 
            type="linear"
            dataKey="uptime"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 6,
              stroke: 'hsl(var(--background))',
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UptimeChart;
