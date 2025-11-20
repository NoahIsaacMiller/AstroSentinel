
import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Globe, Eye, EyeOff, Radio } from 'lucide-react';

interface HeaderProps {
  language: Language;
  setLanguage: (l: Language) => void;
  showOrbits: boolean;
  toggleOrbits: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  language, setLanguage, showOrbits, toggleOrbits
}) => {
  const t = TRANSLATIONS[language];
  const d = t.dashboard; 

  return (
    <header className="h-14 border-b border-cyan-900/50 bg-slate-950/90 flex items-center justify-between px-4 relative z-40 shadow-lg shadow-cyan-900/10 select-none">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded bg-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          <Globe className="text-slate-950 animate-spin-slow" size={20} />
        </div>
        <div>
          <h1 className="text-cyan-50 text-sm font-bold tracking-[0.2em] uppercase leading-none">
            {t.appTitle}
          </h1>
          <span className="text-[10px] text-cyan-600 font-mono">{t.subtitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Real-time Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-red-900/50 bg-red-950/30 text-red-400 text-xs font-mono shadow-[0_0_5px_rgba(220,38,38,0.2)]">
          <Radio size={12} className="animate-pulse" />
          <span className="tracking-widest font-bold">{d.resume.toUpperCase()}</span>
        </div>

        <button 
          onClick={toggleOrbits}
          className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all text-xs font-mono cursor-pointer hover:bg-cyan-900/20
            ${showOrbits 
              ? 'border-cyan-500 bg-cyan-950/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
              : 'border-slate-700 bg-slate-900 text-slate-500 hover:border-cyan-800'}`}
        >
          {showOrbits ? <Eye size={12} /> : <EyeOff size={12} />}
          {d.orbitToggle}
        </button>

        {/* Language Switcher */}
        <div className="flex bg-slate-900 rounded border border-cyan-900/50 overflow-hidden ml-4">
          {[Language.EN, Language.CN, Language.JP].map(lang => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1 text-[10px] font-bold transition-colors
                ${language === lang 
                  ? 'bg-cyan-700 text-white' 
                  : 'text-slate-500 hover:bg-slate-800 hover:text-cyan-400'}`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
