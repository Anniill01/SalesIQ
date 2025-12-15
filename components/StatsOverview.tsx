
import React, { useState } from 'react';
import { CallStats, TalkRatio, SilenceAnalysis } from '../types';
import { Mic, Clock, AlertOctagon, HeartPulse, Award, Info, ChevronDown, Ear, MicOff, MoreHorizontal } from 'lucide-react';

interface StatsOverviewProps {
  stats: CallStats;
  ratio: TalkRatio;
  silence?: SilenceAnalysis;
}

const StatTooltip = ({ text }: { text: string }) => (
  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 text-center leading-tight">
    {text}
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
  </div>
);

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, ratio, silence }) => {
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  // Helper to normalize values (convert 0.85 to 85, keep 85 as 85)
  const normalize = (val: number | undefined | null) => {
    if (val === undefined || val === null) return 0;
    return (val > 0 && val <= 1) ? Math.round(val * 100) : Math.round(val);
  };

  const salesRatio = normalize(ratio?.sales ?? 50);
  const prospectRatio = normalize(ratio?.prospect ?? (100 - salesRatio));
  
  const listeningVal = silence?.listeningRatio;
  const effectiveListeningRatio = listeningVal && listeningVal > 0 
    ? normalize(listeningVal) 
    : Math.max(0, 100 - salesRatio);

  const callScore = normalize(stats.callScore);
  const patienceScore = normalize(stats.patienceScore);

  const getPatienceLabel = (score: number) => {
    if (score >= 80) return "Zen Master 🧘";
    if (score >= 60) return "Balanced";
    return "In a Rush 🏃";
  };

  // Helper for Circular Progress
  const renderCircle = (score: number, colorClass: string, trackClass: string, size: number = 36) => {
    const radius = size - 4;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    
    return (
      <svg className="w-full h-full transform -rotate-90">
        <circle cx={size} cy={size} r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className={trackClass} />
        <circle 
          cx={size} cy={size} r={radius} 
          stroke="currentColor" strokeWidth="6" 
          fill="transparent" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          className={`${colorClass} transition-all duration-1000 ease-out`} 
          strokeLinecap="round" 
        />
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
      {/* Call Score - Prominent with Circular Gauge */}
      <div 
        className="bg-gradient-to-br from-indigo-600 to-violet-700 p-4 rounded-2xl shadow-lg shadow-indigo-200 border border-indigo-500/20 flex flex-col justify-between relative group text-white cursor-pointer hover:scale-[1.02] transition-transform duration-300"
        onClick={() => setShowScoreDetails(!showScoreDetails)}
      >
        <div className="flex justify-between items-start">
           <h3 className="text-xs font-bold text-indigo-100 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4" /> Score
          </h3>
          <Info className="w-4 h-4 text-indigo-300 opacity-50" />
        </div>
       
        {showScoreDetails ? (
           <div className="flex flex-col gap-2 text-xs animate-fade-in mt-2">
             <div className="flex justify-between items-center border-b border-indigo-500/30 pb-1">
               <span className="text-indigo-200">Talk Ratio</span>
               <span className="font-bold">+{stats.scoreBreakdown?.talkRatioContribution || 0}</span>
             </div>
             <div className="flex justify-between items-center border-b border-indigo-500/30 pb-1">
               <span className="text-indigo-200">Patience</span>
               <span className="font-bold">+{stats.scoreBreakdown?.patienceContribution || 0}</span>
             </div>
             <div className="flex justify-between items-center border-b border-indigo-500/30 pb-1">
               <span className="text-indigo-200">Sentiment</span>
               <span className="font-bold">+{stats.scoreBreakdown?.sentimentContribution || 0}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-indigo-200">Interruptions</span>
               <span className="font-bold">+{stats.scoreBreakdown?.interruptionsContribution || 0}</span>
             </div>
           </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-grow mt-1 relative">
             <div className="w-20 h-20 relative">
                {renderCircle(callScore, "text-white", "text-indigo-400/30", 40)}
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-black tracking-tighter drop-shadow-sm">
                  {callScore}
                </div>
             </div>
             <div className="text-[10px] text-indigo-200 font-medium mt-1 opacity-80 flex items-center gap-1 bg-indigo-800/30 px-2 py-0.5 rounded-full">
                View Breakdown <ChevronDown className="w-3 h-3" />
             </div>
          </div>
        )}
      </div>

      {/* Talk Ratio */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center relative group hover:border-blue-300 transition-colors">
        <StatTooltip text="Target: 45% Sales / 55% Prospect. Ensure the customer feels heard." />
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
            <Mic className="w-4 h-4 text-blue-500" />
            Talk Ratio
          </h3>
          <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">45/55 Goal</span>
        </div>
        
        <div className="relative w-full h-10 rounded-xl overflow-hidden bg-slate-100 flex">
          {/* Target Marker */}
          <div className="absolute top-0 bottom-0 left-[45%] w-0.5 bg-black/20 z-10 border-l border-dashed border-slate-600" title="Target Line"></div>

          <div 
            className="bg-blue-500 h-full flex items-center justify-center transition-all duration-1000 relative" 
            style={{ width: `${salesRatio}%` }}
          >
            {salesRatio > 15 && <span className="text-white text-xs font-bold">{salesRatio}%</span>}
          </div>
          <div 
            className="bg-slate-300 h-full flex items-center justify-center transition-all duration-1000 relative" 
            style={{ width: `${prospectRatio}%` }}
          >
             {prospectRatio > 15 && <span className="text-slate-600 text-xs font-bold">{prospectRatio}%</span>}
          </div>
        </div>
        
        <div className="flex justify-between mt-3 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-slate-600">You</span>
          </div>
          <div className="flex items-center gap-1.5">
             <span className="text-slate-600">Prospect</span>
             <div className="w-2 h-2 rounded-full bg-slate-300"></div>
          </div>
        </div>
      </div>

      {/* Silence / Listening */}
       <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between relative group hover:border-emerald-300 transition-colors">
        <StatTooltip text="Active listening leads to better discovery. Smart silence encourages the prospect to elaborate." />
        <div className="flex justify-between items-start">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Ear className="w-3 h-3" /> Listening
          </h3>
          <div className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Active</div>
        </div>
        
        <div className="flex items-center justify-center gap-4 my-2">
           <div className="w-16 h-16 relative">
              {renderCircle(effectiveListeningRatio, "text-emerald-500", "text-slate-100", 32)}
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-700">
                {effectiveListeningRatio}%
              </div>
           </div>
        </div>

        {silence && (
          <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-emerald-50 rounded-lg p-1.5 text-center border border-emerald-100">
                <div className="text-emerald-700 font-bold text-xs flex items-center justify-center gap-1">
                   <MoreHorizontal className="w-3 h-3" /> {silence.smartSilenceCount}
                </div>
                <div className="text-[8px] text-emerald-600/70 uppercase font-bold tracking-wide">Smart</div>
              </div>
              <div className="bg-rose-50 rounded-lg p-1.5 text-center border border-rose-100">
                <div className="text-rose-700 font-bold text-xs flex items-center justify-center gap-1">
                   <MicOff className="w-3 h-3" /> {silence.awkwardSilenceCount}
                </div>
                <div className="text-[8px] text-rose-600/70 uppercase font-bold tracking-wide">Awkward</div>
              </div>
          </div>
        )}
      </div>

      {/* Quick Stats: Pace & Monologue */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between relative group hover:border-slate-300 transition-colors">
        <StatTooltip text="WPM: Keep it conversational (120-150). Monologue: Avoid lecturing (>45s)." />
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-3 h-3" /> Pace & Flow
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500">Speed</span>
            <div className="flex items-baseline gap-1">
               <span className="text-xl font-bold text-slate-800">{stats.wpm}</span>
               <span className="text-[10px] text-slate-400">wpm</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
             <div className={`h-full rounded-full ${stats.wpm > 160 ? 'bg-orange-400' : 'bg-blue-400'}`} style={{width: `${Math.min(stats.wpm/200 * 100, 100)}%`}}></div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500">Monologue</span>
            <div className="flex items-baseline gap-1">
               <span className={`text-xl font-bold ${stats.longestMonologue > 60 ? 'text-red-500' : 'text-slate-800'}`}>{stats.longestMonologue}</span>
               <span className="text-[10px] text-slate-400">sec</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interruptions */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between relative group hover:border-slate-300 transition-colors">
        <StatTooltip text="Interruptions break flow. Aim for < 3 per call." />
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertOctagon className="w-3 h-3" /> Friction
        </h3>
        <div className="flex flex-col items-center justify-center flex-grow">
          <div className={`text-4xl font-extrabold ${stats.interruptions > 5 ? 'text-red-500' : stats.interruptions > 2 ? 'text-amber-500' : 'text-slate-800'}`}>
            {stats.interruptions}
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-1">Interruptions</p>
        </div>
      </div>

      {/* Patience Score */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between relative group hover:border-purple-300 transition-colors">
        <StatTooltip text="Calculated based on pause time before responding. High patience = thoughtful responses." />
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <HeartPulse className="w-3 h-3" /> Patience
        </h3>
        <div className="flex flex-col items-center justify-center flex-grow">
           <div className={`text-4xl font-bold ${patienceScore > 75 ? 'text-purple-500' : patienceScore > 50 ? 'text-blue-500' : 'text-slate-400'}`}>
              {patienceScore}
            </div>
            <div className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-bold mt-2 border border-slate-200 text-center">
               {getPatienceLabel(patienceScore)}
            </div>
        </div>
      </div>
    </div>
  );
};
