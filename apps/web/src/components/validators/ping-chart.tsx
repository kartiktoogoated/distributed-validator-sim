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

// Generate fake ping data
const generatePingData = (hours = 24) => {
  const data = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date();
    time.setHours(now.getHours() - i);
    
    // Generate realistic ping times
    let pingTime;
    
    if (i % 6 === 0) {
      // Add some spikes
      pingTime = Math.round(70 + Math.random() * 40);
    } else if (i % 8 === 0) {
      // Add some higher spikes occasionally
      pingTime = Math.round(100 + Math.random() * 80);
    } else {
      // Normal ranges
      pingTime = Math.round(40 + Math.random() * 40);
    }
    
    data.push({
      time: time,
      pingTime: pingTime,
      formattedTime: time.getHours() + ':00',
    });
  }
  
  return data;
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const pingTime = payload[0].value as number;
    
    let quality;
    let qualityColor;
    
    if (pingTime < 60) {
      quality = 'Excellent';
      qualityColor = 'text-green-500';
    } else if (pingTime < 100) {
      quality = 'Good';
      qualityColor = 'text-blue-500';
    } else if (pingTime < 150) {
      quality = 'Fair';
      qualityColor = 'text-yellow-500';
    } else {
      quality = 'Poor';
      qualityColor = 'text-red-500';
    }
    
    return (
      <Card>
        <CardContent className="p-4 space-y-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm">
            Ping Time: <span className="font-semibold">{pingTime} ms</span>
          </p>
          <div className="flex items-center gap-1">
            <div className={qualityColor}>●</div>
            <span className="text-xs">{quality}</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return null;
};

const PingChart = () => {
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    setData(generatePingData());
  }, []);
  
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
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
          <Line 
            type="monotone" 
            dataKey="pingTime" 
            stroke="var(--primary)" 
            strokeWidth={2} 
            dot={{ stroke: 'var(--primary)', strokeWidth: 2, r: 4, fill: 'var(--background)' }} 
            activeDot={{ r: 6, stroke: 'var(--background)', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PingChart;