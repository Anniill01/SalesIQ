
import React, { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit, Search, FileText, Users, Calculator, Lightbulb, Activity, ShieldCheck } from 'lucide-react';

interface ThinkingOverlayProps {
  isVisible: boolean;
  mode: 'CALL' | 'DEAL';
}

export const ThinkingOverlay: React.FC<ThinkingOverlayProps> = ({ isVisible, mode }) => {
  const [step, setStep] = useState(0);

  const callSteps = [
    { icon: <Search className="w-6 h-6 text-blue-400" />, text: "Transcribing audio & separating speakers..." },
    { icon: <BrainCircuit className="w-6 h-6 text-purple-400" />, text: "Gemini 3.0 Pro is reasoning about context..." },
    { icon: <Activity className="w-6 h-6 text-rose-400" />, text: "Analyzing sentiment fluctuations & tone..." },
    { icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />, text: "Checking compliance against playbooks..." },
    { icon: <Lightbulb className="w-6 h-6 text-amber-400" />, text: "Generating actionable coaching insights..." }
  ];

  const dealSteps = [
    { icon: <FileText className="w-6 h-6 text-blue-400" />, text: "Reading documents & extracting key data..." },
    { icon: <Users className="w-6 h-6 text-indigo-400" />, text: "Mapping the buying committee & influencers..." },
    { icon: <BrainCircuit className="w-6 h-6 text-purple-400" />, text: "Gemini 3.0 Pro is evaluating deal risks (BANT)..." },
    { icon: <Calculator className="w-6 h-6 text-emerald-400" />, text: "Calculating win probability & velocity..." },
    { icon: <Sparkles className="w-6 h-6 text-amber-400" />, text: "Drafting strategic action plan..." }
  ];

  const steps = mode === 'CALL' ? callSteps : dealSteps;

  useEffect(() => {
    if (!isVisible) {
      setStep(0);
      return;
    }

    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 3500); // Rotate every 3.5 seconds

    return () => clearInterval(interval);
  }, [isVisible, steps.length]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="max-w-md w-full p-8 text-center relative">
        {/* Pulsing Center Icon */}
        <div className="relative mx-auto w-24 h-24 mb-8">
           <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
           <div className="absolute inset-2 bg-indigo-500 rounded-full animate-pulse opacity-30"></div>
           <div className="relative bg-white rounded-full w-full h-full flex items-center justify-center shadow-xl border-4 border-indigo-100">
              <img 
                src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" 
                alt="Gemini" 
                className="w-12 h-12 animate-spin-slow" 
              />
           </div>
        </div>

        {/* Steps */}
        <div className="h-20 transition-all duration-500 transform">
           <div className="flex flex-col items-center justify-center gap-3 animate-fade-in-up" key={step}>
              {steps[step].icon}
              <h3 className="text-xl font-bold text-white tracking-tight">{steps[step].text}</h3>
           </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-8 overflow-hidden">
           <div className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 animate-progress-indeterminate"></div>
        </div>
        
        <p className="text-slate-400 text-xs mt-4 font-medium uppercase tracking-widest">
          Powered by Google DeepMind
        </p>
      </div>
    </div>
  );
};
