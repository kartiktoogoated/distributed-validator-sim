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
    
    // Add some variation
    if (i % 7 === 0) {
      uptime = Math.round(Math.max(85, 100 - Math.random() * 15));
    } else if (i % 11 === 0) {
      uptime = Math.round(Math.max(70, 100 - Math.random() * 30));
    } else {
      uptime = Math.round(Math.max(98, 100 - Math.random() * 2));
    }
    
    data.push({
      date: date,
      uptime: uptime,
      formattedDate: format(date, 'MMM dd'),
    });
  }
  
  return data;
};

const UptimeChart = ({ siteId }: UptimeChartProps) => {
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    // Generate new data when the site changes
    setData(generateUptimeData());
  }, [siteId]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const uptimeValue = payload[0].value as number;
      
      return (
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-sm">
              Uptime: <span className="font-semibold">{uptimeValue}%</span>
            </p>
            <div className="flex items-center gap-1">
              <div className={uptimeValue >= 99 ? "text-green-500" : uptimeValue >= 95 ? "text-yellow-500" : "text-red-500"}>
                ●
              </div>
              <span className="text-xs">{
                uptimeValue >= 99 ? "Good" : 
                uptimeValue >= 95 ? "Warning" : 
                "Critical"
              }</span>
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
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
          <XAxis 
            dataKey="formattedDate" 
            tick={{ fontSize: 12 }} 
            stroke="var(--muted-foreground)"
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12 }} 
            stroke="var(--muted-foreground)"
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="linear" 
            dataKey="uptime" 
            stroke="var(--primary)" 
            strokeWidth={2} 
            dot={false} 
            activeDot={{ r: 6, stroke: 'var(--background)', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UptimeChart;