
import React, { useState, useEffect, useRef } from 'react';
import { Language, TimeMode } from '../types';
import { TRANSLATIONS } from '../constants';
import { Shield, Radio, Power, Clock, FastForward, Terminal, Satellite, Wifi } from 'lucide-react';

interface ControlCenterProps {
  language: Language;
  timeMode: TimeMode;
  setTimeMode: (m: TimeMode) => void;
  timeSpeed: number;
  setTimeSpeed: (s: number) => void;
}

const ControlCenter: React.FC<ControlCenterProps> = ({ 
  language, timeMode, setTimeMode, timeSpeed, setTimeSpeed 
}) => {
  const t = TRANSLATIONS[language].control;
  const [defcon, setDefcon] = useState(5);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
     const time = new Date().toLocaleTimeString();
     setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 9)]);
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950">
      <h2 className="text-2xl text-slate-200 font-bold tracking-wider uppercase mb-8 border-b border-slate-800 pb-4 text-center">
        {t.title}
      </h2>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* 1. Time Dilation Engine */}
        <div className="bg-slate-900/50 border border-cyan-900/50 p-6 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.1)]">
           <div className="flex items-center gap-2 mb-6 text-cyan-400">
              <Clock size={20} />
              <h3 className="font-bold text-sm uppercase tracking-widest">{t.timeControl}</h3>
           </div>

           <div className="flex bg-slate-950 p-1 rounded border border-slate-800 mb-6">
              <button 
                 onClick={() => { setTimeMode(TimeMode.REALTIME); addLog("SYNC: REAL-TIME ESTABLISHED"); }}
                 className={`flex-1 py-2 text-xs font-bold uppercase transition-all rounded ${timeMode === TimeMode.REALTIME ? 'bg-cyan-700 text-white shadow-[0_0_10px_cyan]' : 'text-slate-500 hover:bg-slate-900'}`}
              >
                 {t.realtime}
              </button>
              <button 
                 onClick={() => { setTimeMode(TimeMode.SIMULATION); addLog("SYNC: SIMULATION ENGINE START"); }}
                 className={`flex-1 py-2 text-xs font-bold uppercase transition-all rounded ${timeMode === TimeMode.SIMULATION ? 'bg-purple-700 text-white shadow-[0_0_10px_purple]' : 'text-slate-500 hover:bg-slate-900'}`}
              >
                 {t.simMode}
              </button>
           </div>

           <div className={`transition-opacity duration-300 ${timeMode === TimeMode.SIMULATION ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <div className="flex justify-between text-xs text-slate-400 mb-2 font-mono">
                 <span>1x</span>
                 <span className="text-purple-400 font-bold">{timeSpeed}x {t.speed}</span>
                 <span>20000x</span>
              </div>
              <input 
                type="range" 
                min="1" max="20000" step="100" 
                value={timeSpeed}
                onChange={(e) => setTimeSpeed(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
           </div>
        </div>

        {/* 2. DEFCON & Status */}
        <div className="bg-slate-900/50 border border-red-900/30 p-6 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.05)]">
           <div className="flex items-center gap-2 mb-6 text-red-400">
              <Shield size={20} />
              <h3 className="font-bold text-sm uppercase tracking-widest">{t.defcon}</h3>
           </div>
           <div className="flex gap-2 justify-center">
             {[5, 4, 3, 2, 1].map(level => (
               <button
                 key={level}
                 onClick={() => { setDefcon(level); addLog(`ALERT LEVEL SET: DEFCON ${level}`); }}
                 className={`w-12 h-16 flex items-center justify-center font-black text-xl border-2 cursor-pointer transition-all rounded
                 ${defcon === level 
                    ? (level === 1 ? 'bg-red-600 border-red-500 text-black shadow-[0_0_20px_red]' : 
                       level === 5 ? 'bg-green-600 border-green-500 text-black shadow-[0_0_20px_lime]' :
                       'bg-yellow-400 border-yellow-200 text-black')
                    : 'border-slate-800 text-slate-700 bg-slate-950'
                 }
                 `}
               >
                 {level}
               </button>
             ))}
           </div>
        </div>

        {/* 3. Constellation Control (Simulated) */}
        <div className="bg-slate-900/50 border border-green-900/30 p-6 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.05)]">
           <div className="flex items-center gap-2 mb-6 text-green-400">
              <Satellite size={20} />
              <h3 className="font-bold text-sm uppercase tracking-widest">{t.constellation}</h3>
           </div>
           <div className="grid grid-cols-2 gap-4">
               <button 
                  onClick={() => addLog("MANEUVER: Station Keeping delta-V applied to LEO cluster.")}
                  className="p-4 bg-slate-950 border border-slate-800 rounded hover:border-green-500 hover:text-green-400 transition-colors text-xs font-bold uppercase flex flex-col items-center gap-2 text-center">
                   <Wifi size={24} /> {t.maneuver}
               </button>
               <button 
                   onClick={() => addLog("BROADCAST: Emergency signal transmitted to all active nodes.")}
                   className="p-4 bg-slate-950 border border-slate-800 rounded hover:border-red-500 hover:text-red-400 transition-colors text-xs font-bold uppercase flex flex-col items-center gap-2 text-center">
                   <Radio size={24} /> {t.broadcast}
               </button>
           </div>
        </div>

        {/* 4. Command Log Terminal */}
        <div className="bg-black border border-slate-800 p-4 rounded-xl font-mono text-xs h-52 overflow-hidden relative">
           <div className="absolute top-2 right-2 text-slate-600 flex items-center gap-2">
              <Terminal size={14} /> {t.logConsole}
           </div>
           <div className="space-y-1 text-slate-400 mt-4 h-full overflow-y-auto pb-4">
              {logs.map((log, i) => (
                 <div key={i} className="border-l-2 border-slate-700 pl-2">{log}</div>
              ))}
              <div className="animate-pulse text-cyan-500">_</div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ControlCenter;
