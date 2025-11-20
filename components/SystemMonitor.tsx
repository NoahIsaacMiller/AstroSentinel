
import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Server, Activity, Wifi, Database, Zap, Share2 } from 'lucide-react';

interface SystemMonitorProps {
  language: Language;
}

const SystemMonitor: React.FC<SystemMonitorProps> = ({ language }) => {
  const t = TRANSLATIONS[language].system;
  
  const [metrics, setMetrics] = useState({
    core1: 45,
    core2: 62,
    core3: 28,
    power: [40, 45, 42, 50, 55, 52, 48, 60, 65, 62], // History for chart
    latency: 12,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        core1: Math.random() * 60 + 20,
        core2: Math.random() * 60 + 20,
        core3: Math.random() * 60 + 20,
        power: [...prev.power.slice(1), Math.random() * 30 + 40],
        latency: Math.floor(Math.random() * 20 + 10),
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950 text-slate-300">
      <h2 className="text-2xl text-cyan-400 font-bold tracking-wider uppercase mb-8 border-b border-cyan-900/50 pb-4 flex items-center gap-2">
        <Activity /> {t.title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Processor Status */}
        <div className="bg-slate-900/40 border border-cyan-900/30 p-4 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4 text-cyan-300 border-b border-cyan-900/20 pb-2">
            <Server size={16} />
            <h3 className="font-bold text-xs uppercase tracking-widest">{t.cpu}</h3>
          </div>
          <div className="space-y-4">
             {['PRIMARY', 'SECONDARY', 'PHYSICS_AI'].map((label, idx) => {
               const val = idx === 0 ? metrics.core1 : idx === 1 ? metrics.core2 : metrics.core3;
               return (
                 <div key={label}>
                    <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-400">
                      <span>{label}</span>
                      <span>{val.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${val}%` }}></div>
                    </div>
                 </div>
               );
             })}
          </div>
        </div>

        {/* 2. Power Grid History (Chart) */}
        <div className="bg-slate-900/40 border border-cyan-900/30 p-4 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4 text-yellow-400 border-b border-yellow-900/20 pb-2">
            <Zap size={16} />
            <h3 className="font-bold text-xs uppercase tracking-widest">{t.power}</h3>
          </div>
          <div className="h-32 flex items-end gap-1">
             {metrics.power.map((val, i) => (
                <div key={i} className="flex-1 bg-yellow-500/20 border-t border-yellow-500 relative group">
                   <div className="absolute bottom-0 left-0 right-0 bg-yellow-500/30 transition-all duration-500" style={{ height: `${val}%` }}></div>
                </div>
             ))}
          </div>
          <div className="mt-2 text-[10px] font-mono text-yellow-600 text-center">KW/h OUTPUT HISTORY</div>
        </div>

        {/* 3. Network Topology (Visual) */}
        <div className="bg-slate-900/40 border border-cyan-900/30 p-4 rounded-lg backdrop-blur-sm relative overflow-hidden">
           <div className="flex items-center gap-2 mb-4 text-purple-400 border-b border-purple-900/20 pb-2 relative z-10">
            <Share2 size={16} />
            <h3 className="font-bold text-xs uppercase tracking-widest">{t.topology}</h3>
           </div>
           
           {/* Simulated Nodes */}
           <div className="h-32 relative z-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_15px_cyan] animate-pulse z-10">
                 <Database size={14} className="text-black" />
              </div>
              {/* Satellites */}
              {[0, 72, 144, 216, 288].map((deg, i) => (
                 <div key={i} className="absolute top-1/2 left-1/2 w-2 h-2 bg-purple-500 rounded-full" style={{
                    transform: `translate(-50%, -50%) rotate(${deg}deg) translate(60px) rotate(-${deg}deg)`
                 }}>
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-1/2 w-[60px] h-[1px] bg-purple-500/50 origin-left" style={{ transform: `rotate(${deg + 180}deg)` }}></div>
                 </div>
              ))}
           </div>
        </div>

        {/* 4. Global Sensor Array Table */}
        <div className="col-span-1 md:col-span-3 bg-slate-900/40 border border-cyan-900/30 p-4 rounded-lg font-mono text-xs">
          <div className="flex items-center gap-2 mb-4 text-slate-300 border-b border-slate-800 pb-2">
            <Wifi size={16} />
            <h3 className="font-bold text-xs uppercase tracking-widest">{t.sensors}</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-500">DSN-GOLDSTONE</span>
                <span className="text-green-500">{t.online}</span>
             </div>
             <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-500">DSN-MADRID</span>
                <span className="text-green-500">{t.online}</span>
             </div>
             <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-500">DSN-CANBERRA</span>
                <span className="text-green-500">{t.online}</span>
             </div>
             <div className="bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center">
                <span className="text-slate-500">LUNAR-RELAY</span>
                <span className="text-yellow-500 animate-pulse">{t.calibrating}</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SystemMonitor;
