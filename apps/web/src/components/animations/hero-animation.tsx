import { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const HeroAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Animation setup
    const createRandomNode = () => {
      const size = Math.random() * 10 + 5;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const delay = Math.random() * 3;
      const duration = Math.random() * 15 + 15;
      const isHealthy = Math.random() > 0.5;
      return { size, x, y, delay, duration, isHealthy };
    };

    // Create animation nodes
    const nodeCount = 12;
    const nodes: HTMLDivElement[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const { size, x, y, delay, duration, isHealthy } = createRandomNode();

      const node = document.createElement('div');
      node.className = cn(
        'absolute rounded-full',
        isHealthy ? 'bg-green-500/50 animate-ping' : 'bg-red-500/50 animate-ping'
      );
      node.style.width = `${size}px`;
      node.style.height = `${size}px`;
      node.style.left = `${x}%`;
      node.style.top = `${y}%`;
      node.style.animationDelay = `${delay}s`;
      node.style.animationDuration = `${duration}s`;

      nodes.push(node);
      container.appendChild(node);
    }

    // Cleanup on unmount
    return () => {
      nodes.forEach(node => node.remove());
    };
  }, []);

  return (
    <div className="relative w-full max-w-[580px] aspect-square rounded-full mx-auto border-primary/10 border-[8px] flex items-center justify-center">
      <div ref={containerRef} className="absolute inset-0">
        {/* Nodes will be dynamically added here */}
      </div>

      {/* Rings */}
      <div
        className="absolute w-[80%] h-[80%] rounded-full border-2 border-primary/10 animate-ping opacity-40"
        style={{ animationDuration: '3s' }}
      />
      <div
        className="absolute w-[60%] h-[60%] rounded-full border-2 border-primary/20 animate-ping opacity-60"
        style={{ animationDuration: '4s' }}
      />
      <div
        className="absolute w-[40%] h-[40%] rounded-full border-2 border-primary/30 animate-ping opacity-80"
        style={{ animationDuration: '5s' }}
      />

      {/* Center icon */}
      <div className="relative z-10 bg-background w-[25%] h-[25%] rounded-full flex items-center justify-center shadow-lg">
        <Activity className="w-1/2 h-1/2 text-primary" />
      </div>

      {/* Connection lines */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'absolute h-[1px] bg-gradient-to-r from-primary/5 via-primary/20 to-primary/5 animate-pulse',
            'transform-gpu origin-center'
          )}
          style={{
            width: '100%',
            transform: `rotate(${i * 30}deg)`,
            animationDelay: `${i * 0.5}s`
          }}
        />
      ))}
    </div>
  );
};

export default HeroAnimation;
