
import React, { useState } from 'react';
import { Language, SpaceTarget, TargetType } from '../types';
import { TRANSLATIONS, TYPE_LABELS } from '../constants';
import { Edit, Trash, Filter, Plus, X, Check } from 'lucide-react';

interface TargetManagerProps {
  language: Language;
  targets: SpaceTarget[];
  onAddTarget: (t: SpaceTarget) => void;
  onRemoveTarget: (id: string) => void;
}

const TargetManager: React.FC<TargetManagerProps> = ({ language, targets, onAddTarget, onRemoveTarget }) => {
  const t = TRANSLATIONS[language].targets;
  const typeLabels = TYPE_LABELS[language];

  const [filter, setFilter] = useState<TargetType | 'ALL'>('ALL');
  const [showModal, setShowModal] = useState(false);

  // Form State for "Add New"
  const [newTargetName, setNewTargetName] = useState('');
  const [newTargetType, setNewTargetType] = useState<TargetType>(TargetType.SATELLITE);

  const filteredTargets = filter === 'ALL' ? targets : targets.filter(t => t.type === filter);

  const handleAdd = () => {
    const newTarget: SpaceTarget = {
       id: `T-${Math.floor(Math.random() * 10000)}`,
       name: newTargetName || `UNNAMED-${Math.floor(Math.random()*100)}`,
       type: newTargetType,
       riskLevel: 'LOW',
       lastUpdate: '0.0s',
       group: 'NEW_ENTRY',
       orbit: {
          semiMajorAxis: 70 + Math.random() * 50,
          eccentricity: Math.random() * 0.1,
          inclination: Math.random() * 90,
          raan: Math.random() * 360,
          argPe: Math.random() * 360,
          meanAnomaly: 0,
          period: 0.01,
          color: '#ffffff'
       }
    };
    onAddTarget(newTarget);
    setShowModal(false);
    setNewTargetName('');
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950 relative">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-cyan-900/50 pb-4 gap-4">
        <div>
           <h2 className="text-2xl text-cyan-400 font-bold tracking-wider uppercase">
             {t.title}
           </h2>
           <p className="text-slate-500 text-xs font-mono mt-1">
             {filteredTargets.length} / {targets.length} OBJECTS REGISTERED
           </p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative group">
             <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 hover:border-cyan-500 hover:text-cyan-400 transition-colors">
               <Filter size={14} /> {filter === 'ALL' ? t.all : typeLabels[filter]}
             </button>
             {/* Dropdown */}
             <div className="absolute right-0 top-full mt-2 w-40 bg-slate-900 border border-cyan-900/50 rounded shadow-xl hidden group-hover:block z-50">
                <button onClick={() => setFilter('ALL')} className="w-full text-left px-4 py-2 text-xs hover:bg-cyan-900/30 text-slate-300">{t.all}</button>
                {Object.values(TargetType).map(type => (
                  <button key={type} onClick={() => setFilter(type)} className="w-full text-left px-4 py-2 text-xs hover:bg-cyan-900/30 text-slate-300">
                    {typeLabels[type]}
                  </button>
                ))}
             </div>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded text-xs transition-all active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            <Plus size={14} /> {t.addNew}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-cyan-900/30 bg-slate-900/20">
        <table className="w-full text-left text-sm text-slate-400 font-mono">
          <thead className="bg-slate-900 text-xs uppercase text-cyan-500 tracking-wider">
            <tr>
              <th className="px-6 py-3 border-b border-cyan-900/30">{t.tableID}</th>
              <th className="px-6 py-3 border-b border-cyan-900/30">{t.tableName}</th>
              <th className="px-6 py-3 border-b border-cyan-900/30">{t.tableType}</th>
              <th className="px-6 py-3 border-b border-cyan-900/30">{t.tableGroup}</th>
              <th className="px-6 py-3 text-right border-b border-cyan-900/30">{t.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-900/10">
            {filteredTargets.map((target) => (
              <tr key={target.id} className="hover:bg-cyan-900/10 transition-colors group">
                <td className="px-6 py-4 font-bold text-slate-200">{target.id}</td>
                <td className="px-6 py-4 flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ color: target.orbit.color, backgroundColor: target.orbit.color }}></div>
                   {target.name}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] border 
                    ${target.type === 'DEBRIS' ? 'border-red-900 text-red-400 bg-red-950/30' : 'border-slate-700 bg-slate-900 text-cyan-100'}`}>
                    {typeLabels[target.type]}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{target.group || 'N/A'}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 hover:text-cyan-400 hover:bg-cyan-900/20 rounded transition-colors"><Edit size={14} /></button>
                  <button 
                    onClick={() => onRemoveTarget(target.id)}
                    className="p-1.5 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors" 
                    title={t.delete}
                  >
                    <Trash size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
           <div className="bg-slate-900 border border-cyan-500/50 rounded-lg p-6 w-96 shadow-[0_0_50px_rgba(6,182,212,0.2)]">
              <h3 className="text-cyan-400 font-bold uppercase tracking-widest mb-6 text-center border-b border-cyan-900/30 pb-2">{t.modalTitle}</h3>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-xs text-slate-500 mb-1 uppercase font-mono">{t.tableName}</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 text-sm focus:border-cyan-500 outline-none font-mono"
                      value={newTargetName}
                      onChange={(e) => setNewTargetName(e.target.value)}
                      placeholder="SAT-XXXX"
                    />
                 </div>
                 <div>
                    <label className="block text-xs text-slate-500 mb-1 uppercase font-mono">{t.tableType}</label>
                    <select 
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 text-sm focus:border-cyan-500 outline-none font-mono"
                      value={newTargetType}
                      onChange={(e) => setNewTargetType(e.target.value as TargetType)}
                    >
                       {Object.values(TargetType).map(type => (
                         <option key={type} value={type}>{typeLabels[type]}</option>
                       ))}
                    </select>
                 </div>
              </div>

              <div className="flex gap-3 mt-8">
                 <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-slate-700 rounded text-slate-400 hover:bg-slate-800 text-xs font-bold uppercase">{t.cancel}</button>
                 <button onClick={handleAdd} className="flex-1 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-xs font-bold uppercase shadow-[0_0_10px_cyan]">{t.confirm}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TargetManager;
