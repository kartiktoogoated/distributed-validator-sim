import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

interface ResponseTimeChartProps {
  siteId: number;
}

// Generate fake response time data
const generateResponseTimeData = (hours = 24) => {
  const data = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const date = new Date();
    date.setHours(now.getHours() - i);
    
    let responseTime: number;
    if (i % 6 === 0) {
      responseTime = Math.round(150 + Math.random() * 100);
    } else if (i % 8 === 0) {
      responseTime = Math.round(50 + Math.random() * 30);
    } else {
      responseTime = Math.round(80 + Math.random() * 70);
    }
    
    data.push({
      time: date,
      responseTime,
      formattedTime: format(date, 'HH:mm'),
    });
  }
  
  return data;
};

const ResponseTimeChart = ({ siteId }: ResponseTimeChartProps) => {
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    setData(generateResponseTimeData());
  }, [siteId]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const responseTime = payload[0].value as number;
      let status: string, statusColor: string;
      
      if (responseTime < 100) {
        status = 'Excellent';
        statusColor = 'text-green-500';
      } else if (responseTime < 150) {
        status = 'Good';
        statusColor = 'text-blue-500';
      } else if (responseTime < 200) {
        status = 'Fair';
        statusColor = 'text-yellow-500';
      } else {
        status = 'Slow';
        statusColor = 'text-red-500';
      }
      
      return (
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-sm">
              Response Time: <span className="font-semibold">{responseTime} ms</span>
            </p>
            <div className="flex items-center gap-1">
              <div className={statusColor}>●</div>
              <span className="text-xs">{status}</span>
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
        <AreaChart
          data={data}
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          {/* grid */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.3}
          />
          {/* X axis */}
          <XAxis 
            dataKey="formattedTime"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            interval="preserveStartEnd"
          />
          {/* Y axis */}
          <YAxis 
            domain={['dataMin - 20', 'dataMax + 20']}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={v => `${v} ms`}
          />

          <Tooltip content={<CustomTooltip />} />

          <defs>
            <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey="responseTime"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#colorResponse)"
            fillOpacity={1}
            activeDot={{
              r: 6,
              stroke: 'hsl(var(--background))',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResponseTimeChart;
