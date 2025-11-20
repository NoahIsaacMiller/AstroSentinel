
import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Server, Activity, Database, Globe, HardDrive, Cpu, Wifi, ArrowDown, ArrowUp, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface SystemMonitorProps {
  language: Language;
}

type TimeFrame = '15m' | '1h' | '12h';

interface ServerStatus {
  id: string;
  name: string;
  status: 'ONLINE' | 'WARNING' | 'OFFLINE';
  uptime: string;
}

const SystemMonitor: React.FC<SystemMonitorProps> = ({ language }) => {
  const t = TRANSLATIONS[language].system;
  
  // State
  const [loadTimeframe, setLoadTimeframe] = useState<TimeFrame>('15m');
  const [loadHistory, setLoadHistory] = useState<number[]>([]);
  const [serverStatuses, setServerStatuses] = useState<ServerStatus[]>([]);
  const [metrics, setMetrics] = useState({
    cpu: 24,
    mem: 48,
    disk: 76,
    netUp: 45.2,
    netDown: 120.5,
    latency: 14
  });

  // Simulate Load Data based on timeframe
  useEffect(() => {
    const generateData = () => {
      const points = 30;
      const data = [];
      let base = loadTimeframe === '15m' ? 30 : loadTimeframe === '1h' ? 45 : 60;
      let volatility = loadTimeframe === '15m' ? 15 : 5;
      
      for(let i=0; i<points; i++) {
        data.push(Math.min(100, Math.max(10, base + Math.random() * volatility - volatility/2)));
      }
      setLoadHistory(data);
    };

    generateData();
    const interval = setInterval(generateData, 5000); // Refresh data occasionally
    return () => clearInterval(interval);
  }, [loadTimeframe]);

  // Real-time metric ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.min(100, Math.max(10, prev.cpu + Math.random() * 10 - 5)),
        mem: Math.min(100, Math.max(30, prev.mem + Math.random() * 4 - 2)),
        disk: 76, // Static mostly
        netUp: Math.max(10, prev.netUp + Math.random() * 5 - 2.5),
        netDown: Math.max(50, prev.netDown + Math.random() * 20 - 10),
        latency: Math.max(5, prev.latency + Math.random() * 4 - 2)
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initial Servers
  useEffect(() => {
    setServerStatuses([
      { id: 'S01', name: 'CORE-PHYSICS-01', status: 'ONLINE', uptime: '45d 12h' },
      { id: 'S02', name: 'DB-PRIMARY-SHARD', status: 'ONLINE', uptime: '12d 04h' },
      { id: 'S03', name: 'AI-INFERENCE-NODE', status: 'WARNING', uptime: '0d 01h' },
      { id: 'S04', name: 'SAT-COMMS-RELAY', status: 'ONLINE', uptime: '88d 20h' },
      { id: 'S05', name: 'BACKUP-STORAGE', status: 'ONLINE', uptime: '120d 00h' },
      { id: 'S06', name: 'FRONTEND-LB-02', status: 'OFFLINE', uptime: '0d 00h' },
      { id: 'S07', name: 'DSN-UPLINK-A', status: 'ONLINE', uptime: '15d 09h' },
      { id: 'S08', name: 'ANALYTICS-WORKER', status: 'ONLINE', uptime: '3d 14h' },
    ]);
  }, []);

  // Helper for SVG Path
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
  
  const getAreaPath = (data: number[], max: number, height: number, width: number) => {
      if (data.length === 0) return "";
      const line = getLinePath(data, max, height, width);
      return `${line} L${width},${height} L0,${height} Z`;
  };

  const onlineCount = serverStatuses.filter(s => s.status === 'ONLINE' || s.status === 'WARNING').length;

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950 text-slate-300 font-mono">
      <h2 className="text-2xl text-cyan-400 font-bold tracking-wider uppercase mb-8 border-b border-cyan-900/50 pb-4 flex items-center gap-2">
        <Activity /> {t.title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
         {/* 1. CPU Summary */}
         <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-lg relative overflow-hidden">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Cpu size={14} /> {t.cpu}</span>
                <span className="text-cyan-400 font-bold">{metrics.cpu.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 transition-all duration-500" style={{width: `${metrics.cpu}%`}}></div>
            </div>
         </div>

         {/* 2. Mem Summary */}
         <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-lg relative overflow-hidden">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Database size={14} /> {t.mem}</span>
                <span className="text-purple-400 font-bold">{metrics.mem.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 transition-all duration-500" style={{width: `${metrics.mem}%`}}></div>
            </div>
         </div>

         {/* 3. Disk Summary */}
         <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-lg relative overflow-hidden">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><HardDrive size={14} /> {t.disk}</span>
                <span className="text-orange-400 font-bold">{metrics.disk.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 transition-all duration-500" style={{width: `${metrics.disk}%`}}></div>
            </div>
         </div>

         {/* 4. Online Servers Count */}
         <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
            <div>
                <div className="text-xs font-bold text-slate-500 uppercase mb-1">{t.onlineServers}</div>
                <div className="text-2xl font-bold text-white">{onlineCount} <span className="text-slate-600 text-sm">/ {serverStatuses.length}</span></div>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_lime]"></div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
         {/* Main Load Chart */}
         <div className="lg:col-span-2 bg-slate-900/40 border border-cyan-900/30 p-6 rounded-lg">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="text-sm font-bold text-cyan-400 uppercase flex items-center gap-2">
                     <Activity size={16} /> {t.loadAvg}
                 </h3>
                 <div className="flex bg-slate-950 rounded p-1 border border-slate-800">
                     {(['15m', '1h', '12h'] as TimeFrame[]).map(frame => (
                         <button 
                            key={frame}
                            onClick={() => setLoadTimeframe(frame)}
                            className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors ${loadTimeframe === frame ? 'bg-cyan-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                         >
                             {frame === '15m' ? t.time15m : frame === '1h' ? t.time1h : t.time12h}
                         </button>
                     ))}
                 </div>
             </div>
             <div className="h-48 w-full bg-slate-950/50 border border-slate-800 relative rounded overflow-hidden">
                <svg width="100%" height="100%" viewBox="0 0 600 100" preserveAspectRatio="none" className="absolute inset-0">
                     <path d={getAreaPath(loadHistory, 100, 100, 600)} fill="rgba(6,182,212,0.1)" stroke="none" />
                     <path d={getLinePath(loadHistory, 100, 100, 600)} fill="none" stroke="#06b6d4" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </svg>
                {/* Grid lines */}
                <div className="absolute inset-0 border-t border-slate-800/50" style={{top: '25%'}}></div>
                <div className="absolute inset-0 border-t border-slate-800/50" style={{top: '50%'}}></div>
                <div className="absolute inset-0 border-t border-slate-800/50" style={{top: '75%'}}></div>
             </div>
         </div>

         {/* Network Status */}
         <div className="bg-slate-900/40 border border-green-900/30 p-6 rounded-lg">
             <h3 className="text-sm font-bold text-green-400 uppercase flex items-center gap-2 mb-6">
                 <Wifi size={16} /> {t.netStatus}
             </h3>
             
             <div className="flex flex-col gap-6">
                 <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                     <div className="flex items-center gap-3">
                         <div className="bg-slate-950 p-2 rounded text-green-500"><CheckCircle size={20} /></div>
                         <div>
                             <div className="text-xs text-slate-500 uppercase">CONNECTION</div>
                             <div className="font-bold text-green-400">{t.stable}</div>
                         </div>
                     </div>
                     <div className="text-right">
                         <div className="text-xs text-slate-500 uppercase">{t.latency}</div>
                         <div className="font-bold text-white">{metrics.latency.toFixed(0)} ms</div>
                     </div>
                 </div>

                 <div className="space-y-4">
                     <div>
                         <div className="flex justify-between text-xs mb-1">
                             <span className="text-slate-500 flex items-center gap-1"><ArrowUp size={10}/> {t.upload}</span>
                             <span className="text-cyan-300 font-mono">{metrics.netUp.toFixed(1)} MB/s</span>
                         </div>
                         <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                             <div className="h-full bg-cyan-600" style={{width: `${(metrics.netUp/100)*100}%`}}></div>
                         </div>
                     </div>
                     <div>
                         <div className="flex justify-between text-xs mb-1">
                             <span className="text-slate-500 flex items-center gap-1"><ArrowDown size={10}/> {t.download}</span>
                             <span className="text-purple-300 font-mono">{metrics.netDown.toFixed(1)} MB/s</span>
                         </div>
                         <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                             <div className="h-full bg-purple-600" style={{width: `${(metrics.netDown/200)*100}%`}}></div>
                         </div>
                     </div>
                 </div>
             </div>
         </div>
      </div>

      {/* Server Status List */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2 mb-6">
              <Server size={16} /> {t.serverStatus}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {serverStatuses.map(server => (
                  <div key={server.id} className="bg-slate-950 border border-slate-800 p-3 rounded flex items-center justify-between group hover:border-slate-600 transition-colors">
                      <div>
                          <div className="text-[10px] text-slate-500 font-bold">{server.id}</div>
                          <div className="text-xs font-bold text-slate-200 my-0.5">{server.name}</div>
                          <div className="text-[10px] text-slate-600 font-mono">{server.uptime}</div>
                      </div>
                      <div>
                          {server.status === 'ONLINE' && <CheckCircle size={16} className="text-green-500" />}
                          {server.status === 'WARNING' && <AlertTriangle size={16} className="text-yellow-500 animate-pulse" />}
                          {server.status === 'OFFLINE' && <XCircle size={16} className="text-red-500" />}
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
