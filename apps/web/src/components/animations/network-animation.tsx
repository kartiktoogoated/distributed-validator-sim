import { useEffect, useRef } from 'react';

type NodeState = 'healthy' | 'unhealthy';
type ConsensusRole = 'leader' | 'follower';

interface Node {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  state: NodeState;
  lastUpdate: number;
  consensusRole: ConsensusRole;
  pulsePhase: number;
}

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  color: string;
}

const NetworkAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.offsetWidth;
      canvas.height = parent.offsetHeight || 400;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create nodes
    const nodeCount = 12;
    const nodes: Node[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 3 + 2,
        color: i === 0 ? '#3B82F6' : '#9CA3AF',
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        state: Math.random() > 0.2 ? 'healthy' : 'unhealthy',
        lastUpdate: Date.now(),
        consensusRole: i === 0 ? 'leader' : 'follower',
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Particle system for consensus visualization
    const particles: Particle[] = [];
    const createParticle = (
      startX: number,
      startY: number,
      endX: number,
      endY: number
    ): Particle => ({
      x: startX,
      y: startY,
      targetX: endX,
      targetY: endY,
      progress: 0,
      speed: 0.02 + Math.random() * 0.02,
      color: 'rgba(59, 130, 246, 0.5)',
    });

    // Animation loop
    let animationFrameId: number;
    let lastTime = Date.now();

    const render = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      // prevent unused var error
      void deltaTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw consensus particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
          particles.splice(i, 1);
          continue;
        }
        const x = p.x + (p.targetX - p.x) * p.progress;
        const y = p.y + (p.targetY - p.y) * p.progress;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${0.5 * (1 - p.progress)})`;
        ctx.fill();
      }

      // Draw connections with gradient effect
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 150) {
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            if (a.consensusRole === 'leader' || b.consensusRole === 'leader') {
              grad.addColorStop(0, `rgba(59,130,246,${1 - dist/150})`);
              grad.addColorStop(1, `rgba(59,130,246,${0.3 - dist/300})`);
            } else {
              grad.addColorStop(0, `rgba(156,163,175,${0.5 - dist/300})`);
              grad.addColorStop(1, `rgba(156,163,175,${0.2 - dist/300})`);
            }
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = grad;
            ctx.stroke();
            if (Math.random() < 0.02) {
              particles.push(createParticle(a.x, a.y, b.x, b.y));
            }
          }
        }
      }

      // Draw nodes with status indicators and pulse effects
      for (const node of nodes) {
        const pulseR = node.radius + 5;
        const intensity = (Math.sin(currentTime * 0.003 + node.pulsePhase) + 1) / 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = node.state === 'healthy'
          ? `rgba(34,197,94,${0.2 * intensity})`
          : `rgba(239,68,68,${0.2 * intensity})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.consensusRole === 'leader' ? '#3B82F6' : '#9CA3AF';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(
          node.x + node.radius,
          node.y - node.radius,
          node.radius * 0.8,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = node.state === 'healthy' ? '#22c55e' : '#ef4444';
        ctx.fill();

        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > canvas.width) {
          node.vx *= -0.9;
          node.x = Math.max(0, Math.min(canvas.width, node.x));
        }
        if (node.y < 0 || node.y > canvas.height) {
          node.vy *= -0.9;
          node.y = Math.max(0, Math.min(canvas.height, node.y));
        }
        if (Math.random() < 0.001) {
          node.state = node.state === 'healthy' ? 'unhealthy' : 'healthy';
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="w-full h-[400px] relative rounded-lg overflow-hidden border">
      <canvas ref={canvasRef} className="w-full h-full bg-card" />
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-3 rounded-lg border">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Healthy Node</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Unhealthy Node</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Leader Node</span>
        </div>
      </div>
    </div>
  );
};

export default NetworkAnimation;
