
import React, { useState, useEffect } from 'react';
import { SpaceTarget, Language, GeoPosition } from '../types';
import { TRANSLATIONS, TYPE_LABELS, GROUND_STATIONS } from '../constants';
import { PhysicsEngine } from '../utils';
import { Disc, AlertTriangle, Radio, Satellite, Hexagon, Search, LocateFixed, Signal, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

interface SidebarProps {
  targets: SpaceTarget[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  language: Language;
}

const Sidebar: React.FC<SidebarProps> = ({ targets, selectedId, onSelect, language }) => {
  const t = TRANSLATIONS[language];
  const d = t.dashboard;
  const typeLabels = TYPE_LABELS[language];

  const [search, setSearch] = useState('');
  const [telemetry, setTelemetry] = useState<GeoPosition | null>(null);
  const [visibleStation, setVisibleStation] = useState<string | null>(null);
  const [orbitalDetails, setOrbitalDetails] = useState<{apogee: number, perigee: number, period: number} | null>(null);

  const filteredTargets = targets.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.id.toLowerCase().includes(search.toLowerCase())
  );

  const getIcon = (type: string) => {
    switch(type) {
      case 'SATELLITE': return <Satellite size={14} />;
      case 'DEBRIS': return <AlertTriangle size={14} />;
      case 'STATION': return <Radio size={14} />;
      case 'ASTEROID': return <Hexagon size={14} />;
      default: return <Disc size={14} />;
    }
  };

  // Live Telemetry Loop
  useEffect(() => {
    if (!selectedId) {
        setTelemetry(null);
        setVisibleStation(null);
        setOrbitalDetails(null);
        return;
    }
    
    const target = targets.find(t => t.id === selectedId);
    if (!target) return;

    // Calculate static orbital details
    const details = PhysicsEngine.getOrbitalDetails(target.orbit);
    setOrbitalDetails({
        apogee: details.apogee,
        perigee: details.perigee,
        period: details.periodMin
    });

    const interval = setInterval(() => {
       const now = Date.now();
       const geo = PhysicsEngine.getGeoPosition(target, now);
       setTelemetry(geo);

       // Check Ground Station Visibility
       let stationName = null;
       for (const station of GROUND_STATIONS) {
          const el = PhysicsEngine.getLookAngle(station, target, now);
          if (el > 5) { // 5 degrees elevation mask
             stationName = station.name;
             break;
          }
       }
       setVisibleStation(stationName);

    }, 250); // 4Hz update for smoother numbers

    return () => clearInterval(interval);
  }, [selectedId, targets]);

  return (
    <div className="w-80 h-full border-r border-cyan-900/30 bg-slate-950/90 backdrop-blur-md flex flex-col z-20 shadow-2xl font-mono">
      {/* Header & Stats */}
      <div className="p-4 border-b border-cyan-900/30 bg-slate-900/50">
        <h2 className="text-cyan-400 font-bold tracking-widest text-xs mb-2 uppercase flex items-center justify-between">
          {d.targets}
          <span className="px-2 py-0.5 bg-cyan-950 rounded text-cyan-600">{targets.length}</span>
        </h2>
        <div className="relative mb-2">
           <input 
             type="text" 
             placeholder={d.search}
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full bg-slate-950 border border-slate-800 rounded px-8 py-1.5 text-xs text-cyan-100 focus:border-cyan-500 outline-none placeholder-slate-600"
           />
           <Search size={12} className="absolute left-2.5 top-2 text-slate-500" />
        </div>
      </div>
      
      {/* Target List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
        {filteredTargets.map(target => (
          <button
            key={target.id}
            onClick={(e) => { e.stopPropagation(); onSelect(target.id); }}
            className={`w-full flex items-center justify-between p-3 rounded border transition-all duration-200 group relative overflow-hidden
              ${selectedId === target.id 
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-100' 
                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900 hover:text-cyan-200 hover:border-cyan-900/20'
              }`}
          >
            {selectedId === target.id && (
               <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_10px_cyan]"></div>
            )}
            <div className="flex items-center gap-3 pl-2">
              <span className={`${selectedId === target.id ? 'text-cyan-400' : 'text-slate-600 group-hover:text-cyan-500'}`}>
                {getIcon(target.type)}
              </span>
              <div className="flex flex-col items-start text-left">
                <span className="text-xs font-bold uppercase tracking-wider truncate w-32">{target.name}</span>
                <span className="text-[9px] opacity-60">{typeLabels[target.type]}</span>
              </div>
            </div>
            {target.riskLevel === 'CRITICAL' && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Live Telemetry Panel (Fixed at Bottom) */}
      <div className="bg-slate-900 border-t-2 border-cyan-600/50 p-4 text-[10px]">
         <div className="flex items-center gap-2 text-cyan-400 mb-3 font-bold uppercase tracking-widest border-b border-cyan-900/30 pb-1">
            <Activity size={12} /> {d.telemetry}
         </div>
         
         {telemetry && orbitalDetails ? (
           <div className="space-y-2">
              {/* Orbital Mechanics */}
              <div className="grid grid-cols-3 gap-1 mb-2 text-center">
                 <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <div className="text-slate-500 text-[8px] mb-0.5">{d.apogee}</div>
                    <div className="text-cyan-200 font-bold">{orbitalDetails.apogee.toFixed(0)} km</div>
                 </div>
                 <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <div className="text-slate-500 text-[8px] mb-0.5">{d.perigee}</div>
                    <div className="text-cyan-200 font-bold">{orbitalDetails.perigee.toFixed(0)} km</div>
                 </div>
                 <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <div className="text-slate-500 text-[8px] mb-0.5">{d.period}</div>
                    <div className="text-cyan-200 font-bold">{orbitalDetails.period.toFixed(1)} m</div>
                 </div>
              </div>

              {/* Realtime Data */}
              <div className="grid grid-cols-2 gap-2">
                 <div className="bg-slate-950 p-2 rounded border border-slate-800 relative overflow-hidden">
                    <div className="text-slate-500 mb-0.5 flex items-center gap-1"><ArrowUpRight size={8}/> {d.latitude}</div>
                    <div className="text-cyan-100 font-bold text-xs">{telemetry.lat.toFixed(4)}°</div>
                 </div>
                 <div className="bg-slate-950 p-2 rounded border border-slate-800 relative overflow-hidden">
                    <div className="text-slate-500 mb-0.5 flex items-center gap-1"><ArrowDownRight size={8}/> {d.longitude}</div>
                    <div className="text-cyan-100 font-bold text-xs">{telemetry.lon.toFixed(4)}°</div>
                 </div>
                 <div className="bg-slate-950 p-2 rounded border border-slate-800 relative overflow-hidden">
                    <div className="text-slate-500 mb-0.5">{d.altitude}</div>
                    <div className="text-purple-300 font-bold text-xs">{telemetry.alt.toFixed(1)} km</div>
                    <div className="absolute bottom-0 right-0 h-1 bg-purple-500/50 w-full"></div>
                 </div>
                 <div className="bg-slate-950 p-2 rounded border border-slate-800 relative overflow-hidden">
                    <div className="text-slate-500 mb-0.5">{d.velocity}</div>
                    <div className="text-green-300 font-bold text-xs">{telemetry.velocity.toFixed(3)} km/s</div>
                    <div className="absolute bottom-0 right-0 h-1 bg-green-500/50 w-full"></div>
                 </div>
              </div>
              
              <div className={`p-2 rounded border flex items-center justify-between transition-colors mt-2
                 ${visibleStation ? 'bg-green-950/30 border-green-900/50' : 'bg-slate-950 border-slate-800'}`}>
                 <div className="flex items-center gap-2">
                    {visibleStation ? <Signal size={12} className="text-green-500 animate-pulse" /> : <Signal size={12} className="text-slate-700" />}
                    <div className="flex flex-col">
                       <span className="text-slate-500 font-bold text-[9px]">{d.groundLink}</span>
                       <span className={`${visibleStation ? 'text-green-400' : 'text-slate-600'} font-bold`}>
                          {visibleStation ? visibleStation : d.noLink}
                       </span>
                    </div>
                 </div>
              </div>
           </div>
         ) : (
           <div className="text-center py-6 text-slate-600 italic border border-dashed border-slate-800 rounded">
              {d.selectTarget}
           </div>
         )}
      </div>
      
      <div className="p-2 bg-black text-[8px] text-slate-700 text-center uppercase tracking-widest">
        {t.footer}
      </div>
    </div>
  );
};

export default Sidebar;
