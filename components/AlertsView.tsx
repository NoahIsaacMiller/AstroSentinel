
import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { AlertTriangle, AlertOctagon, Info, CheckCircle, Filter, CheckSquare } from 'lucide-react';

interface AlertsViewProps {
  language: Language;
}

const AlertsView: React.FC<AlertsViewProps> = ({ language }) => {
  const t = TRANSLATIONS[language].alerts;

  // Mock alerts state
  const [alerts, setAlerts] = useState([
    { id: 1, level: 'CRITICAL', msg: "COLLISION VECTOR: T-004 / T-001", time: "10:04:22 UTC", active: true, category: 'COLLISION' },
    { id: 2, level: 'WARNING', msg: "SOLAR FLARE (X-CLASS) DETECTED", time: "09:55:00 UTC", active: true, category: 'WEATHER' },
    { id: 3, level: 'INFO', msg: "DATABASE SYNC COMPLETE", time: "08:00:00 UTC", active: false, category: 'SYSTEM' },
    { id: 4, level: 'CRITICAL', msg: "LOSS OF SIGNAL: DSN-2", time: "07:42:11 UTC", active: true, category: 'SYSTEM' },
  ]);

  const [filter, setFilter] = useState<'ALL'|'CRITICAL'|'SYSTEM'>('ALL');

  const filteredAlerts = alerts.filter(a => {
      if (filter === 'ALL') return true;
      if (filter === 'CRITICAL') return a.level === 'CRITICAL';
      if (filter === 'SYSTEM') return a.category === 'SYSTEM';
      return true;
  });

  const acknowledge = (id: number) => {
      setAlerts(prev => prev.map(a => a.id === id ? {...a, active: false} : a));
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950 relative">
      <h2 className="text-2xl text-red-500 font-bold tracking-wider uppercase mb-8 border-b border-red-900/30 pb-4 flex items-center gap-2 justify-between">
        <span className="flex items-center gap-2"><AlertTriangle /> {t.title}</span>
        <div className="flex gap-2">
            <button onClick={()=>setFilter('ALL')} className={`text-xs px-3 py-1 rounded border ${filter==='ALL'?'bg-red-900/40 border-red-500 text-white':'border-slate-800 text-slate-500'}`}>{t.filterAll}</button>
            <button onClick={()=>setFilter('CRITICAL')} className={`text-xs px-3 py-1 rounded border ${filter==='CRITICAL'?'bg-red-900/40 border-red-500 text-white':'border-slate-800 text-slate-500'}`}>{t.filterCrit}</button>
            <button onClick={()=>setFilter('SYSTEM')} className={`text-xs px-3 py-1 rounded border ${filter==='SYSTEM'?'bg-red-900/40 border-red-500 text-white':'border-slate-800 text-slate-500'}`}>{t.filterSys}</button>
        </div>
      </h2>

      <div className="max-w-4xl mx-auto space-y-4">
        {filteredAlerts.map(alert => (
          <div 
            key={alert.id} 
            className={`flex items-start gap-4 p-4 rounded border-l-4 backdrop-blur-sm transition-all duration-300 group
            ${!alert.active ? 'opacity-50 grayscale' : ''}
            ${alert.level === 'CRITICAL' 
              ? 'bg-red-950/20 border-l-red-500 border-y border-r border-red-900/20 text-red-100' 
              : alert.level === 'WARNING' 
              ? 'bg-orange-950/20 border-l-orange-500 border-y border-r border-orange-900/20 text-orange-100' 
              : 'bg-slate-900/50 border-l-cyan-500 border-y border-r border-slate-800 text-slate-300'}`}
          >
             <div className="mt-1">
               {alert.level === 'CRITICAL' ? <AlertOctagon size={24} className={`${alert.active ? 'animate-pulse' : ''} text-red-500`} /> :
                alert.level === 'WARNING' ? <AlertTriangle size={24} className="text-orange-500" /> :
                <Info size={24} className="text-cyan-500" />}
             </div>
             <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                   <div className="flex gap-2">
                       <span className={`font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider
                          ${alert.level === 'CRITICAL' ? 'bg-red-600/50 text-white' : alert.level === 'WARNING' ? 'bg-orange-600/50 text-white' : 'bg-cyan-900/50 text-cyan-200'}`}>
                          {alert.level === 'CRITICAL' ? t.critical : alert.level === 'WARNING' ? t.warning : t.info}
                       </span>
                       <span className="text-[10px] px-2 py-0.5 border border-slate-700 rounded text-slate-500 font-mono">{alert.category}</span>
                   </div>
                   <span className="font-mono text-xs opacity-70">{alert.time}</span>
                </div>
                <p className="font-mono text-sm font-bold">{alert.msg}</p>
             </div>
             {alert.active && (
                 <button onClick={() => acknowledge(alert.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-slate-950 border border-slate-700 rounded hover:bg-slate-800 text-slate-400" title={t.ack}>
                     <CheckSquare size={16} />
                 </button>
             )}
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="text-center py-20 text-slate-600 flex flex-col items-center gap-4 opacity-50">
            <CheckCircle size={64} className="text-green-900" />
            <p className="uppercase tracking-widest">{t.noAlerts}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsView;
