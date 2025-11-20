import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';
import OrbitVisualizer from './components/OrbitVisualizer';
import IntelligencePanel from './components/IntelligencePanel';
import SystemMonitor from './components/SystemMonitor';
import TargetManager from './components/TargetManager';
import AlertsView from './components/AlertsView';
import ControlCenter from './components/ControlCenter';
import { Language, SpaceTarget, View, TimeMode } from './types';
import { INITIAL_TARGETS, TRANSLATIONS } from './constants';

const App: React.FC = () => {
  // --- State ---
  const [language, setLanguage] = useState<Language>(Language.CN);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  
  const [targets, setTargets] = useState<SpaceTarget[]>(INITIAL_TARGETS);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [showOrbits, setShowOrbits] = useState<boolean>(true);

  const [timeMode, setTimeMode] = useState<TimeMode>(TimeMode.REALTIME);
  const [timeSpeed, setTimeSpeed] = useState<number>(100); 
  const [simulationTime, setSimulationTime] = useState<number>(Date.now());

  const t = TRANSLATIONS[language];
  const d = t.dashboard;

  // --- High Performance Time Loop ---
  useEffect(() => {
    let lastFrame = performance.now();
    let animationFrameId: number;

    const loop = (now: number) => {
      const delta = now - lastFrame;
      lastFrame = now;

      if (timeMode === TimeMode.REALTIME) {
        setSimulationTime(Date.now());
      } else {
        // Advance time by delta * speed
        // delta is in ms. simulationTime is in ms.
        // If speed is 1000, we add 1000ms for every 1ms real time.
        setSimulationTime(prev => prev + (delta * timeSpeed));
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [timeMode, timeSpeed]);

  // --- Handlers ---
  const handleAddTarget = (newTarget: SpaceTarget) => {
     setTargets(prev => [...prev, newTarget]);
  };

  const handleRemoveTarget = (id: string) => {
     setTargets(prev => prev.filter(t => t.id !== id));
     if (selectedTargetId === id) setSelectedTargetId(null);
  };

  const selectedTarget = targets.find(t => t.id === selectedTargetId) || null;

  const renderMainContent = () => {
    switch (currentView) {
      case View.SYSTEM:
        return <SystemMonitor language={language} />;
      case View.TARGETS:
        return (
          <TargetManager 
            language={language} 
            targets={targets} 
            onAddTarget={handleAddTarget}
            onRemoveTarget={handleRemoveTarget}
          />
        );
      case View.ALERTS:
        return <AlertsView language={language} />;
      case View.CONTROL:
        return (
          <ControlCenter 
             language={language} 
             timeMode={timeMode}
             setTimeMode={setTimeMode}
             timeSpeed={timeSpeed}
             setTimeSpeed={setTimeSpeed}
          />
        );
      case View.DASHBOARD:
      default:
        return (
          <div className="flex h-full relative">
            <Sidebar 
              targets={targets} 
              selectedId={selectedTargetId} 
              onSelect={setSelectedTargetId}
              language={language}
            />

            <main className="flex-1 relative group bg-black overflow-hidden">
              <OrbitVisualizer 
                targets={targets}
                showOrbits={showOrbits}
                selectedTargetId={selectedTargetId}
                onSelectTarget={setSelectedTargetId}
                currentTime={simulationTime}
                language={language}
              />
              
              {/* Time HUD */}
              <div className="absolute bottom-4 right-4 pointer-events-none bg-black/50 backdrop-blur px-4 py-2 border-l-2 border-cyan-500 text-right">
                 <div className="text-cyan-400 font-mono text-xs font-bold uppercase">
                    {timeMode === TimeMode.REALTIME ? d.resume : d.simulation}
                 </div>
                 <div className="text-slate-200 font-mono text-xl">
                    {new Date(simulationTime).toLocaleTimeString()}
                 </div>
                 <div className="text-slate-500 font-mono text-[10px]">
                    {new Date(simulationTime).toLocaleDateString()} | {timeMode === TimeMode.SIMULATION ? `x${timeSpeed}` : 'LIVE'}
                 </div>
              </div>
            </main>

            <div className="w-80 border-l border-cyan-900/30 bg-slate-950/90 backdrop-blur-sm flex flex-col z-20 shadow-xl">
              <div className="h-1/2 border-b border-cyan-900/30 p-4 overflow-y-auto">
                  <h2 className="text-cyan-400 font-bold tracking-widest text-xs mb-4 uppercase border-b border-cyan-900/50 pb-2">
                    {d.telemetry}
                  </h2>
                  {selectedTarget ? (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between p-1 hover:bg-white/5"><span className="text-slate-500">ID:</span><span className="text-slate-300">{selectedTarget.id}</span></div>
                      <div className="flex justify-between p-1 hover:bg-white/5"><span className="text-slate-500">NAME:</span><span className="text-cyan-300 font-bold">{selectedTarget.name}</span></div>
                      <div className="flex justify-between p-1 hover:bg-white/5"><span className="text-slate-500">INC:</span><span className="text-slate-300">{selectedTarget.orbit.inclination.toFixed(4)}°</span></div>
                      <div className="flex justify-between p-1 hover:bg-white/5"><span className="text-slate-500">ECC:</span><span className="text-slate-300">{selectedTarget.orbit.eccentricity.toFixed(6)}</span></div>
                      <div className="flex justify-between p-1 hover:bg-white/5"><span className="text-slate-500">PERIOD:</span><span className="text-slate-300">{(86400 / selectedTarget.orbit.meanMotion / 60).toFixed(1)} min</span></div>
                      <div className="mt-4 p-2 border border-cyan-900/30 bg-cyan-950/20 rounded text-[10px] text-cyan-400/80">
                        {d.signal}<br/>{d.source}: DSN-4
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-600 text-xs italic text-center mt-10 opacity-50">{d.selectTarget}</div>
                  )}
              </div>
              <div className="h-1/2">
                <IntelligencePanel target={selectedTarget} language={language} />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-cyan-500/30">
      <Header 
        language={language}
        setLanguage={setLanguage}
        showOrbits={showOrbits}
        toggleOrbits={() => setShowOrbits(!showOrbits)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <Navigation currentView={currentView} setView={setCurrentView} language={language} />
        <div className="flex-1 overflow-hidden relative">
          {renderMainContent()}
        </div>
      </div>

      <style>{`
        @keyframes progress-indeterminate {
           0% { width: 0%; margin-left: 0%; }
           50% { width: 70%; margin-left: 30%; }
           100% { width: 0%; margin-left: 100%; }
        }
        .animate-progress-indeterminate {
           animation: progress-indeterminate 1.5s infinite ease-in-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
      `}</style>
    </div>
  );
};

export default App;