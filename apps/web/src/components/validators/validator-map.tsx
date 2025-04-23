import { useEffect, useRef } from 'react';

const ValidatorMap = () => {
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
    
    // Add your validator location
    const validatorX = width * 0.25;
    const validatorY = height * 0.4;
    
    // Pulse effect
    const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pulse.setAttribute('cx', validatorX.toString());
    pulse.setAttribute('cy', validatorY.toString());
    pulse.setAttribute('r', '15');
    pulse.setAttribute('fill', 'var(--primary)');
    pulse.setAttribute('opacity', '0.3');
    pulse.classList.add('animate-ping');
    svg.appendChild(pulse);
    
    // Validator point
    const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    point.setAttribute('cx', validatorX.toString());
    point.setAttribute('cy', validatorY.toString());
    point.setAttribute('r', '8');
    point.setAttribute('fill', 'var(--primary)');
    svg.appendChild(point);
    
    // Validator label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', validatorX.toString());
    text.setAttribute('y', (validatorY - 20).toString());
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '14');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', 'var(--foreground)');
    text.textContent = 'Your Validator';
    svg.appendChild(text);
    
    // Location label
    const location = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    location.setAttribute('x', validatorX.toString());
    location.setAttribute('y', (validatorY + 20).toString());
    location.setAttribute('text-anchor', 'middle');
    location.setAttribute('font-size', '12');
    location.setAttribute('fill', 'var(--muted-foreground)');
    location.textContent = 'North America';
    svg.appendChild(location);
    
    // Add several websites being monitored
    const websites = [
      { x: width * 0.45, y: height * 0.35, name: 'example.com' },
      { x: width * 0.6, y: height * 0.3, name: 'api.service.org' },
      { x: width * 0.7, y: height * 0.5, name: 'cloud.app.io' },
      { x: width * 0.8, y: height * 0.65, name: 'static.cdn.net' },
    ];
    
    websites.forEach(website => {
      // Draw connection
      const connection = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      connection.setAttribute('x1', validatorX.toString());
      connection.setAttribute('y1', validatorY.toString());
      connection.setAttribute('x2', website.x.toString());
      connection.setAttribute('y2', website.y.toString());
      connection.setAttribute('stroke', 'var(--primary)');
      connection.setAttribute('stroke-width', '1');
      connection.setAttribute('stroke-dasharray', '3,3');
      connection.setAttribute('opacity', '0.5');
      svg.appendChild(connection);
      
      // Website point
      const webPoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      webPoint.setAttribute('cx', website.x.toString());
      webPoint.setAttribute('cy', website.y.toString());
      webPoint.setAttribute('r', '4');
      webPoint.setAttribute('fill', 'var(--muted-foreground)');
      svg.appendChild(webPoint);
      
      // Website label
      const webLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      webLabel.setAttribute('x', website.x.toString());
      webLabel.setAttribute('y', (website.y - 10).toString());
      webLabel.setAttribute('text-anchor', 'middle');
      webLabel.setAttribute('font-size', '10');
      webLabel.setAttribute('fill', 'var(--muted-foreground)');
      webLabel.textContent = website.name;
      svg.appendChild(webLabel);
    });
    
    // Add legend
    const legendY = height * 0.9;
    
    // Validator legend
    const validatorLegendPoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    validatorLegendPoint.setAttribute('cx', width * 0.2);
    validatorLegendPoint.setAttribute('cy', legendY);
    validatorLegendPoint.setAttribute('r', '6');
    validatorLegendPoint.setAttribute('fill', 'var(--primary)');
    svg.appendChild(validatorLegendPoint);
    
    const validatorLegendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    validatorLegendText.setAttribute('x', (width * 0.2 + 15).toString());
    validatorLegendText.setAttribute('y', (legendY + 4).toString());
    validatorLegendText.setAttribute('font-size', '12');
    validatorLegendText.setAttribute('fill', 'var(--foreground)');
    validatorLegendText.textContent = 'Your Validator';
    svg.appendChild(validatorLegendText);
    
    // Website legend
    const websiteLegendPoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    websiteLegendPoint.setAttribute('cx', width * 0.5);
    websiteLegendPoint.setAttribute('cy', legendY);
    websiteLegendPoint.setAttribute('r', '4');
    websiteLegendPoint.setAttribute('fill', 'var(--muted-foreground)');
    svg.appendChild(websiteLegendPoint);
    
    const websiteLegendText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    websiteLegendText.setAttribute('x', (width * 0.5 + 15).toString());
    websiteLegendText.setAttribute('y', (legendY + 4).toString());
    websiteLegendText.setAttribute('font-size', '12');
    websiteLegendText.setAttribute('fill', 'var(--foreground)');
    websiteLegendText.textContent = 'Monitored Websites';
    svg.appendChild(websiteLegendText);
    
  }, []);
  
  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-[300px] rounded-md overflow-hidden"
    ></div>
  );
};

export default ValidatorMap;