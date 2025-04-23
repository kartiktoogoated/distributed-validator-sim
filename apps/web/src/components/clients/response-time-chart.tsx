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
    
    // Generate realistic response times between 50-250ms with some variations
    let responseTime;
    
    if (i % 6 === 0) {
      // Add some spikes every 6 hours
      responseTime = Math.round(150 + Math.random() * 100);
    } else if (i % 8 === 0) {
      // Add some dips
      responseTime = Math.round(50 + Math.random() * 30);
    } else {
      // Normal ranges
      responseTime = Math.round(80 + Math.random() * 70);
    }
    
    data.push({
      time: date,
      responseTime: responseTime,
      formattedTime: format(date, 'HH:mm'),
    });
  }
  
  return data;
};

const ResponseTimeChart = ({ siteId }: ResponseTimeChartProps) => {
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    // Generate new data when the site changes
    setData(generateResponseTimeData());
  }, [siteId]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const responseTime = payload[0].value as number;
      
      let status;
      let statusColor;
      
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
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
          <XAxis 
            dataKey="formattedTime" 
            tick={{ fontSize: 12 }} 
            stroke="var(--muted-foreground)"
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={['dataMin - 20', 'dataMax + 20']}
            tick={{ fontSize: 12 }} 
            stroke="var(--muted-foreground)"
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tickFormatter={(value) => `${value} ms`}
          />
          <Tooltip content={<CustomTooltip />} />
          <defs>
            <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone"
            dataKey="responseTime" 
            stroke="var(--primary)" 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorResponse)"
            activeDot={{ r: 6, stroke: 'var(--background)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResponseTimeChart;