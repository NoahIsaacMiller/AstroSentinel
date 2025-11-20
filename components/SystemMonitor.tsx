
import React, { useEffect, useState, useRef } from 'react';
import { Language, AccessLog } from '../types';
import { TRANSLATIONS } from '../constants';
import { Server, Activity, Database, Globe, ShieldCheck, HardDrive, Cpu } from 'lucide-react';

interface SystemMonitorProps {
  language: Language;
}

const SystemMonitor: React.FC<SystemMonitorProps> = ({ language }) => {
  const t = TRANSLATIONS[language].system;
  
  // Data States
  const [cpuHistory, setCpuHistory] = useState<number[]>(new Array(20).fill(20));
  const [ramHistory, setRamHistory] = useState<number[]>(new Array(20).fill(40));
  const [netHistory, setNetHistory] = useState<number[]>(new Array(20).fill(10));
  const [logs, setLogs] = useState<AccessLog[]>([]);
  
  const sensorCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString();
      
      // Update Charts
      setCpuHistory(prev => [...prev.slice(1), Math.random() * 40 + 20]); 
      setRamHistory(prev => [...prev.slice(1), Math.random() * 10 + 45]);
      setNetHistory(prev => [...prev.slice(1), Math.random() * 500 + 100]);

      // Add Access Log
      if (Math.random() > 0.5) {
         const newLog: AccessLog = {
            id: Math.random().toString(36).substr(2, 5),
            ip: `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
            endpoint: ['/api/telemetry', '/api/auth', '/ws/stream', '/db/query'][Math.floor(Math.random()*4)],
            status: Math.random() > 0.9 ? 401 : 200,
            timestamp: time,
            latency: Math.floor(Math.random() * 50 + 10)
         };
         setLogs(prev => [newLog, ...prev.slice(0, 7)]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sensor Heatmap Animation
  useEffect(() => {
      const canvas = sensorCanvasRef.current;
      if(!canvas) return;
      const ctx = canvas.getContext('2d');
      if(!ctx) return;
      
      const draw = () => {
          ctx.clearRect(0,0,300,150);
          // Grid
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for(let i=0; i<300; i+=20) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,150); ctx.stroke(); }
          for(let i=0; i<150; i+=20) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(300,i); ctx.stroke(); }
          
          // Heatmap dots
          for(let i=0; i<20; i++) {
              const x = Math.random() * 300;
              const y = Math.random() * 150;
              const r = Math.random() * 5;
              ctx.fillStyle = Math.random() > 0.8 ? 'rgba(6,182,212,0.8)' : 'rgba(34,197,94,0.4)';
              ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
          }
      };
      const interval = setInterval(draw, 500);
      return () => clearInterval(interval);
  }, []);

  // Helper for SVG Path
  const getPath = (data: number[], max: number, height: number, width: number) => {
    if (data.length === 0) return "";
    const step = width / (data.length - 1);
    const points = data.map((val, i) => {
       const x = i * step;
       const y = height - (val / max) * height;
       return `${x},${y}`;
    });
    return `M0,${height} L${points.join(' L')} L${width},${height} Z`;
  };

  const getLinePath = (data: number[], max: number, height: number, width: number) => {
    if (data.length === 0) return "";
    const step = width / (data.length - 1);
    const points = data.map((val, i) => {
       const x = i * step;
       const y = height - (val / max) * height;
       return `${x},${y}`;
    });
    return `M${points.join(' L')}`;
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950 text-slate-300 font-mono">
      <h2 className="text-2xl text-cyan-400 font-bold tracking-wider uppercase mb-8 border-b border-cyan-900/50 pb-4 flex items-center gap-2">
        <Activity /> {t.title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. CPU Usage Area Chart */}
        <div className="bg-slate-900/40 border border-cyan-900/30 p-4 rounded-lg backdrop-blur-sm">
           <div className="flex justify-between mb-2 text-cyan-300 text-xs font-bold uppercase">
              <span className="flex items-center gap-2"><Server size={14}/> {t.cpu}</span>
              <span>{cpuHistory[cpuHistory.length-1].toFixed(1)}%</span>
           </div>
           <div className="h-24 w-full bg-slate-950/50 border border-slate-800 relative overflow-hidden rounded">
              <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none" className="absolute inset-0">
                 <path d={getPath(cpuHistory, 100, 100, 300)} fill="rgba(6,182,212,0.2)" stroke="none" />
                 <path d={getLinePath(cpuHistory, 100, 100, 300)} fill="none" stroke="#06b6d4" strokeWidth="2" />
              </svg>
           </div>
        </div>

        {/* 2. Memory Usage Area Chart */}
        <div className="bg-slate-900/40 border border-purple-900/30 p-4 rounded-lg backdrop-blur-sm">
           <div className="flex justify-between mb-2 text-purple-300 text-xs font-bold uppercase">
              <span className="flex items-center gap-2"><Database size={14}/> {t.mem}</span>
              <span>{ramHistory[ramHistory.length-1].toFixed(1)}%</span>
           </div>
           <div className="h-24 w-full bg-slate-950/50 border border-slate-800 relative overflow-hidden rounded">
              <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none" className="absolute inset-0">
                 <path d={getPath(ramHistory, 100, 100, 300)} fill="rgba(147,51,234,0.2)" stroke="none" />
                 <path d={getLinePath(ramHistory, 100, 100, 300)} fill="none" stroke="#9333ea" strokeWidth="2" />
              </svg>
           </div>
        </div>

        {/* 3. Network Requests Area Chart */}
        <div className="bg-slate-900/40 border border-green-900/30 p-4 rounded-lg backdrop-blur-sm">
           <div className="flex justify-between mb-2 text-green-300 text-xs font-bold uppercase">
              <span className="flex items-center gap-2"><Globe size={14}/> {t.net}</span>
              <span>{Math.floor(netHistory[netHistory.length-1])} {t.requests}</span>
           </div>
           <div className="h-24 w-full bg-slate-950/50 border border-slate-800 relative overflow-hidden rounded">
              <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none" className="absolute inset-0">
                 <path d={getPath(netHistory, 800, 100, 300)} fill="rgba(34,197,94,0.2)" stroke="none" />
                 <path d={getLinePath(netHistory, 800, 100, 300)} fill="none" stroke="#22c55e" strokeWidth="2" />
              </svg>
           </div>
        </div>

        {/* 4. Access Logs Table */}
        <div className="col-span-1 md:col-span-2 bg-slate-900/40 border border-slate-800 p-4 rounded-lg">
           <div className="flex items-center gap-2 mb-4 text-slate-400 border-b border-slate-800 pb-2 text-xs font-bold uppercase">
              <ShieldCheck size={14} /> {t.logs}
           </div>
           <table className="w-full text-[10px] text-left">
              <thead className="text-slate-500 uppercase">
                 <tr>
                    <th className="pb-2">Time</th>
                    <th className="pb-2">IP Address</th>
                    <th className="pb-2">Endpoint</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Latency</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                 {logs.map(log => (
                    <tr key={log.id} className="hover:bg-white/5">
                       <td className="py-2 text-cyan-600">{log.timestamp}</td>
                       <td className="py-2 text-slate-300">{log.ip}</td>
                       <td className="py-2 text-slate-400">{log.endpoint}</td>
                       <td className={`py-2 ${log.status === 200 ? 'text-green-500' : 'text-red-500'}`}>{log.status}</td>
                       <td className="py-2 text-right text-slate-500">{log.latency}ms</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>

        {/* 5. Active Nodes / Sensor Map */}
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-lg">
           <div className="flex items-center gap-2 mb-4 text-slate-400 border-b border-slate-800 pb-2 text-xs font-bold uppercase">
              <Globe size={14} /> {t.sensors}
           </div>
           <canvas ref={sensorCanvasRef} width="300" height="150" className="w-full h-32 bg-slate-950 border border-slate-800 rounded opacity-70"></canvas>
        </div>

        {/* 6. Storage Clusters (Visual Only) */}
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-lg col-span-full md:col-span-3">
            <div className="flex items-center gap-2 mb-4 text-slate-400 border-b border-slate-800 pb-2 text-xs font-bold uppercase">
              <HardDrive size={14} /> {t.power}
           </div>
           <div className="flex gap-4 justify-around">
               {[1,2,3,4].map(i => (
                   <div key={i} className="flex-1 bg-slate-950 p-3 rounded border border-slate-800 flex items-center gap-4">
                       <Cpu size={24} className="text-slate-600" />
                       <div>
                           <div className="text-[10px] text-slate-500 uppercase">Cluster-0{i}</div>
                           <div className="h-1.5 w-24 bg-slate-800 rounded-full mt-1 overflow-hidden">
                               <div className="h-full bg-cyan-600" style={{width: `${Math.random()*40+40}%`}}></div>
                           </div>
                           <div className="text-[9px] text-cyan-400 mt-1 text-right">HEALTHY</div>
                       </div>
                   </div>
               ))}
           </div>
        </div>

      </div>
    </div>
  );
};

export default SystemMonitor;
