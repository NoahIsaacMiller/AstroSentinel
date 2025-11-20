
import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS, RISK_LABELS, ALERT_DATA } from '../constants';
import { AlertTriangle, AlertOctagon, Info, CheckCircle, ShieldAlert, Activity, CheckSquare } from 'lucide-react';

interface AlertsViewProps {
  language: Language;
}

const AlertsView: React.FC<AlertsViewProps> = ({ language }) => {
  const t = TRANSLATIONS[language].alerts;
  const categories = ALERT_DATA.CATEGORIES[language];
  const sources = ALERT_DATA.SOURCES[language];
  const messages = ALERT_DATA.MESSAGES[language];
  const riskLabels = RISK_LABELS[language];

  // Mock alerts state using translation keys
  const [alerts, setAlerts] = useState([
    { id: 1, level: 'CRITICAL', msgKey: 'COL_VEC', time: "10:04:22 UTC", active: true, catKey: 'ORBITAL', srcKey: 'RADAR-1' },
    { id: 2, level: 'WARNING', msgKey: 'SOLAR', time: "09:55:00 UTC", active: true, catKey: 'WEATHER', srcKey: 'NOAA-SWPC' },
    { id: 3, level: 'INFO', msgKey: 'HANDOVER', time: "08:00:00 UTC", active: false, catKey: 'SYSTEM', srcKey: 'AUTO' },
    { id: 4, level: 'CRITICAL', msgKey: 'LOSS', time: "07:42:11 UTC", active: true, catKey: 'COMMS', srcKey: 'SYS_MON' },
    { id: 5, level: 'INFO', msgKey: 'MANEUVER', time: "06:30:00 UTC", active: false, catKey: 'ORBITAL', srcKey: 'TELEMETRY' },
  ]);

  const [filter, setFilter] = useState<'ALL'|'CRITICAL'|'SYSTEM'>('ALL');

  const filteredAlerts = alerts.filter(a => {
      if (filter === 'ALL') return true;
      if (filter === 'CRITICAL') return a.level === 'CRITICAL';
      if (filter === 'SYSTEM') return a.catKey === 'SYSTEM' || a.catKey === 'COMMS';
      return true;
  });

  const acknowledge = (id: number) => {
      setAlerts(prev => prev.map(a => a.id === id ? {...a, active: false} : a));
  };

  const criticalCount = alerts.filter(a => a.level === 'CRITICAL' && a.active).length;

  const getLevelLabel = (level: string) => {
      if (level === 'CRITICAL') return riskLabels.CRITICAL;
      if (level === 'WARNING') return riskLabels.MEDIUM; // Warning maps to Medium/Caution roughly
      return riskLabels.LOW;
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-950 relative font-mono">
      {/* Top Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
         <div className={`p-4 rounded border ${criticalCount > 0 ? 'bg-red-950/30 border-red-500/50' : 'bg-green-950/30 border-green-500/50'}`}>
             <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">{t.threatLevel}</div>
             <div className={`text-2xl font-bold ${criticalCount > 0 ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
                 {t.defcon} {criticalCount > 0 ? '3' : '5'}
             </div>
         </div>
         <div className="p-4 rounded border border-cyan-900/30 bg-slate-900/30">
             <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">{t.activeAlerts}</div>
             <div className="text-2xl font-bold text-cyan-400">
                 {alerts.filter(a => a.active).length}
             </div>
         </div>
         <div className="p-4 rounded border border-slate-800 bg-slate-900/30">
             <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">{t.systemStatus}</div>
             <div className="text-xl font-bold text-slate-200 flex items-center gap-2">
                 <Activity size={20} className="text-green-500" /> {t.nominal}
             </div>
         </div>
         <div className="p-4 rounded border border-slate-800 bg-slate-900/30">
             <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">{t.lastScan}</div>
             <div className="text-xl font-bold text-slate-200">
                 T-00:00:05
             </div>
         </div>
      </div>

      {/* Main Table Section */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/20">
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
             <h2 className="text-lg text-slate-200 font-bold tracking-wider uppercase flex items-center gap-2">
                <ShieldAlert size={18} className="text-cyan-500" /> {t.title}
             </h2>
             <div className="flex gap-1 bg-slate-950 p-1 rounded border border-slate-800">
                <button onClick={()=>setFilter('ALL')} className={`text-[10px] px-3 py-1 rounded uppercase font-bold ${filter==='ALL'?'bg-cyan-700 text-white':'text-slate-500 hover:text-slate-300'}`}>{t.filterAll}</button>
                <button onClick={()=>setFilter('CRITICAL')} className={`text-[10px] px-3 py-1 rounded uppercase font-bold ${filter==='CRITICAL'?'bg-red-700 text-white':'text-slate-500 hover:text-slate-300'}`}>{t.filterCrit}</button>
                <button onClick={()=>setFilter('SYSTEM')} className={`text-[10px] px-3 py-1 rounded uppercase font-bold ${filter==='SYSTEM'?'bg-slate-700 text-white':'text-slate-500 hover:text-slate-300'}`}>{t.filterSys}</button>
             </div>
          </div>

          <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-500 uppercase font-bold tracking-wider">
                      <tr>
                          <th className="p-3 w-10"></th>
                          <th className="p-3">{t.colLevel}</th>
                          <th className="p-3">{t.colTime}</th>
                          <th className="p-3">{t.colCat}</th>
                          <th className="p-3">{t.colSrc}</th>
                          <th className="p-3 w-1/3">{t.colMsg}</th>
                          <th className="p-3 text-right">{t.colAct}</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                      {filteredAlerts.map(alert => (
                          <tr key={alert.id} className={`hover:bg-white/5 transition-colors ${!alert.active ? 'opacity-40' : ''}`}>
                              <td className="p-3">
                                  {alert.level === 'CRITICAL' ? <AlertOctagon size={16} className="text-red-500 animate-pulse" /> :
                                   alert.level === 'WARNING' ? <AlertTriangle size={16} className="text-orange-500" /> :
                                   <Info size={16} className="text-cyan-500" />}
                              </td>
                              <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border
                                      ${alert.level === 'CRITICAL' ? 'border-red-900 bg-red-950/50 text-red-400' : 
                                        alert.level === 'WARNING' ? 'border-orange-900 bg-orange-950/50 text-orange-400' : 
                                        'border-cyan-900 bg-cyan-950/50 text-cyan-400'}`}>
                                      {getLevelLabel(alert.level)}
                                  </span>
                              </td>
                              <td className="p-3 text-slate-400 font-mono">{alert.time}</td>
                              <td className="p-3 text-slate-300">{(categories as any)[alert.catKey]}</td>
                              <td className="p-3 text-slate-500">{(sources as any)[alert.srcKey]}</td>
                              <td className={`p-3 font-bold ${alert.active ? 'text-white' : 'text-slate-500'}`}>
                                  {(messages as any)[alert.msgKey]}
                              </td>
                              <td className="p-3 text-right">
                                  {alert.active && (
                                      <button 
                                        onClick={() => acknowledge(alert.id)}
                                        className="text-cyan-500 hover:text-cyan-300 flex items-center gap-1 ml-auto px-2 py-1 rounded hover:bg-cyan-900/30 border border-transparent hover:border-cyan-800 transition-all"
                                      >
                                          <CheckSquare size={14} /> <span className="text-[9px] uppercase font-bold">{t.ack}</span>
                                      </button>
                                  )}
                                  {!alert.active && (
                                      <span className="text-green-500 flex items-center justify-end gap-1 text-[9px] uppercase font-bold">
                                          <CheckCircle size={14} /> {t.resolved}
                                      </span>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          
          {filteredAlerts.length === 0 && (
            <div className="p-12 text-center text-slate-600 italic">
                {t.noEvents}
            </div>
          )}
      </div>
    </div>
  );
};

export default AlertsView;
