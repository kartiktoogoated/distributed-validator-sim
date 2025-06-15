import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Activity, Clock, Server } from 'lucide-react';
import { cn } from '@/lib/utils';

const stats = [
  { 
    label: 'Monitored Websites', 
    value: 8520, 
    prefix: '', 
    suffix: '+',
    icon: Globe,
    animation: { duration: 3000, increment: 10 }
  },
  { 
    label: 'Avg Uptime', 
    value: 99.98, 
    prefix: '', 
    suffix: '%',
    icon: Activity,
    animation: { duration: 2500, increment: 0.1 }
  },
  { 
    label: 'Response Time', 
    value: 85, 
    prefix: '', 
    suffix: 'ms',
    icon: Clock,
    animation: { duration: 2000, increment: 1 }
  },
  { 
    label: 'Active Validators', 
    value: 312, 
    prefix: '', 
    suffix: '',
    icon: Server,
    animation: { duration: 2800, increment: 1 }
  }
];

const Stats = () => {
  const [displayValues, setDisplayValues] = useState(stats.map(() => 0));
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    
    const animateStats = () => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setHasAnimated(true);
            
            stats.forEach((stat, index) => {
              let startValue = 0;
              const { value, animation } = stat;
              const { duration, increment } = animation;
              const stepTime = Math.abs(Math.floor(duration / (value / increment)));
              
              const timer = setInterval(() => {
                startValue += increment;
                
                setDisplayValues(prev => {
                  const newValues = [...prev];
                  newValues[index] = startValue;
                  return newValues;
                });
                
                if (startValue >= value) {
                  setDisplayValues(prev => {
                    const newValues = [...prev];
                    newValues[index] = value;
                    return newValues;
                  });
                  clearInterval(timer);
                }
              }, stepTime);
            });
            
            observer.disconnect();
          }
        },
        { threshold: 0.5 }
      );
      
      const element = document.getElementById('stats-section');
      if (element) {
        observer.observe(element);
      }
    };
    
    animateStats();
    
    return () => {
      // Cleanup
    };
  }, [hasAnimated]);

  return (
    <div id="stats-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const displayValue = hasAnimated ? stat.value : displayValues[index];
        
        return (
          <Card key={index} className={cn(
            "border-none bg-transparent",
            "hover:bg-background/50 transition-colors"
          )}>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl font-bold mb-1">
                {stat.prefix}
                {displayValue.toLocaleString(undefined, { 
                  minimumFractionDigits: Number.isInteger(stat.value) ? 0 : 2,
                  maximumFractionDigits: Number.isInteger(stat.value) ? 0 : 2
                })}
                {stat.suffix}
              </div>
              <p className="text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Stats;