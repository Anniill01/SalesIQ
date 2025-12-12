import React, { useState } from 'react';
import { CallStats, TalkRatio, SilenceAnalysis } from '../types';
import { Mic, Clock, Timer, AlertOctagon, HeartPulse, Award, Info, ChevronDown, Ear, MicOff } from 'lucide-react';

interface StatsOverviewProps {
  stats: CallStats;
  ratio: TalkRatio;
  silence?: SilenceAnalysis;
}

const StatTooltip = ({ text }: { text: string }) => (
  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center leading-tight">
    {text}
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
  </div>
);

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, ratio, silence }) => {
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  // Safety fallback: If Listening Ratio is missing or 0, derive it from Sales Talk Ratio
  // We prefer the AI's calculation, but if it returns 0 or null, we calculate 100 - salesTalkRatio
  const salesRatio = ratio?.sales || 50;
  const prospectRatio = ratio?.prospect || 50;
  
  const effectiveListeningRatio = silence?.listeningRatio && silence.listeningRatio > 0 
    ? silence.listeningRatio 
    : Math.max(0, 100 - salesRatio);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
      {/* Call Score - Prominent with Breakdown */}
      <div 
        className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-xl shadow-md border border-blue-500/20 flex flex-col justify-between relative group text-white cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setShowScoreDetails(!showScoreDetails)}
      >
        <div className="flex justify-between items-start">
           <h3 className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" /> Call Score
          </h3>
          <Info className="w-4 h-4 text-blue-300 opacity-50" />
        </div>
       
        {showScoreDetails ? (
           <div className="flex flex-col gap-2 text-xs animate-fade-in">
             <div className="flex justify-between items-center border-b border-blue-500/30 pb-1">
               <span className="text-blue-200">Talk Ratio</span>
               <span className="font-bold">+{stats.scoreBreakdown?.talkRatioContribution || 0}</span>
             </div>
             <div className="flex justify-between items-center border-b border-blue-500/30 pb-1">
               <span className="text-blue-200">Patience</span>
               <span className="font-bold">+{stats.scoreBreakdown?.patienceContribution || 0}</span>
             </div>
             <div className="flex justify-between items-center border-b border-blue-500/30 pb-1">
               <span className="text-blue-200">Sentiment</span>
               <span className="font-bold">+{stats.scoreBreakdown?.sentimentContribution || 0}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-blue-200">Interruptions</span>
               <span className="font-bold">+{stats.scoreBreakdown?.interruptionsContribution || 0}</span>
             </div>
           </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-grow">
             <div className="text-5xl font-extrabold tracking-tight drop-shadow-sm">
                {stats.callScore || 0}
              </div>
              <div className="text-xs text-blue-100 font-medium mt-1 opacity-80 flex items-center gap-1">
                Details <ChevronDown className="w-3 h-3" />
              </div>
          </div>
        )}
      </div>

      {/* Talk Ratio */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center relative group">
        <StatTooltip text="Ideal ratio is typically 45/55 to ensure the prospect feels heard." />
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
            <Mic className="w-4 h-4 text-blue-500" />
            Talk Ratio
          </h3>
          <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Target: 45/55</span>
        </div>
        
        <div className="flex w-full h-8 rounded-lg overflow-hidden gap-1">
          <div 
            className="bg-blue-600 h-full flex items-center justify-center transition-all duration-1000 relative" 
            style={{ width: `${salesRatio}%` }}
          >
            {salesRatio > 15 && <span className="text-white text-xs font-bold drop-shadow-md">{salesRatio}%</span>}
          </div>
          <div 
            className="bg-slate-300 h-full flex items-center justify-center transition-all duration-1000 relative" 
            style={{ width: `${prospectRatio}%` }}
          >
             {prospectRatio > 15 && <span className="text-slate-700 text-xs font-bold">{prospectRatio}%</span>}
          </div>
        </div>
        
        <div className="flex justify-between mt-2 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <span className="text-slate-600">You</span>
          </div>
          <div className="flex items-center gap-1.5">
             <span className="text-slate-600">Prospect</span>
             <div className="w-2 h-2 rounded-full bg-slate-300"></div>
          </div>
        </div>
      </div>

      {/* Silence / Listening (Replaces Duration if available, or shifts grid) */}
       <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between relative group">
        <StatTooltip text="Listening Ratio and Smart Silence usage." />
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Ear className="w-3 h-3" /> Listening
        </h3>
        
        <div>
          <div className="flex items-baseline gap-1">
             <div className="text-3xl font-bold text-slate-800">{effectiveListeningRatio}%</div>
          </div>
          {silence && (
            <div className="flex gap-2 mt-2">
               <div className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1" title="Smart Silence">
                  <MicOff className="w-2.5 h-2.5" /> {silence.smartSilenceCount}
               </div>
               <div className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100 flex items-center gap-1" title="Awkward Silence">
                  <AlertOctagon className="w-2.5 h-2.5" /> {silence.awkwardSilenceCount}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats: Pace & Monologue */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between relative group">
        <StatTooltip text="WPM: Average speaking speed. Longest Turn: Longest time you spoke without pause." />
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-3 h-3" /> Pace & Flow
        </h3>
        <div className="flex justify-between items-end">
          <div>
            <div className="text-2xl font-bold text-slate-800">{stats.wpm}</div>
            <div className="text-xs text-slate-500">WPM</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-800">{stats.longestMonologue}s</div>
            <div className="text-xs text-slate-500">Monologue</div>
          </div>
        </div>
      </div>

      {/* Interruptions */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between relative group">
        <StatTooltip text="Number of times you interrupted the prospect while they were speaking." />
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertOctagon className="w-3 h-3" /> Interruptions
        </h3>
        <div>
          <div className="text-3xl font-bold text-slate-800 mb-1">{stats.interruptions}</div>
          <p className="text-[10px] text-slate-500 leading-tight">
            High interruptions can signal engagement or friction.
          </p>
        </div>
      </div>

      {/* Patience Score */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between relative group">
        <StatTooltip text="Score based on wait time after prospect speaks before you respond. Higher is better." />
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <HeartPulse className="w-3 h-3" /> Patience
        </h3>
        <div className="flex flex-col items-center justify-center flex-grow">
           <div className={`text-4xl font-bold ${stats.patienceScore > 75 ? 'text-emerald-500' : stats.patienceScore > 50 ? 'text-amber-500' : 'text-red-500'}`}>
              {stats.patienceScore}
            </div>
            <div className="text-xs text-slate-400 mt-1">/ 100</div>
        </div>
      </div>
    </div>
  );
};