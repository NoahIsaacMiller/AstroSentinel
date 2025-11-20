
import React, { useEffect, useRef, useState } from 'react';
import { SpaceTarget } from '../types';
import { PhysicsEngine } from '../utils';
import { GROUND_STATIONS } from '../constants';

interface OrbitVisualizerProps {
  targets: SpaceTarget[];
  showOrbits: boolean;
  selectedTargetId: string | null;
  onSelectTarget: (id: string) => void;
  currentTime: number;
}

const OrbitVisualizer: React.FC<OrbitVisualizerProps> = ({
  targets,
  showOrbits,
  selectedTargetId,
  onSelectTarget,
  currentTime,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initial View State
  const [rotation, setRotation] = useState({ x: 0.8, y: 0.3 }); 
  const [zoom, setZoom] = useState(3.0); 
  
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  
  const EARTH_RADIUS_VIZ = 60;
  const FIELD_OF_VIEW = 1000;

  // --- Star Generation ---
  const starField = useRef<{x: number, y: number, s: number, a: number}[]>([]);

  useEffect(() => {
    const stars = [];
    for(let i=0; i<800; i++) { 
      stars.push({
        x: Math.random() * 4000 - 2000,
        y: Math.random() * 4000 - 2000,
        s: Math.random() * 1.2 + 0.1,
        a: Math.random() * 0.8 + 0.1
      });
    }
    starField.current = stars;
  }, []);

  // --- Input Handling ---
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  
  // Inverted controls for natural feel (drag world)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      const deltaX = e.clientX - lastMouse.current.x;
      const deltaY = e.clientY - lastMouse.current.y;
      setRotation(prev => ({
        x: prev.x - deltaX * 0.005, // Inverted
        y: Math.min(Math.max(prev.y - deltaY * 0.005, -Math.PI/2), Math.PI/2) // Inverted
      }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  };
  const handleMouseUp = () => isDragging.current = false;
  
  // Enhanced Zoom: 0.5x to 50x
  const handleWheel = (e: React.WheelEvent) => {
    setZoom(prev => {
       const delta = -e.deltaY * 0.002 * prev; 
       return Math.min(Math.max(prev + delta, 0.5), 50);
    });
  };

  // --- Render Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    // 3D Projection Function
    const project = (x: number, y: number, z: number) => {
       // Rotate Y (Yaw)
       const x1 = x * Math.cos(rotation.x) - z * Math.sin(rotation.x);
       const z1 = x * Math.sin(rotation.x) + z * Math.cos(rotation.x);
       // Rotate X (Pitch)
       const y2 = y * Math.cos(rotation.y) - z1 * Math.sin(rotation.y);
       const z2 = y * Math.sin(rotation.y) + z1 * Math.cos(rotation.y);
       
       const cameraDist = FIELD_OF_VIEW + 200; 
       const scale = (cameraDist / (cameraDist + z2)) * zoom;
       
       return {
          x: cx + x1 * scale,
          y: cy - y2 * scale,
          z: z2,
          scale,
          visible: z2 > -cameraDist 
       };
    };

    // Clear Screen
    const bgGrad = ctx.createRadialGradient(cx, cy, width * 0.2, cx, cy, width);
    bgGrad.addColorStop(0, '#0f172a'); // Slate 900
    bgGrad.addColorStop(1, '#020617'); // Slate 950
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Stars (Parallax)
    starField.current.forEach(star => {
       const rotX = rotation.x * 100; 
       const rotY = rotation.y * 100;
       const sx = (star.x + rotX + 10000) % 4000 - 2000; 
       const sy = (star.y + rotY + 10000) % 4000 - 2000;
       
       const x = cx + sx * 0.5; 
       const y = cy + sy * 0.5;

       if (x > 0 && x < width && y > 0 && y < height) {
         ctx.fillStyle = `rgba(255,255,255,${star.a * 0.6})`;
         ctx.fillRect(x, y, star.s, star.s);
       }
    });

    const renderQueue: { z: number, draw: () => void }[] = [];
    const center = project(0, 0, 0);

    // --- EARTH RENDERING ---
    // Accurate Physics Rotation
    const earthRot = PhysicsEngine.getGMST(currentTime);

    renderQueue.push({
      z: 0,
      draw: () => {
         const r = EARTH_RADIUS_VIZ * center.scale;

         if (r < 0) return;

         // 1. Atmosphere Glow (Subtle)
         const atmGrad = ctx.createRadialGradient(center.x, center.y, r, center.x, center.y, r * 1.2);
         atmGrad.addColorStop(0, 'rgba(56, 189, 248, 0.1)'); // Sky blue low opacity
         atmGrad.addColorStop(1, 'rgba(0,0,0,0)');
         ctx.fillStyle = atmGrad;
         ctx.beginPath(); ctx.arc(center.x, center.y, r * 1.2, 0, Math.PI*2); ctx.fill();

         // 2. Earth Base (Brighter Ocean Blue)
         const sphereGrad = ctx.createRadialGradient(center.x - r*0.3, center.y - r*0.3, r * 0.1, center.x, center.y, r);
         sphereGrad.addColorStop(0, '#2563eb'); // Blue 600 (Highlight)
         sphereGrad.addColorStop(0.6, '#1e3a8a'); // Blue 900 (Mid ocean)
         sphereGrad.addColorStop(1, '#020617'); // Deep shadow edge
         ctx.fillStyle = sphereGrad;
         ctx.beginPath(); ctx.arc(center.x, center.y, r, 0, Math.PI*2); ctx.fill();
         
         // 3. Holographic Grid (Subtle)
         ctx.lineWidth = Math.max(0.5 * center.scale, 0.1);
         
         // Latitudes
         for(let lat=-80; lat<=80; lat+=20) {
            ctx.beginPath();
            ctx.strokeStyle = lat === 0 ? 'rgba(56, 189, 248, 0.3)' : 'rgba(56, 189, 248, 0.08)';
            const rad = EARTH_RADIUS_VIZ * Math.cos(lat*Math.PI/180);
            const y = EARTH_RADIUS_VIZ * Math.sin(lat*Math.PI/180);
            let first = true;
            for(let lon=0; lon<=360; lon+=5) {
               const theta = (lon*Math.PI/180) + earthRot;
               const px = rad * Math.sin(theta);
               const pz = rad * Math.cos(theta);
               const p = project(px, y, pz);
               if (p.visible && p.z > -10) {
                  if(first) { ctx.moveTo(p.x, p.y); first = false; }
                  else ctx.lineTo(p.x, p.y);
               } else { first = true; }
            }
            ctx.stroke();
         }
         // Longitudes
         for(let lon=0; lon<360; lon+=30) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
            let first = true;
            for(let lat=-90; lat<=90; lat+=5) {
               const phi = lat*Math.PI/180;
               const theta = (lon*Math.PI/180) + earthRot;
               const px = EARTH_RADIUS_VIZ * Math.cos(phi) * Math.sin(theta);
               const py = EARTH_RADIUS_VIZ * Math.sin(phi);
               const pz = EARTH_RADIUS_VIZ * Math.cos(phi) * Math.cos(theta);
               const p = project(px, py, pz);
               if (p.visible && p.z > -10) {
                  if(first) { ctx.moveTo(p.x, p.y); first = false; }
                  else ctx.lineTo(p.x, p.y);
               } else { first = true; }
            }
            ctx.stroke();
         }

         // 4. Night Side Shadow (Terminator)
         const shadowGrad = ctx.createRadialGradient(center.x + r*0.7, center.y - r*0.3, r * 0.1, center.x, center.y, r);
         shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
         shadowGrad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
         shadowGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
         ctx.fillStyle = shadowGrad;
         ctx.beginPath(); ctx.arc(center.x, center.y, r, 0, Math.PI*2); ctx.fill();
      }
    });

    // --- GROUND STATIONS ---
    GROUND_STATIONS.forEach(station => {
       const latRad = station.lat * (Math.PI/180);
       const theta = (station.lon * (Math.PI/180)) + earthRot;
       
       const px = EARTH_RADIUS_VIZ * Math.cos(latRad) * Math.sin(theta);
       const py = EARTH_RADIUS_VIZ * Math.sin(latRad);
       const pz = EARTH_RADIUS_VIZ * Math.cos(latRad) * Math.cos(theta);
       
       const p = project(px, py, pz);
       
       if (p.visible && p.z > -10) {
           renderQueue.push({
               z: p.z,
               draw: () => {
                   ctx.fillStyle = '#22c55e'; // Green
                   ctx.beginPath();
                   const s = 3 * p.scale;
                   ctx.moveTo(p.x, p.y - s);
                   ctx.lineTo(p.x - s, p.y + s);
                   ctx.lineTo(p.x + s, p.y + s);
                   ctx.fill();
                   
                   ctx.fillStyle = '#fff';
                   ctx.font = `${8 * p.scale}px monospace`;
                   ctx.fillText(station.id, p.x + s, p.y);
               }
           });
       }

       // --- LINKS TO SATELLITES ---
       targets.forEach(target => {
           const lookAngle = PhysicsEngine.getLookAngle(station, target, currentTime);
           if (lookAngle > 5) { // Visible
               const satPos = PhysicsEngine.getPosition(target, currentTime);
               const satP = project(satPos.x, satPos.y, satPos.z);
               
               if (p.visible && satP.visible) {
                   renderQueue.push({
                       z: (p.z + satP.z) / 2,
                       draw: () => {
                           const grad = ctx.createLinearGradient(p.x, p.y, satP.x, satP.y);
                           grad.addColorStop(0, 'rgba(34, 197, 94, 0.8)');
                           grad.addColorStop(1, 'rgba(34, 197, 94, 0.1)');
                           
                           ctx.beginPath();
                           ctx.moveTo(p.x, p.y);
                           ctx.lineTo(satP.x, satP.y);
                           ctx.strokeStyle = grad;
                           ctx.lineWidth = 1;
                           ctx.setLineDash([4, 4]);
                           ctx.stroke();
                           ctx.setLineDash([]);
                       }
                   });
               }
           }
       });
    });

    // --- TARGETS & ORBITS ---
    targets.forEach(target => {
       // -- Orbit Path --
       if (showOrbits) {
          const segments = 90; 
          const orbitPath: {x:number, y:number, z:number}[] = [];
          let avgZ = 0;
          
          for(let i=0; i<=segments; i++) {
             const M = (i/segments) * 360;
             const pathPos = PhysicsEngine.getPosition({...target, orbit: {...target.orbit, meanAnomaly: M, epoch: currentTime}}, currentTime); 
             const p = project(pathPos.x, pathPos.y, pathPos.z);
             orbitPath.push({x: p.x, y: p.y, z: p.z});
             avgZ += p.z;
          }
          avgZ /= segments;

          renderQueue.push({
             z: avgZ,
             draw: () => {
                ctx.beginPath();
                ctx.strokeStyle = target.id === selectedTargetId ? '#fff' : target.orbit.color;
                ctx.lineWidth = target.id === selectedTargetId ? 1.5 : 0.5; 
                
                let first = true;
                orbitPath.forEach((pt) => {
                   if(first) { ctx.moveTo(pt.x, pt.y); first = false; }
                   else ctx.lineTo(pt.x, pt.y);
                });
                ctx.globalAlpha = target.id === selectedTargetId ? 0.8 : 0.3;
                ctx.stroke();
                ctx.globalAlpha = 1;
             }
          });
       }

       // -- Satellite Body --
       const pos3 = PhysicsEngine.getPosition(target, currentTime);
       const scr = project(pos3.x, pos3.y, pos3.z);

       if (!scr.visible) return;

       renderQueue.push({
          z: scr.z,
          draw: () => {
             const dx = scr.x - center.x;
             const dy = scr.y - center.y;
             const dist = Math.sqrt(dx*dx + dy*dy);
             const earthR = EARTH_RADIUS_VIZ * center.scale;
             
             const isBehindEarth = (scr.z < 0) && (dist < earthR * 0.95);

             if (isBehindEarth) {
                if (target.id !== selectedTargetId) return;
                ctx.globalAlpha = 0.2;
             } else {
                ctx.globalAlpha = 1;
             }

             // Marker Size Logic: Keep them small (1-2px) unless selected or zoomed very in
             let size = 2; 
             if (target.id === selectedTargetId) {
                size = 4 * center.scale * 0.5;
             } else {
                size = Math.min(2, 3 * center.scale * 0.2); 
             }
             
             ctx.fillStyle = target.id === selectedTargetId ? '#fff' : target.orbit.color;
             
             if (target.id === selectedTargetId && !isBehindEarth) {
               ctx.shadowBlur = 10;
               ctx.shadowColor = '#fff';
             }

             ctx.beginPath();
             ctx.arc(scr.x, scr.y, size, 0, Math.PI*2);
             ctx.fill();
             ctx.shadowBlur = 0;

             if (target.id === selectedTargetId) {
                ctx.fillStyle = '#fff';
                ctx.font = '11px monospace';
                const labelX = scr.x + 15;
                const labelY = scr.y - 15;
                
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(scr.x + size + 2, scr.y - size - 2);
                ctx.lineTo(labelX - 2, labelY + 2);
                ctx.stroke();

                ctx.fillText(target.name, labelX, labelY);
                
                ctx.strokeStyle = '#fff';
                const boxS = size + 4;
                ctx.strokeRect(scr.x - boxS/2, scr.y - boxS/2, boxS, boxS);
             }
             
             ctx.globalAlpha = 1;
          }
       });
    });

    renderQueue.sort((a, b) => a.z - b.z); 
    renderQueue.forEach(item => item.draw());

  }, [targets, showOrbits, selectedTargetId, rotation, zoom, currentTime]);

  useEffect(() => {
    const resize = () => {
      if(containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full cursor-move bg-slate-950 relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={() => onSelectTarget('')}
    >
      <div className="absolute bottom-4 left-4 pointer-events-none text-[10px] text-slate-600 font-mono">
         ZOOM: {zoom.toFixed(2)}x
      </div>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
};

export default OrbitVisualizer;
