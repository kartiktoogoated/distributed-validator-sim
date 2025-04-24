import { useEffect, useRef } from 'react';

const ClientMap = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const container = mapContainerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Clear any previous content
    container.innerHTML = '';
    
    // Create SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('width','100%');
    svg.setAttribute('height','100%');
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    container.appendChild(svg);
    
    // Sample validator locations
    const locations = [
      { x: width * 0.2,  y: height * 0.35, name: 'North America', active: true  },
      { x: width * 0.45, y: height * 0.3,  name: 'Europe',        active: true  },
      { x: width * 0.65, y: height * 0.35, name: 'Asia',          active: true  },
      { x: width * 0.3,  y: height * 0.6,  name: 'South America', active: true  },
      { x: width * 0.5,  y: height * 0.6,  name: 'Africa',        active: true  },
      { x: width * 0.8,  y: height * 0.7,  name: 'Australia',     active: false },
    ];
    
    // Center point for your website
    const centerX = width * 0.5;
    const centerY = height * 0.45;
    
    // Draw each validator location
    locations.forEach(loc => {
      // Pulse effect on active nodes
      if (loc.active) {
        const pulse = document.createElementNS(svg.namespaceURI,'circle');
        pulse.setAttribute('cx', loc.x.toString());
        pulse.setAttribute('cy', loc.y.toString());
        pulse.setAttribute('r', '10');
        pulse.setAttribute('fill', '#fff');
        pulse.setAttribute('opacity', '0.2');
        pulse.classList.add('animate-ping');
        svg.appendChild(pulse);
      }
      
      // Dot
      const dot = document.createElementNS(svg.namespaceURI,'circle');
      dot.setAttribute('cx', loc.x.toString());
      dot.setAttribute('cy', loc.y.toString());
      dot.setAttribute('r', '6');
      dot.setAttribute('fill', loc.active ? '#fff' : '#888');
      svg.appendChild(dot);
      
      // Region label
      const label = document.createElementNS(svg.namespaceURI,'text');
      label.setAttribute('x', loc.x.toString());
      label.setAttribute('y', (loc.y - 12).toString());
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '12');
      label.setAttribute('fill', '#fff');
      label.textContent = loc.name;
      svg.appendChild(label);
      
      // Status label
      const status = document.createElementNS(svg.namespaceURI,'text');
      status.setAttribute('x', loc.x.toString());
      status.setAttribute('y', (loc.y + 16).toString());
      status.setAttribute('text-anchor', 'middle');
      status.setAttribute('font-size', '10');
      status.setAttribute('fill', '#888');
      status.textContent = loc.active ? 'Monitoring' : 'Inactive';
      svg.appendChild(status);
    });
    
    // Lines connecting active nodes to center
    locations.filter(l => l.active).forEach(loc => {
      const line = document.createElementNS(svg.namespaceURI,'line');
      line.setAttribute('x1', centerX.toString());
      line.setAttribute('y1', centerY.toString());
      line.setAttribute('x2', loc.x.toString());
      line.setAttribute('y2', loc.y.toString());
      line.setAttribute('stroke', '#fff');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '3,3');
      line.setAttribute('opacity', '0.5');
      svg.appendChild(line);
    });
    
    // Your website center dot
    const webDot = document.createElementNS(svg.namespaceURI,'circle');
    webDot.setAttribute('cx', centerX.toString());
    webDot.setAttribute('cy', centerY.toString());
    webDot.setAttribute('r', '8');
    webDot.setAttribute('fill', '#fff');
    svg.appendChild(webDot);
    
    // Your website label
    const webLabel = document.createElementNS(svg.namespaceURI,'text');
    webLabel.setAttribute('x', centerX.toString());
    webLabel.setAttribute('y', (centerY - 12).toString());
    webLabel.setAttribute('text-anchor', 'middle');
    webLabel.setAttribute('font-size', '13');
    webLabel.setAttribute('font-weight', 'bold');
    webLabel.setAttribute('fill', '#fff');
    webLabel.textContent = 'Your Website';
    svg.appendChild(webLabel);
    
  }, []);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[300px] rounded-md overflow-hidden"
    />
  );
};

export default ClientMap;
