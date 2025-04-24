import { useEffect, useRef } from 'react';

const ValidatorMap = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const container = mapContainerRef.current;
    const W = container.clientWidth;
    const H = container.clientHeight;

    // clear
    container.innerHTML = '';

    // svg
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('width','100%');
    svg.setAttribute('height','100%');
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    container.appendChild(svg);

    // move validator to 25% width, 35% height
    const vx = W * 0.25;
    const vy = H * 0.35;

    // pulse
    const pulse = document.createElementNS(svg.namespaceURI,'circle');
    pulse.setAttribute('cx',vx.toString());
    pulse.setAttribute('cy',vy.toString());
    pulse.setAttribute('r','12');
    pulse.setAttribute('fill','#fff');
    pulse.setAttribute('opacity','0.2');
    pulse.classList.add('animate-ping');
    svg.appendChild(pulse);

    // main dot
    const dot = document.createElementNS(svg.namespaceURI,'circle');
    dot.setAttribute('cx',vx.toString());
    dot.setAttribute('cy',vy.toString());
    dot.setAttribute('r','5');
    dot.setAttribute('fill','#fff');
    svg.appendChild(dot);

    // helper for left-aligned text
    function makeText(x: number, y: number, txt: string, size: number, fill: string, weight = 'normal') {
      const t = document.createElementNS(svg.namespaceURI,'text');
      t.setAttribute('x', x.toString());
      t.setAttribute('y', y.toString());
      t.setAttribute('text-anchor','start');
      t.setAttribute('font-size', size.toString());
      t.setAttribute('fill', fill);
      t.setAttribute('font-weight', weight);
      t.textContent = txt;
      svg.appendChild(t);
    }

    // Validator labels
    makeText(vx + 10, vy - 8, 'Your Validator', 14, '#fff','600');
    makeText(vx + 10, vy + 18, 'North America', 12, '#ccc');

    // monitored websites, shifted left
    const sites = [
      { x: W * 0.42, y: H * 0.28, name: 'example.com'    },
      { x: W * 0.62, y: H * 0.23, name: 'api.service.org' },
      { x: W * 0.65, y: H * 0.48, name: 'cloud.app.io'    },
      { x: W * 0.78, y: H * 0.58, name: 'static.cdn.net'  },
    ];

    sites.forEach(site => {
      // dashed connection
      const ln = document.createElementNS(svg.namespaceURI,'line');
      ln.setAttribute('x1',vx.toString());
      ln.setAttribute('y1',vy.toString());
      ln.setAttribute('x2',site.x.toString());
      ln.setAttribute('y2',site.y.toString());
      ln.setAttribute('stroke','#fff');
      ln.setAttribute('stroke-width','0.8');
      ln.setAttribute('stroke-dasharray','2,2');
      ln.setAttribute('opacity','0.5');
      svg.appendChild(ln);

      // site dot
      const sp = document.createElementNS(svg.namespaceURI,'circle');
      sp.setAttribute('cx',site.x.toString());
      sp.setAttribute('cy',site.y.toString());
      sp.setAttribute('r','3');
      sp.setAttribute('fill','#ccc');
      svg.appendChild(sp);

      // site label
      makeText(site.x + 6, site.y + 3, site.name, 10, '#ccc');
    });

    // legend, moved to 30% & 60%
    const ly = H * 0.9;
    function addLegend(cx: number, label: string, color: string) {
      const pt = document.createElementNS(svg.namespaceURI,'circle');
      pt.setAttribute('cx',cx.toString());
      pt.setAttribute('cy',ly.toString());
      pt.setAttribute('r','4');
      pt.setAttribute('fill',color);
      svg.appendChild(pt);
      makeText(cx + 10, ly + 4, label, 10, '#fff');
    }

    addLegend(W * 0.30, 'Your Validator', '#fff');
    addLegend(W * 0.60, 'Monitored Websites', '#ccc');

  }, []);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[300px] rounded-md overflow-hidden"
    />
  );
};

export default ValidatorMap;
