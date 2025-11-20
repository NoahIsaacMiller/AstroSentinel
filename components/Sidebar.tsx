
import React from 'react';
import { SpaceTarget, Language } from '../types';
import { TRANSLATIONS, TYPE_LABELS } from '../constants';
import { Disc, AlertTriangle, Radio, Satellite, Hexagon } from 'lucide-react';

interface SidebarProps {
  targets: SpaceTarget[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  language: Language;
}

const Sidebar: React.FC<SidebarProps> = ({ targets, selectedId, onSelect, language }) => {
  const t = TRANSLATIONS[language];
  const typeLabels = TYPE_LABELS[language];

  const getIcon = (type: string) => {
    switch(type) {
      case 'SATELLITE': return <Satellite size={14} />;
      case 'DEBRIS': return <AlertTriangle size={14} />;
      case 'STATION': return <Radio size={14} />;
      case 'ASTEROID': return <Hexagon size={14} />;
      default: return <Disc size={14} />;
    }
  };

  return (
    <div className="w-72 h-full border-r border-cyan-900/30 bg-slate-950/90 backdrop-blur-md flex flex-col z-20 shadow-2xl">
      <div className="p-4 border-b border-cyan-900/30 bg-slate-900/50">
        <h2 className="text-cyan-400 font-bold tracking-widest text-xs mb-2 uppercase flex items-center justify-between">
          {t.dashboard.targets}
          <span className="px-2 py-0.5 bg-cyan-950 rounded text-cyan-600">{targets.length}</span>
        </h2>
        <div className="h-0.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500 w-full animate-progress-indeterminate"></div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
        {targets.map(target => (
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
              <div className="flex flex-col items-start">
                <span className="text-xs font-mono font-bold uppercase tracking-wider">{target.name}</span>
                <span className="text-[10px] opacity-60 font-mono">{typeLabels[target.type]}</span>
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
      
      <div className="p-3 border-t border-cyan-900/30 text-[9px] text-slate-600 font-mono text-center uppercase tracking-widest">
        {t.footer}
      </div>
    </div>
  );
};

export default Sidebar;
