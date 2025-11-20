import React, { useEffect, useState } from 'react';
import { SpaceTarget, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { generateTargetAnalysis } from '../services/geminiService';
import { Cpu, Activity, ShieldAlert } from 'lucide-react';

interface IntelligencePanelProps {
  target: SpaceTarget | null;
  language: Language;
}

const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ target, language }) => {
  const t = TRANSLATIONS[language];
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

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

  if (!target) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 border-t border-cyan-900/30 bg-slate-900/30">
        <Cpu size={32} className="mb-4 opacity-20" />
        <p className="text-xs font-mono text-center">{t.dashboard.selectTarget}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900/30 backdrop-blur-md border-t border-cyan-500/30 relative overflow-hidden">
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(6,182,212,0.05)_50%)] bg-[length:100%_4px] pointer-events-none z-0"></div>

      <div className="p-3 bg-cyan-950/30 flex items-center justify-between border-b border-cyan-900/30 z-10">
        <div className="flex items-center gap-2 text-cyan-400">
          <Activity size={16} />
          <span className="text-xs font-bold tracking-widest uppercase">{t.dashboard.analysis}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded border ${
            target.riskLevel === 'CRITICAL' ? 'border-red-500 text-red-500 bg-red-950/50' :
            target.riskLevel === 'HIGH' ? 'border-orange-500 text-orange-500 bg-orange-950/50' :
            'border-cyan-500 text-cyan-500 bg-cyan-950/50'
          }`}>
            {t.dashboard.risk}: {target.riskLevel}
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2">
             <div className="w-full h-1 bg-slate-800 rounded overflow-hidden">
               <div className="h-full bg-cyan-500 animate-progress-indeterminate"></div>
             </div>
             <span className="text-cyan-600 animate-pulse">{t.genAiPrompt}</span>
          </div>
        ) : (
          <div className="prose prose-invert prose-p:text-slate-300 prose-strong:text-cyan-300">
            <div className="typewriter-effect text-slate-200">
              {analysis}
            </div>
          </div>
        )}
      </div>

      {/* Decorator */}
      <div className="absolute bottom-0 right-0 p-2 opacity-30">
        <ShieldAlert size={48} className="text-cyan-900" />
      </div>
    </div>
  );
};

export default IntelligencePanel;