
import React from 'react';
import { Mic, ShieldCheck, Settings, LayoutDashboard, X, Library, TrendingUp, Radio, Briefcase } from 'lucide-react';

interface SidebarProps {
  currentView: 'COACH' | 'QA' | 'LIBRARY' | 'TRENDS' | 'LIVE' | 'DEAL';
  onNavigate: (view: 'COACH' | 'QA' | 'LIBRARY' | 'TRENDS' | 'LIVE' | 'DEAL') => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <div className={`
        fixed left-0 top-0 bottom-0 bg-slate-900 z-50 transition-transform duration-300 w-64
        flex flex-col justify-between
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 rounded-lg">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 font-bold text-white text-lg">SalesIQ</span>
            </div>
            {/* Close button for mobile */}
            <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="mt-8 px-2 space-y-2">
            <div className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Workspace</div>
            
            <button
              onClick={() => { onNavigate('COACH'); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentView === 'COACH' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Mic className="w-5 h-5" />
              <span className="font-medium">Call Coach</span>
            </button>

            <button
              onClick={() => { onNavigate('DEAL'); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentView === 'DEAL' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span className="font-medium">Deal Intelligence</span>
              <span className="ml-auto text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-bold">NEW</span>
            </button>

            <button
              onClick={() => { onNavigate('LIVE'); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentView === 'LIVE' 
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Radio className="w-5 h-5" />
              <span className="font-medium">Live Assistant</span>
            </button>

            <button
              onClick={() => { onNavigate('QA'); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentView === 'QA' 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="font-medium">Compliance QA</span>
            </button>

            <div className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-2">History & Stats</div>

            <button
              onClick={() => { onNavigate('LIBRARY'); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentView === 'LIBRARY' 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Library className="w-5 h-5" />
              <span className="font-medium">My Library</span>
            </button>

            <button
              onClick={() => { onNavigate('TRENDS'); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                currentView === 'TRENDS' 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Performance Trends</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </div>
    </>
  );
};