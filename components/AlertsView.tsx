
import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { AlertTriangle, AlertOctagon, Info, CheckCircle } from 'lucide-react';

interface AlertsViewProps {
  language: Language;
}

const AlertsView: React.FC<AlertsViewProps> = ({ language }) => {
  const t = TRANSLATIONS[language].alerts;

  // Mock alerts
  const alerts = [
    { id: 1, level: 'CRITICAL', msg: "COLLISION VECTOR: T-004 / T-001", time: "10:04:22 UTC", active: true },
    { id: 2, level: 'WARNING', msg: "SOLAR FLARE (X-CLASS) DETECTED", time: "09:55:00 UTC", active: true },
    { id: 3, level: 'INFO', msg: "DATABASE SYNC COMPLETE", time: "08:00:00 UTC", active: false },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <h2 className="text-2xl text-red-500 font-bold tracking-wider uppercase mb-8 border-b border-red-900/30 pb-4 flex items-center gap-2">
        <AlertTriangle /> {t.title}
      </h2>

      <div className="max-w-3xl mx-auto space-y-4">
        {alerts.map(alert => (
          <div 
            key={alert.id} 
            className={`flex items-start gap-4 p-4 rounded border-l-4 backdrop-blur-sm transition-all hover:translate-x-1
            ${alert.level === 'CRITICAL' 
              ? 'bg-red-950/20 border-l-red-500 border-y border-r border-red-900/20 text-red-100' 
              : alert.level === 'WARNING' 
              ? 'bg-orange-950/20 border-l-orange-500 border-y border-r border-orange-900/20 text-orange-100' 
              : 'bg-slate-900/50 border-l-cyan-500 border-y border-r border-slate-800 text-slate-300'}`}
          >
             <div className="mt-1">
               {alert.level === 'CRITICAL' ? <AlertOctagon size={24} className="text-red-500 animate-pulse" /> :
                alert.level === 'WARNING' ? <AlertTriangle size={24} className="text-orange-500" /> :
                <Info size={24} className="text-cyan-500" />}
             </div>
             <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                   <span className={`font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider
                      ${alert.level === 'CRITICAL' ? 'bg-red-600/50 text-white' : alert.level === 'WARNING' ? 'bg-orange-600/50 text-white' : 'bg-cyan-900/50 text-cyan-200'}`}>
                      {alert.level === 'CRITICAL' ? t.critical : alert.level === 'WARNING' ? t.warning : t.info}
                   </span>
                   <span className="font-mono text-xs opacity-70">{alert.time}</span>
                </div>
                <p className="font-mono text-sm font-bold">{alert.msg}</p>
             </div>
          </div>
        ))}

        {alerts.length === 0 && (
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
