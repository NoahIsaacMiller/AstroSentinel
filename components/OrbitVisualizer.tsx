
import React, { useEffect, useRef, useState } from 'react';
import { SpaceTarget } from '../types';
import { PhysicsEngine } from '../utils';

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
  const [rotation, setRotation] = useState({ x: 0.8, y: 0.3 }); // Slightly better initial angle
  const [zoom, setZoom] = useState(3.0); // Start closer
  
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  
  const EARTH_RADIUS_VIZ = 60;
  const FIELD_OF_VIEW = 1000;

  // --- Star Generation ---
  const starField = useRef<{x: number, y: number, s: number, a: number}[]>([]);
  useEffect(() => {
    const stars = [];
    for(let i=0; i<800; i++) { // More stars
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
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      const deltaX = e.clientX - lastMouse.current.x;
      const deltaY = e.clientY - lastMouse.current.y;
      setRotation(prev => ({
        x: prev.x + deltaX * 0.005,
        y: Math.min(Math.max(prev.y + deltaY * 0.005, -Math.PI/2), Math.PI/2)
      }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  };
  const handleMouseUp = () => isDragging.current = false;
  
  // Enhanced Zoom: 0.5x to 50x
  const handleWheel = (e: React.WheelEvent) => {
    setZoom(prev => {
       const delta = -e.deltaY * 0.002 * prev; // Logarithmic zoom feel
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
       
       // Perspective Scale
       // We add a larger offset to Z to avoid clipping when zooming in very close
       const cameraDist = FIELD_OF_VIEW + 200; 
       const scale = (cameraDist / (cameraDist + z2)) * zoom;
       
       return {
          x: cx + x1 * scale,
          y: cy - y2 * scale,
          z: z2,
          scale,
          visible: z2 > -cameraDist // Simple near plane clip
       };
    };

    // Clear Screen
    // Deep space gradient background
    const bgGrad = ctx.createRadialGradient(cx, cy, width * 0.2, cx, cy, width);
    bgGrad.addColorStop(0, '#0b1026');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Stars (Parallax)
    starField.current.forEach(star => {
       const rotX = rotation.x * 100; 
       const rotY = rotation.y * 100;
       // Infinite scroll effect
       const sx = (star.x + rotX + 10000) % 4000 - 2000; // 4000 width loop
       const sy = (star.y + rotY + 10000) % 4000 - 2000;
       
       // Project star roughly to give it some depth feeling relative to earth
       // We fake it by just drawing 2D but moving them based on rotation
       const x = cx + sx * 0.5; // 0.5 parallax factor
       const y = cy + sy * 0.5;

       if (x > 0 && x < width && y > 0 && y < height) {
         ctx.fillStyle = `rgba(255,255,255,${star.a * 0.8})`;
         ctx.fillRect(x, y, star.s, star.s);
       }
    });

    const renderQueue: { z: number, draw: () => void }[] = [];
    // Pre-calculate center for use in all render blocks
    const center = project(0, 0, 0);

    // --- EARTH RENDERING ---
    const earthRot = currentTime / 50000; // Earth rotation
    // Sun Direction (Static in ECI for this demo, acting as light source from the left)
    const sunVec = { x: -1, y: 0, z: 0.5 }; 
    // Normalize
    const len = Math.sqrt(sunVec.x*sunVec.x + sunVec.y*sunVec.y + sunVec.z*sunVec.z);
    sunVec.x /= len; sunVec.y /= len; sunVec.z /= len;

    renderQueue.push({
      z: 0,
      draw: () => {
         const r = EARTH_RADIUS_VIZ * center.scale;

         if (r < 0) return;

         // 1. Atmosphere Glow (Outer)
         const atmGrad = ctx.createRadialGradient(center.x, center.y, r, center.x, center.y, r * 1.3);
         atmGrad.addColorStop(0, 'rgba(6, 182, 212, 0.4)'); // Cyan
         atmGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)'); // Blue
         atmGrad.addColorStop(1, 'rgba(0,0,0,0)');
         ctx.fillStyle = atmGrad;
         ctx.beginPath(); ctx.arc(center.x, center.y, r * 1.3, 0, Math.PI*2); ctx.fill();

         // 2. Earth Base (Ocean)
         const oceanGrad = ctx.createRadialGradient(center.x, center.y, r * 0.2, center.x, center.y, r);
         oceanGrad.addColorStop(0, '#1e293b'); // Slate 800
         oceanGrad.addColorStop(1, '#020617'); // Slate 950
         ctx.fillStyle = oceanGrad;
         ctx.beginPath(); ctx.arc(center.x, center.y, r, 0, Math.PI*2); ctx.fill();

         // 3. Holographic Grid
         ctx.lineWidth = Math.max(0.5 * center.scale, 0.2);
         // Latitudes
         for(let lat=-80; lat<=80; lat+=20) {
            ctx.beginPath();
            ctx.strokeStyle = lat === 0 ? 'rgba(6, 182, 212, 0.5)' : 'rgba(6, 182, 212, 0.15)';
            
            const rad = EARTH_RADIUS_VIZ * Math.cos(lat*Math.PI/180);
            const y = EARTH_RADIUS_VIZ * Math.sin(lat*Math.PI/180);
            let first = true;
            for(let lon=0; lon<=360; lon+=5) {
               const theta = lon*Math.PI/180 + earthRot;
               const px = rad * Math.sin(theta);
               const pz = rad * Math.cos(theta);
               const p = project(px, y, pz);
               if (p.visible) {
                  // Only draw if facing camera (simple backface cull)
                  if (p.z > -5) { // Slight bias to show equator rim
                     if(first) { ctx.moveTo(p.x, p.y); first = false; }
                     else ctx.lineTo(p.x, p.y);
                  } else {
                     first = true;
                  }
               }
            }
            ctx.stroke();
         }

         // Longitudes
         for(let lon=0; lon<360; lon+=30) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
            let first = true;
            for(let lat=-90; lat<=90; lat+=5) {
               const phi = lat*Math.PI/180;
               const theta = lon*Math.PI/180 + earthRot;
               const px = EARTH_RADIUS_VIZ * Math.cos(phi) * Math.sin(theta);
               const py = EARTH_RADIUS_VIZ * Math.sin(phi);
               const pz = EARTH_RADIUS_VIZ * Math.cos(phi) * Math.cos(theta);
               // FIX ERROR 1: y -> py
               const p = project(px, py, pz);
               if (p.z > -5) {
                  if(first) { ctx.moveTo(p.x, p.y); first = false; }
                  else ctx.lineTo(p.x, p.y);
               } else {
                  first = true;
               }
            }
            ctx.stroke();
         }

         // 4. Night Side Shadow (Terminator)
         const shadowGrad = ctx.createRadialGradient(center.x + r*0.6, center.y - r*0.2, r * 0.1, center.x, center.y, r);
         shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
         shadowGrad.addColorStop(0.6, 'rgba(0,0,0,0.5)');
         shadowGrad.addColorStop(1, 'rgba(0,0,0,0.9)');
         ctx.fillStyle = shadowGrad;
         ctx.beginPath(); ctx.arc(center.x, center.y, r, 0, Math.PI*2); ctx.fill();
      }
    });

    // --- TARGETS & ORBITS ---
    targets.forEach(target => {
       // -- Orbit Path --
       if (showOrbits) {
          const segments = 90; // Smoother orbits
          const orbitPath: {x:number, y:number, z:number}[] = [];
          let avgZ = 0;
          
          for(let i=0; i<=segments; i++) {
             const M = (i/segments) * 360;
             // Calculate physics position for orbital path
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
                // Thinner lines for cleaner look when zoomed out
                ctx.lineWidth = target.id === selectedTargetId ? 1.5 : 0.5; 
                
                // Only draw if not culled (or handle partial culling?)
                // Simple approach: just draw it.
                // Enhancemnet: Fade out orbit line behind earth
                let first = true;
                orbitPath.forEach((pt) => {
                   const dist = Math.hypot(pt.x - center.x, pt.y - center.y);
                   if (pt.z < 0 && dist < EARTH_RADIUS_VIZ*center.scale) {
                      // Behind earth - rudimentary check
                      // ctx.globalAlpha = 0.1; 
                      // Hard to switch alpha mid-path efficiently without multiple strokes. 
                      // We'll stick to global alpha for the whole orbit for performance
                   }
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
             // Occlusion Check (Is behind Earth?)
             // Check dist from center < earth radius AND z < earth z (0)
             const dx = scr.x - center.x;
             const dy = scr.y - center.y;
             const dist = Math.sqrt(dx*dx + dy*dy);
             const earthR = EARTH_RADIUS_VIZ * center.scale;
             
             const isBehindEarth = (scr.z < 0) && (dist < earthR * 0.95);

             if (isBehindEarth) {
                // Show ghost if selected, else hide
                if (target.id !== selectedTargetId) return;
                ctx.globalAlpha = 0.2;
             } else {
                ctx.globalAlpha = 1;
             }

             // Size Clamping: Don't let them get huge when zoomed in
             // Min 1.5px, Max 4px
             const baseSize = (target.id === selectedTargetId ? 5 : 3) * scr.scale * 0.5;
             const size = Math.min(Math.max(baseSize, 1.5), 4); 

             ctx.fillStyle = target.id === selectedTargetId ? '#fff' : target.orbit.color;
             
             // Glow for selected
             if (target.id === selectedTargetId && !isBehindEarth) {
               ctx.shadowBlur = 10;
               ctx.shadowColor = '#fff';
             }

             ctx.beginPath();
             ctx.arc(scr.x, scr.y, size, 0, Math.PI*2);
             ctx.fill();
             ctx.shadowBlur = 0;

             // Selection UI
             if (target.id === selectedTargetId) {
                // Label with line
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
                
                // Target box
                ctx.strokeStyle = '#fff';
                const boxS = size + 4;
                ctx.strokeRect(scr.x - boxS/2, scr.y - boxS/2, boxS, boxS);
             }
             
             ctx.globalAlpha = 1;
          }
       });
    });

    // Sort by Z-depth (Paint Algorithm)
    renderQueue.sort((a, b) => a.z - b.z); 
    renderQueue.forEach(item => item.draw());

  }, [targets, showOrbits, selectedTargetId, rotation, zoom, currentTime]);

  // Handle Resize
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
      {/* Zoom Indicator */}
      <div className="absolute bottom-4 left-4 pointer-events-none text-[10px] text-slate-600 font-mono">
         ZOOM: {zoom.toFixed(2)}x
      </div>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
};

export default OrbitVisualizer;
