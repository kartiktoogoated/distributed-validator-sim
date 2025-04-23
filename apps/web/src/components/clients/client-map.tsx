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
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    container.appendChild(svg);
    
    // Add a simplified world map (this is just a placeholder rectangle)
    const map = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    map.setAttribute('x', '0');
    map.setAttribute('y', '0');
    map.setAttribute('width', width.toString());
    map.setAttribute('height', height.toString());
    map.setAttribute('fill', 'none');
    svg.appendChild(map);
    
    // Sample validator locations - these would be actual lat/long coordinates converted to x,y in a real app
    const locations = [
      { x: width * 0.2, y: height * 0.35, name: 'North America', active: true },
      { x: width * 0.45, y: height * 0.3, name: 'Europe', active: true },
      { x: width * 0.65, y: height * 0.35, name: 'Asia', active: true },
      { x: width * 0.3, y: height * 0.6, name: 'South America', active: true },
      { x: width * 0.5, y: height * 0.6, name: 'Africa', active: true },
      { x: width * 0.8, y: height * 0.7, name: 'Australia', active: false },
    ];
    
    // Add background "world map" placeholder with SVG paths
    const worldMap = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    worldMap.setAttribute('d', `
      M ${width * 0.15},${height * 0.35} 
      C ${width * 0.2},${height * 0.25} ${width * 0.3},${height * 0.2} ${width * 0.35},${height * 0.3}
      C ${width * 0.4},${height * 0.25} ${width * 0.5},${height * 0.25} ${width * 0.55},${height * 0.3}
      C ${width * 0.6},${height * 0.35} ${width * 0.7},${height * 0.3} ${width * 0.8},${height * 0.4}
      C ${width * 0.85},${height * 0.45} ${width * 0.9},${height * 0.6} ${width * 0.8},${height * 0.7}
      M ${width * 0.15},${height * 0.4} 
      C ${width * 0.2},${height * 0.5} ${width * 0.25},${height * 0.6} ${width * 0.3},${height * 0.6}
      M ${width * 0.4},${height * 0.4} 
      C ${width * 0.45},${height * 0.45} ${width * 0.5},${height * 0.55} ${width * 0.5},${height * 0.6}
    `);
    worldMap.setAttribute('stroke', 'var(--border)');
    worldMap.setAttribute('stroke-width', '2');
    worldMap.setAttribute('fill', 'none');
    svg.appendChild(worldMap);
    
    // Add location points
    locations.forEach(location => {
      // Pulse effect
      if (location.active) {
        const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pulse.setAttribute('cx', location.x.toString());
        pulse.setAttribute('cy', location.y.toString());
        pulse.setAttribute('r', '10');
        pulse.setAttribute('fill', 'var(--primary)');
        pulse.setAttribute('opacity', '0.3');
        pulse.classList.add('animate-ping');
        svg.appendChild(pulse);
      }
      
      // Location point
      const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      point.setAttribute('cx', location.x.toString());
      point.setAttribute('cy', location.y.toString());
      point.setAttribute('r', '6');
      point.setAttribute('fill', location.active ? 'var(--primary)' : 'var(--muted)');
      svg.appendChild(point);
      
      // Location label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', location.x.toString());
      text.setAttribute('y', (location.y - 15).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', 'var(--foreground)');
      text.textContent = location.name;
      svg.appendChild(text);
      
      // Status label
      const status = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      status.setAttribute('x', location.x.toString());
      status.setAttribute('y', (location.y + 20).toString());
      status.setAttribute('text-anchor', 'middle');
      status.setAttribute('font-size', '10');
      status.setAttribute('fill', 'var(--muted-foreground)');
      status.textContent = location.active ? 'Monitoring' : 'Inactive';
      svg.appendChild(status);
    });
    
    // Add connections between active locations and a central point
    const centerX = width * 0.5;
    const centerY = height * 0.45;
    
    locations.filter(l => l.active).forEach(location => {
      const connection = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      connection.setAttribute('x1', centerX.toString());
      connection.setAttribute('y1', centerY.toString());
      connection.setAttribute('x2', location.x.toString());
      connection.setAttribute('y2', location.y.toString());
      connection.setAttribute('stroke', 'var(--primary)');
      connection.setAttribute('stroke-width', '1');
      connection.setAttribute('stroke-dasharray', '3,3');
      connection.setAttribute('opacity', '0.5');
      svg.appendChild(connection);
    });
    
    // Add website location (center)
    const website = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    website.setAttribute('cx', centerX.toString());
    website.setAttribute('cy', centerY.toString());
    website.setAttribute('r', '8');
    website.setAttribute('fill', 'var(--primary)');
    svg.appendChild(website);
    
    const websiteLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    websiteLabel.setAttribute('x', centerX.toString());
    websiteLabel.setAttribute('y', (centerY - 15).toString());
    websiteLabel.setAttribute('text-anchor', 'middle');
    websiteLabel.setAttribute('font-size', '13');
    websiteLabel.setAttribute('font-weight', 'bold');
    websiteLabel.setAttribute('fill', 'var(--foreground)');
    websiteLabel.textContent = 'Your Website';
    svg.appendChild(websiteLabel);
    
  }, []);
  
  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-[300px] rounded-md overflow-hidden"
    ></div>
  );
};

export default ClientMap;