import React from 'react';
import { View, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { LayoutDashboard, Activity, Database, AlertCircle, Settings } from 'lucide-react';

interface NavigationProps {
  currentView: View;
  setView: (v: View) => void;
  language: Language;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, language }) => {
  const t = TRANSLATIONS[language].nav;

  const navItems = [
    { id: View.DASHBOARD, label: t.dashboard, icon: <LayoutDashboard size={20} /> },
    { id: View.SYSTEM, label: t.system, icon: <Activity size={20} /> },
    { id: View.TARGETS, label: t.targets, icon: <Database size={20} /> },
    { id: View.ALERTS, label: t.alerts, icon: <AlertCircle size={20} /> },
    { id: View.CONTROL, label: t.control, icon: <Settings size={20} /> },
  ];

  return (
    <nav className="w-20 bg-slate-950 border-r border-cyan-900/30 flex flex-col items-center py-6 z-30">
      <div className="mb-8 w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse">
        <div className="w-4 h-4 bg-slate-950 rounded-full"></div>
      </div>
      
      <div className="flex flex-col gap-6 w-full">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex flex-col items-center justify-center gap-1 py-3 transition-all duration-300 relative
              ${currentView === item.id 
                ? 'text-cyan-400' 
                : 'text-slate-600 hover:text-cyan-200'
              }`}
          >
            {currentView === item.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
            )}
            <div className={`p-2 rounded-lg ${currentView === item.id ? 'bg-cyan-950/50' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[9px] font-mono font-bold uppercase text-center leading-tight px-1">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
