
import React, { useEffect, useState } from 'react';
import { SpaceTarget, Language } from '../types';
import { TRANSLATIONS, GROUND_STATIONS } from '../constants';
import { PhysicsEngine } from '../utils';
import { generateTargetAnalysis } from '../services/geminiService';
import { Cpu, Activity, ShieldAlert, CalendarClock, Radio } from 'lucide-react';

interface IntelligencePanelProps {
  target: SpaceTarget | null;
  language: Language;
}

const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ target, language }) => {
  const t = TRANSLATIONS[language];
  const d = t.dashboard;
  
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [nextPass, setNextPass] = useState<{station: string, time: string} | null>(null);

  // 1. AI Analysis
  useEffect(() => {
    if (target) {
      setLoading(true);
      setAnalysis("");
      generateTargetAnalysis(target, language)
        .then(text => setAnalysis(text))
        .finally(() => setLoading(false));
    } else {
      setAnalysis("");
    }
  }, [target, language]);

  // 2. Pass Prediction Calculation
  useEffect(() => {
     if (!target) {
         setNextPass(null);
         return;
     }

     // Calculate the next pass for the first available ground station
     // Scan next 12 hours in 1 minute intervals (Simplified)
     const now = Date.now();
     let found = false;
     
     // Check DSN-1 for demo
     const station = GROUND_STATIONS[0]; 
     
     // Crude brute force for demo responsiveness
     // Ideally this runs in a worker
     for(let m=0; m<720; m+=5) { // check every 5 mins
         const future = now + m * 60000;
         const el = PhysicsEngine.getLookAngle(station, target, future);
         if (el > 5) {
             setNextPass({
                 station: station.name,
                 time: new Date(future).toLocaleTimeString()
             });
             found = true;
             break;
         }
     }
     if (!found) setNextPass(null);

  }, [target]);

  if (!target) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 border-t border-cyan-900/30 bg-slate-900/30">
        <Cpu size={32} className="mb-4 opacity-20" />
        <p className="text-xs font-mono text-center">{d.selectTarget}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900/30 backdrop-blur-md border-t border-cyan-500/30 relative overflow-hidden">
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(6,182,212,0.05)_50%)] bg-[length:100%_4px] pointer-events-none z-0"></div>

      {/* Header */}
      <div className="p-3 bg-cyan-950/30 flex items-center justify-between border-b border-cyan-900/30 z-10">
        <div className="flex items-center gap-2 text-cyan-400">
          <Activity size={16} />
          <span className="text-xs font-bold tracking-widest uppercase">{d.analysis}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded border ${
            target.riskLevel === 'CRITICAL' ? 'border-red-500 text-red-500 bg-red-950/50' :
            target.riskLevel === 'HIGH' ? 'border-orange-500 text-orange-500 bg-orange-950/50' :
            'border-cyan-500 text-cyan-500 bg-cyan-950/50'
          }`}>
            {d.risk}: {target.riskLevel}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto z-10">
        {/* Pass Prediction Card */}
        <div className="p-4 border-b border-cyan-900/20">
            <div className="flex items-center gap-2 text-purple-300 mb-2 text-[10px] font-bold uppercase">
                <CalendarClock size={12} /> {d.passPred}
            </div>
            <div className="bg-slate-950/50 p-3 rounded border border-purple-900/30 flex justify-between items-center">
                <div>
                    <div className="text-[9px] text-slate-500 uppercase mb-1">{d.nextPass}</div>
                    <div className="text-purple-100 font-mono text-sm font-bold">
                        {nextPass ? nextPass.time : 'NO PASS < 12H'}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[9px] text-slate-500 uppercase mb-1">STATION</div>
                    <div className="text-slate-300 font-mono text-[10px]">
                        {nextPass ? nextPass.station : '--'}
                    </div>
                </div>
            </div>
        </div>

        {/* AI Analysis */}
        <div className="p-4">
             <div className="text-[10px] text-cyan-600 font-bold uppercase mb-2 flex items-center gap-2">
                 <Cpu size={12} /> INTELLIGENCE REPORT
             </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-2">
                 <div className="w-full h-1 bg-slate-800 rounded overflow-hidden">
                   <div className="h-full bg-cyan-500 animate-progress-indeterminate"></div>
                 </div>
                 <span className="text-cyan-600 animate-pulse text-[10px] font-mono">{t.genAiPrompt}</span>
              </div>
            ) : (
              <div className="prose prose-invert prose-p:text-slate-300 prose-strong:text-cyan-300">
                <div className="font-mono text-[11px] leading-relaxed text-slate-300">
                  {analysis}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Decorator */}
      <div className="absolute bottom-0 right-0 p-2 opacity-10 pointer-events-none">
        <ShieldAlert size={64} className="text-cyan-900" />
      </div>
    </div>
  );
};

export default IntelligencePanel;
