
import React, { useState, useRef, useEffect } from 'react';
import { Language, SpaceTarget, TargetType } from '../types';
import { TRANSLATIONS, TYPE_LABELS } from '../constants';
import { PhysicsEngine } from '../utils';
import { Edit, Trash, Filter, Plus, Upload, FolderPlus, Folder } from 'lucide-react';

interface TargetManagerProps {
  language: Language;
  targets: SpaceTarget[];
  onAddTarget: (t: SpaceTarget) => void;
  onRemoveTarget: (id: string) => void;
}

const TargetManager: React.FC<TargetManagerProps> = ({ language, targets, onAddTarget, onRemoveTarget }) => {
  const t = TRANSLATIONS[language].targets;
  const typeLabels = TYPE_LABELS[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filter, setFilter] = useState<TargetType | 'ALL'>('ALL');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Groups State
  const [availableGroups, setAvailableGroups] = useState<string[]>(['LEO_STATIONS', 'CONSTELLATION', 'DEBRIS_FIELD', 'NEO']);
  const [newGroupName, setNewGroupName] = useState('');
  
  // Import State
  const [tleInput, setTleInput] = useState('');
  const [importName, setImportName] = useState('');
  const [importType, setImportType] = useState<TargetType>(TargetType.SATELLITE);
  const [importGroup, setImportGroup] = useState('');

  // Edit State
  const [editingTarget, setEditingTarget] = useState<SpaceTarget | null>(null);

  // Sync groups from targets on mount
  useEffect(() => {
      const groups = new Set(availableGroups);
      targets.forEach(t => { if(t.group) groups.add(t.group); });
      setAvailableGroups(Array.from(groups));
  }, [targets]);

  const filteredTargets = filter === 'ALL' ? targets : targets.filter(t => t.type === filter);

  const handleAddGroup = () => {
      if (newGroupName && !availableGroups.includes(newGroupName)) {
          setAvailableGroups([...availableGroups, newGroupName]);
          setNewGroupName('');
      }
  };

  const removeGroup = (g: string) => {
      setAvailableGroups(prev => prev.filter(x => x !== g));
  };

  const handleSingleImport = () => {
    const lines = tleInput.trim().split('\n');
    if (lines.length < 2) {
       alert("Invalid TLE: Need at least 2 lines.");
       return;
    }
    const l1 = lines[0].trim();
    const l2 = lines[1].trim();
    
    const orbit = PhysicsEngine.parseTLE(l1, l2);
    if (!orbit) {
       alert("Failed to parse TLE.");
       return;
    }
    
    orbit.color = importType === TargetType.STATION ? '#22d3ee' : 
                  importType === TargetType.DEBRIS ? '#ef4444' : '#34d399';

    const newTarget: SpaceTarget = {
      id: `TLE-${Math.floor(Math.random()*10000)}`,
      name: importName || lines[0].substring(2, 8) || 'UNKNOWN',
      type: importType,
      riskLevel: 'LOW',
      lastUpdate: '0.0s',
      group: importGroup || 'IMPORTED',
      orbit: orbit,
      tle1: l1,
      tle2: l2
    };

    onAddTarget(newTarget);
    setShowImportModal(false);
    setTleInput('');
    setImportName('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        const bulkData = PhysicsEngine.parseBulkTLE(text);
        
        if (bulkData.length === 0) {
            alert("No valid TLEs found in file.");
            return;
        }

        if (window.confirm(`Found ${bulkData.length} targets. Import all?`)) {
            bulkData.forEach(item => {
                const orbit = PhysicsEngine.parseTLE(item.l1, item.l2);
                if (orbit) {
                    orbit.color = '#34d399';
                    const t: SpaceTarget = {
                        id: `BULK-${Math.floor(Math.random()*100000)}`,
                        name: item.name,
                        type: TargetType.SATELLITE,
                        riskLevel: 'LOW',
                        lastUpdate: '0.0s',
                        group: 'BULK_IMPORT',
                        orbit: orbit,
                        tle1: item.l1,
                        tle2: item.l2
                    };
                    onAddTarget(t);
                }
            });
            alert(`Successfully imported ${bulkData.length} targets.`);
        }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openEdit = (target: SpaceTarget) => {
    setEditingTarget({...target}); // Clone
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (editingTarget) {
       onRemoveTarget(editingTarget.id);
       onAddTarget(editingTarget);
       setShowEditModal(false);
       setEditingTarget(null);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950 relative">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-end mb-8 border-b border-cyan-900/50 pb-4 gap-4">
        <div>
           <h2 className="text-2xl text-cyan-400 font-bold tracking-wider uppercase">
             {t.title}
           </h2>
           <p className="text-slate-500 text-xs font-mono mt-1">
             {filteredTargets.length} / {targets.length} OBJECTS IN DATABASE
           </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Group Manager Button */}
          <button 
            onClick={() => setShowGroupModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-purple-900/50 text-purple-300 hover:bg-purple-900/20 rounded text-xs transition-all"
          >
            <Folder size={14} /> {t.manage}
          </button>

          <div className="relative group z-10">
             <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 hover:border-cyan-500 hover:text-cyan-400 transition-colors">
               <Filter size={14} /> {filter === 'ALL' ? t.all : typeLabels[filter]}
             </button>
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
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-900 rounded text-xs transition-all"
          >
            <Upload size={14} /> {t.upload}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.tle" />

          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            <Plus size={14} /> {t.addNew}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-cyan-900/30 bg-slate-900/20 min-h-[400px]">
        <table className="w-full text-left text-sm text-slate-400 font-mono">
          <thead className="bg-slate-900 text-xs uppercase text-cyan-500 tracking-wider">
            <tr>
              <th className="px-6 py-3 border-b border-cyan-900/30">{t.tableID}</th>
              <th className="px-6 py-3 border-b border-cyan-900/30">{t.tableName}</th>
              <th className="px-6 py-3 border-b border-cyan-900/30">{t.tableType}</th>
              <th className="px-6 py-3 border-b border-cyan-900/30">{t.tableGroup}</th>
              <th className="px-6 py-3 border-b border-cyan-900/30 text-xs">INC / ECC</th>
              <th className="px-6 py-3 text-right border-b border-cyan-900/30">{t.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-900/10">
            {filteredTargets.map((target) => (
              <tr key={target.id} className="hover:bg-cyan-900/10 transition-colors group">
                <td className="px-6 py-4 font-bold text-slate-500 text-xs">{target.id}</td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ color: target.orbit.color, backgroundColor: target.orbit.color }}></div>
                     <span className="text-slate-200 font-bold">{target.name}</span>
                   </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] border 
                    ${target.type === 'DEBRIS' ? 'border-red-900 text-red-400 bg-red-950/30' : 'border-slate-700 bg-slate-900 text-cyan-100'}`}>
                    {typeLabels[target.type]}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{target.group || '-'}</td>
                <td className="px-6 py-4 text-xs text-slate-500">
                   {target.orbit.inclination.toFixed(1)}° / {target.orbit.eccentricity.toFixed(3)}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(target)} className="p-1.5 hover:text-cyan-400 hover:bg-cyan-900/20 rounded transition-colors"><Edit size={14} /></button>
                  <button onClick={() => onRemoveTarget(target.id)} className="p-1.5 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"><Trash size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* GROUP MANAGEMENT MODAL */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
           <div className="bg-slate-900 border border-purple-500/50 rounded-lg p-6 w-[400px] shadow-[0_0_50px_rgba(147,51,234,0.2)]">
              <h3 className="text-purple-400 font-bold uppercase tracking-widest mb-6 text-center border-b border-purple-900/30 pb-2">{t.groupTitle}</h3>
              
              <div className="flex gap-2 mb-4">
                  <input 
                     type="text" 
                     placeholder={t.newGroupPlaceholder}
                     className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white uppercase"
                     value={newGroupName}
                     onChange={e => setNewGroupName(e.target.value.toUpperCase())}
                  />
                  <button onClick={handleAddGroup} className="p-2 bg-purple-700 text-white rounded hover:bg-purple-600"><FolderPlus size={16}/></button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
                  {availableGroups.map(g => (
                      <div key={g} className="flex justify-between items-center p-2 bg-slate-950 border border-slate-800 rounded">
                          <span className="text-xs text-slate-300 font-mono">{g}</span>
                          <button onClick={() => removeGroup(g)} className="text-slate-600 hover:text-red-400"><Trash size={12}/></button>
                      </div>
                  ))}
              </div>

              <button onClick={() => setShowGroupModal(false)} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold uppercase">{t.close}</button>
           </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
           <div className="bg-slate-900 border border-cyan-500/50 rounded-lg p-6 w-[500px] shadow-[0_0_50px_rgba(6,182,212,0.2)]">
              <h3 className="text-cyan-400 font-bold uppercase tracking-widest mb-6 text-center border-b border-cyan-900/30 pb-2">{t.modalTitle}</h3>
              
              <div className="space-y-4">
                 <input 
                    type="text" 
                    placeholder="Target Name (Optional)"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 text-sm focus:border-cyan-500 outline-none font-mono"
                    value={importName}
                    onChange={e => setImportName(e.target.value)}
                 />
                 <div className="flex gap-2">
                     <select 
                        className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 text-sm focus:border-cyan-500 outline-none font-mono"
                        value={importType}
                        onChange={e => setImportType(e.target.value as TargetType)}
                     >
                        {Object.values(TargetType).map(type => (
                           <option key={type} value={type}>{typeLabels[type]}</option>
                        ))}
                     </select>
                     <select 
                        className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 text-sm focus:border-cyan-500 outline-none font-mono"
                        value={importGroup}
                        onChange={e => setImportGroup(e.target.value)}
                     >
                        <option value="">{t.selectGroup}</option>
                        {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                     </select>
                 </div>
                 
                 <textarea
                    className="w-full h-32 bg-slate-950 border border-slate-700 rounded p-2 text-slate-200 text-xs font-mono focus:border-cyan-500 outline-none"
                    placeholder={t.tlePlaceholder}
                    value={tleInput}
                    onChange={e => setTleInput(e.target.value)}
                 />
              </div>

              <div className="flex gap-3 mt-6">
                 <button onClick={() => setShowImportModal(false)} className="flex-1 py-2 border border-slate-700 rounded text-slate-400 hover:bg-slate-800 text-xs font-bold uppercase">{t.cancel}</button>
                 <button onClick={handleSingleImport} className="flex-1 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-xs font-bold uppercase shadow-[0_0_10px_cyan]">{t.confirm}</button>
              </div>
           </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editingTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
           <div className="bg-slate-900 border border-cyan-500/50 rounded-lg p-6 w-[400px] shadow-[0_0_50px_rgba(6,182,212,0.2)]">
              <h3 className="text-cyan-400 font-bold uppercase tracking-widest mb-6 text-center border-b border-cyan-900/30 pb-2">{t.editTitle}</h3>
              
              <div className="space-y-3 font-mono text-xs">
                 <div>
                    <label className="block text-slate-500 mb-1">NAME</label>
                    <input type="text" value={editingTarget.name} onChange={e => setEditingTarget({...editingTarget, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                 </div>
                 <div>
                    <label className="block text-slate-500 mb-1">GROUP</label>
                    <select value={editingTarget.group || ''} onChange={e => setEditingTarget({...editingTarget, group: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                        <option value="">{t.noGroup}</option>
                        {availableGroups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-slate-500 mb-1">RISK LEVEL</label>
                    <select value={editingTarget.riskLevel} onChange={e => setEditingTarget({...editingTarget, riskLevel: e.target.value as any})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                       <option value="LOW">LOW</option>
                       <option value="MEDIUM">MEDIUM</option>
                       <option value="HIGH">HIGH</option>
                       <option value="CRITICAL">CRITICAL</option>
                    </select>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 mt-2">
                     <div>
                        <label className="block text-slate-500 mb-1">INCLINATION</label>
                        <input type="number" step="0.01" value={editingTarget.orbit.inclination} onChange={e => setEditingTarget({...editingTarget, orbit: {...editingTarget.orbit, inclination: parseFloat(e.target.value)}})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                     </div>
                     <div>
                        <label className="block text-slate-500 mb-1">ECCENTRICITY</label>
                        <input type="number" step="0.0001" value={editingTarget.orbit.eccentricity} onChange={e => setEditingTarget({...editingTarget, orbit: {...editingTarget.orbit, eccentricity: parseFloat(e.target.value)}})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                     </div>
                     <div>
                        <label className="block text-slate-500 mb-1">RAAN</label>
                        <input type="number" step="0.1" value={editingTarget.orbit.raan} onChange={e => setEditingTarget({...editingTarget, orbit: {...editingTarget.orbit, raan: parseFloat(e.target.value)}})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                     </div>
                     <div>
                        <label className="block text-slate-500 mb-1">ARG PERIGEE</label>
                        <input type="number" step="0.1" value={editingTarget.orbit.argPe} onChange={e => setEditingTarget({...editingTarget, orbit: {...editingTarget.orbit, argPe: parseFloat(e.target.value)}})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                     </div>
                 </div>
              </div>

              <div className="flex gap-3 mt-6">
                 <button onClick={() => setShowEditModal(false)} className="flex-1 py-2 border border-slate-700 rounded text-slate-400 hover:bg-slate-800 text-xs font-bold uppercase">{t.cancel}</button>
                 <button onClick={handleSaveEdit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded text-xs font-bold uppercase shadow-[0_0_10px_lime]">{t.save}</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TargetManager;
