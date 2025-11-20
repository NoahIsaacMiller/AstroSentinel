
import React, { useEffect, useRef, useState } from 'react';
import { SpaceTarget } from '../types';

interface OrbitVisualizerProps {
  targets: SpaceTarget[];
  showOrbits: boolean;
  selectedTargetId: string | null;
  onSelectTarget: (id: string) => void;
  currentTime: number; // Passed from App state, controls physics
}

interface Point3D { x: number; y: number; z: number; }

const OrbitVisualizer: React.FC<OrbitVisualizerProps> = ({
  targets,
  showOrbits,
  selectedTargetId,
  onSelectTarget,
  currentTime,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0.5, y: 0.2 });
  const [zoom, setZoom] = useState(1.2);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  
  // Physics Constants
  const EARTH_RADIUS = 60;
  const FIELD_OF_VIEW = 800;

  // Pre-generate stars
  const starField = useRef<{x: number, y: number, s: number, a: number}[]>([]);
  useEffect(() => {
    const stars = [];
    for(let i=0; i<300; i++) {
      stars.push({
        x: Math.random() * 2000 - 1000,
        y: Math.random() * 2000 - 1000,
        s: Math.random() * 1.5 + 0.5,
        a: Math.random()
      });
    }
    starField.current = stars;
  }, []);

  // --- Orbital Mechanics (Keplerian) ---
  const solveKepler = (M: number, e: number): number => {
    let E = M; 
    for(let i=0; i<5; i++) { // Reduced iterations for performance
      E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    }
    return E;
  };

  const getPosition = (target: SpaceTarget, t: number): Point3D => {
    const { semiMajorAxis: a, eccentricity: e, inclination: i, raan: O, argPe: w, meanAnomaly: M0, period } = target.orbit;
    
    // t is a large timestamp number. We need to scale it to our orbit period.
    // period is roughly orbits per simulation tick unit.
    const M = (M0 + t * period) % (2 * Math.PI);
    
    const E = solveKepler(M, e);
    const sqrtTerm = Math.sqrt((1 + e) / (1 - e));
    const tanV2 = sqrtTerm * Math.tan(E / 2);
    const v = 2 * Math.atan(tanV2);
    const r = a * (1 - e * Math.cos(E));

    // Orbital Plane
    const x_orb = r * Math.cos(v);
    const y_orb = r * Math.sin(v);

    // 3D Rotations
    const cw = Math.cos(w * Math.PI/180);
    const sw = Math.sin(w * Math.PI/180);
    const x1 = x_orb * cw - y_orb * sw;
    const y1 = x_orb * sw + y_orb * cw;

    const ci = Math.cos(i * Math.PI/180);
    const si = Math.sin(i * Math.PI/180);
    const x2 = x1;
    const y2 = y1 * ci;
    const z2 = y1 * si;

    const cO = Math.cos(O * Math.PI/180);
    const sO = Math.sin(O * Math.PI/180);
    
    // Final 3D coord (Y is up in our math, but for screen we might swap)
    // Let's stick to Y=Up for logic, then map to screen.
    return { 
      x: x2 * cO - y2 * sO, 
      y: z2, 
      z: x2 * sO + y2 * cO 
    };
  };

  // Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if(!rect) return;
    if (isDragging.current) {
      const deltaX = e.clientX - lastMouse.current.x;
      const deltaY = e.clientY - lastMouse.current.y;
      setRotation(prev => ({
        x: prev.x + deltaX * 0.005,
        y: Math.min(Math.max(prev.y + deltaY * 0.005, -Math.PI/2), Math.PI/2)
      }));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
    // Hover logic could go here
  };
  const handleMouseUp = () => isDragging.current = false;
  const handleWheel = (e: React.WheelEvent) => setZoom(prev => Math.min(Math.max(prev - e.deltaY * 0.001, 0.5), 4));

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // 3D Projector function
    const project = (p: Point3D): { x: number, y: number, z: number, scale: number } => {
      // Yaw (around Y axis)
      let x1 = p.x * Math.cos(rotation.x) - p.z * Math.sin(rotation.x);
      let z1 = p.x * Math.sin(rotation.x) + p.z * Math.cos(rotation.x);
      let y1 = p.y;

      // Pitch (around X axis)
      let y2 = y1 * Math.cos(rotation.y) - z1 * Math.sin(rotation.y);
      let z2 = y1 * Math.sin(rotation.y) + z1 * Math.cos(rotation.y);
      let x2 = x1;

      const scale = (FIELD_OF_VIEW / (FIELD_OF_VIEW + z2)) * zoom;
      return {
        x: cx + x2 * scale,
        y: cy - y2 * scale, // Invert Y for screen
        z: z2,
        scale
      };
    };

    // 1. Draw Stars (Parallax)
    starField.current.forEach((star, i) => {
       // Simple rotation effect for stars based on camera rot
       const sx = (star.x + rotation.x * 50 + width) % width;
       const sy = (star.y + rotation.y * 50 + height) % height;
       ctx.fillStyle = `rgba(255,255,255,${Math.abs(Math.sin(currentTime * 0.0005 + i)) * star.a})`;
       ctx.fillRect(sx, sy, star.s, star.s);
    });

    const renderList: { z: number, draw: () => void }[] = [];

    // 2. Prepare Earth (Wireframe Sphere)
    const step = 10;
    for(let lat = -90; lat <= 90; lat += step) {
      for(let lon = 0; lon < 360; lon += step) {
         // Convert Lat/Lon to 3D (simulating Earth rotation with currentTime)
         const earthRot = currentTime * 0.0001; 
         const phi = (90 - lat) * (Math.PI / 180);
         const theta = (lon) * (Math.PI / 180) + earthRot;
         
         const p = {
           x: EARTH_RADIUS * Math.sin(phi) * Math.cos(theta),
           y: EARTH_RADIUS * Math.cos(phi),
           z: EARTH_RADIUS * Math.sin(phi) * Math.sin(theta)
         };
         // Our system uses Y as UP, Z as Depth.
         // The sphere formula above uses Y as UP. Correct.

         const proj = project(p);
         
         // Back-face culling for points
         // But we want a wireframe.
         // Let's draw dots for vertices
         if (proj.scale > 0 && proj.z < 0) { // Z < 0 means in front of center in this projection logic? 
            // Wait, z2 is positive if "into" screen usually.
            // Let's rely on z-sort.
         }
         
         // Optimization: Only add points to render list, we'll draw lines later? 
         // No, simpler: Just draw dots for the "Grid" look.
         
         // Only render front-facing points to simulate solid sphere
         // Dot product of normal and view vector.
         // Normal at p is just p (normalized). View vector is roughly (0,0,-1).
         // Let's just use z-depth. If z2 is positive (away), it's backface? 
         // Let's check standard camera. Camera is at (0,0,-FOV). 
         
         // Quick hack: Draw a solid black circle first to mask background stars/orbits behind earth
      }
    }

    // Earth Core (Mask)
    renderList.push({
      z: 0, // Center
      draw: () => {
        const centerProj = project({x:0, y:0, z:0});
        // Radius scales with depth
        const r = EARTH_RADIUS * centerProj.scale; 
        
        // Atmosphere Glow
        const grad = ctx.createRadialGradient(centerProj.x, centerProj.y, r * 0.8, centerProj.x, centerProj.y, r * 1.4);
        grad.addColorStop(0, 'rgba(6, 182, 212, 0)');
        grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.1)');
        grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerProj.x, centerProj.y, r * 1.5, 0, Math.PI*2);
        ctx.fill();

        // Solid Black Sphere (to hide things behind)
        ctx.fillStyle = '#020617'; 
        ctx.beginPath();
        ctx.arc(centerProj.x, centerProj.y, r - 1, 0, Math.PI*2);
        ctx.fill();

        // Wireframe Grid (Front only)
        ctx.strokeStyle = '#0ea5e9'; // Sky-500
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        // Draw Latitudes
        for(let lat = -80; lat <= 80; lat += 20) {
           // Simplified: Draw ring
           const phi = (90 - lat) * (Math.PI / 180);
           const ringR = EARTH_RADIUS * Math.sin(phi);
           const ringY = EARTH_RADIUS * Math.cos(phi);
           
           for(let lon=0; lon<=360; lon+=10) {
              const theta = (lon * Math.PI/180) + (currentTime * 0.0005);
              const p = { x: ringR * Math.cos(theta), y: ringY, z: ringR * Math.sin(theta) };
              const pr = project(p);
              // Naive backface culling check for sphere
              // Rotated point z check
              if (pr.z < 0) { 
                 if(lon===0) ctx.moveTo(pr.x, pr.y);
                 else ctx.lineTo(pr.x, pr.y);
              } else {
                 ctx.moveTo(pr.x, pr.y); // break line
              }
           }
        }
        ctx.stroke();
      }
    });

    // 3. Targets
    targets.forEach(target => {
       // -- Orbit Path --
       if (showOrbits) {
          const orbitPoints: {x: number, y:number, z:number}[] = [];
          const segments = 90;
          for(let i=0; i<=segments; i++) {
             // We need to trace the full ellipse. 
             // We can use mean anomaly 0 to 2PI
             const simTarget = { ...target, orbit: { ...target.orbit, meanAnomaly: (i/segments)*360, period: 0 } }; 
             // Calculate position for this segment
             // Note: passing 0 time because we force M manually
             orbitPoints.push(project(getPosition(simTarget, 0)));
          }
          
          // Split path into front and back for correct z-sorting relative to Earth?
          // For high performance in this style, we often just draw orbit path with z-index of its center.
          // Or we can push segments to renderList.
          
          const avgZ = orbitPoints.reduce((acc, p) => acc + p.z, 0) / orbitPoints.length;
          
          renderList.push({
             z: avgZ, // Approximate depth
             draw: () => {
                ctx.beginPath();
                const isSelected = target.id === selectedTargetId;
                ctx.strokeStyle = isSelected ? '#fff' : target.orbit.color;
                ctx.lineWidth = isSelected ? 2 : (target.group === 'DEBRIS_FIELD' ? 0.5 : 1);
                ctx.shadowBlur = isSelected ? 10 : 0;
                ctx.shadowColor = target.orbit.color;
                ctx.globalAlpha = isSelected ? 0.9 : (target.group === 'DEBRIS_FIELD' ? 0.15 : 0.3);
                
                for(let i=0; i<orbitPoints.length - 1; i++) {
                   const p1 = orbitPoints[i];
                   const p2 = orbitPoints[i+1];
                   // Simple occlusion check: if z is very high (behind earth), fade out?
                   // We'll trust the painter's algo slightly, but lines intersecting spheres is hard in 2D canvas.
                   ctx.moveTo(p1.x, p1.y);
                   ctx.lineTo(p2.x, p2.y);
                }
                ctx.stroke();
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
             }
          });
       }

       // -- Satellite Object --
       const pos3D = getPosition(target, currentTime);
       const scr = project(pos3D);
       
       renderList.push({
          z: scr.z,
          draw: () => {
             // Occlusion: If behind earth (scr.z > 0 and distance < earthRadius?)
             // Simplified: if scr.z > 0, it might be behind.
             // Actually with our projection:
             // Earth center is z=0. 
             // If object z > 0, it is behind the plane of the earth.
             // If object x/y is within Earth radius on screen...
             const distFromCenter = Math.sqrt((scr.x - cx)**2 + (scr.y - cy)**2);
             const earthScreenRadius = EARTH_RADIUS * project({x:0,y:0,z:0}).scale * 0.9; // 0.9 fudge factor
             
             if (scr.z > 0 && distFromCenter < earthScreenRadius) {
                // Behind Earth -> Don't draw or draw dim
                return; 
             }

             const isSelected = target.id === selectedTargetId;
             ctx.fillStyle = isSelected ? '#fff' : target.orbit.color;
             
             // Icon Size
             const size = (isSelected ? 5 : 2.5) * scr.scale;
             
             // Glow
             if (target.riskLevel === 'CRITICAL') {
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ef4444';
             } else if (isSelected) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#fff';
             }

             // Draw Diamond for satellites, Circle for debris
             ctx.beginPath();
             if (target.type === 'DEBRIS') {
                ctx.arc(scr.x, scr.y, size, 0, Math.PI*2);
             } else {
                ctx.moveTo(scr.x, scr.y - size);
                ctx.lineTo(scr.x + size, scr.y);
                ctx.lineTo(scr.x, scr.y + size);
                ctx.lineTo(scr.x - size, scr.y);
                ctx.closePath();
             }
             ctx.fill();
             ctx.shadowBlur = 0;

             // Label if selected
             if (isSelected) {
                ctx.fillStyle = '#fff';
                ctx.font = '11px monospace';
                ctx.fillText(target.name, scr.x + 10, scr.y - 10);
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                ctx.moveTo(scr.x, scr.y);
                ctx.lineTo(scr.x + 8, scr.y - 8);
                ctx.stroke();
             }
          }
       });
    });

    // Sort by Depth (Z) descending -> Draw furthest first
    renderList.sort((a, b) => b.z - a.z);
    renderList.forEach(item => item.draw());

  }, [targets, showOrbits, selectedTargetId, rotation, zoom, currentTime]);

  // Resize Logic
  useEffect(() => {
    const handleResize = () => {
       if(containerRef.current && canvasRef.current) {
          canvasRef.current.width = containerRef.current.clientWidth;
          canvasRef.current.height = containerRef.current.clientHeight;
       }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative cursor-move bg-slate-950"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={() => onSelectTarget('')} // Deselect on background click
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
};

export default OrbitVisualizer;
