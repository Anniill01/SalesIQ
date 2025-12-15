
import React, { useState } from 'react';
import { CoachingInsights } from '../types';
import { CheckCircle2, AlertCircle, Sparkles, CheckSquare, Calendar, ArrowRight, Target, HelpCircle, ShieldAlert, Zap, Lightbulb, TrendingUp, UserPlus, Megaphone, Check } from 'lucide-react';

interface CoachingCardProps {
  coaching: CoachingInsights;
}

export const CoachingCard: React.FC<CoachingCardProps> = ({ coaching }) => {
  const [checkedActions, setCheckedActions] = useState<number[]>([]);
  const [assignedActions, setAssignedActions] = useState<number[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  const toggleAction = (index: number) => {
    if (checkedActions.includes(index)) {
      setCheckedActions(prev => prev.filter(i => i !== index));
    } else {
      setCheckedActions(prev => [...prev, index]);
    }
  };

  const handleAssign = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (assignedActions.includes(index)) {
      setAssignedActions(prev => prev.filter(i => i !== index));
    } else {
      setAssignedActions(prev => [...prev, index]);
    }
  };

  const handleScheduleClick = () => {
    if (scheduleDate) {
      alert(`Follow-up call scheduled for ${new Date(scheduleDate).toLocaleString()}`);
      setIsScheduling(false);
      setScheduleDate('');
    }
  };

  const getOutcomeColorStyles = (label: string) => {
    if (label === 'High Likelihood') return { text: 'text-emerald-700', bg: 'bg-emerald-50', bar: 'bg-emerald-500', border: 'border-emerald-200' };
    if (label === 'Medium Likelihood') return { text: 'text-amber-700', bg: 'bg-amber-50', bar: 'bg-amber-500', border: 'border-amber-200' };
    return { text: 'text-red-700', bg: 'bg-red-50', bar: 'bg-red-500', border: 'border-red-200' };
  };

  const outcomeStyles = coaching.predictedOutcome 
    ? getOutcomeColorStyles(coaching.predictedOutcome.label)
    : { text: 'text-slate-700', bg: 'bg-slate-50', bar: 'bg-slate-300', border: 'border-slate-200' };

  // Normalize scores (handle 0.8 vs 80)
  const pitchScoreRaw = coaching.salesPitchAssessment?.score || 0;
  const pitchScore = (pitchScoreRaw > 0 && pitchScoreRaw <= 1) ? Math.round(pitchScoreRaw * 100) : Math.round(pitchScoreRaw);

  const outcomeScoreRaw = coaching.predictedOutcome?.score || 0;
  const outcomeScore = (outcomeScoreRaw > 0 && outcomeScoreRaw <= 1) ? Math.round(outcomeScoreRaw * 100) : Math.round(outcomeScoreRaw);

  // Radius for pitch gauge
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pitchScore / 100) * circumference;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      
      {/* AI Executive Summary - Full Width */}
      <div className="md:col-span-2 xl:col-span-4 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-lg p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm border border-white/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-indigo-100 uppercase tracking-wider text-sm">AI Executive Summary</h3>
          </div>
          <p className="text-xl leading-relaxed font-medium text-white/95 max-w-5xl">
            {coaching.overallSummary}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl mix-blend-overlay"></div>
      </div>

      {/* Action Items (Next Steps) */}
      <div className="md:col-span-2 xl:col-span-2 bg-blue-50 rounded-xl border border-blue-100 p-6 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <CheckSquare className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-bold text-blue-900 text-lg">Action Items</h3>
        </div>
        <div className="space-y-3 flex-grow overflow-y-auto max-h-[300px] custom-scrollbar pr-2">
          {(coaching.nextActions || []).map((item, idx) => {
            const isChecked = checkedActions.includes(idx);
            const isAssigned = assignedActions.includes(idx);
            
            return (
              <div 
                key={idx} 
                onClick={() => toggleAction(idx)}
                className={`
                  flex gap-3 items-start p-3 rounded-lg border cursor-pointer transition-all select-none relative group
                  ${isChecked 
                    ? 'bg-blue-100 border-blue-200' 
                    : 'bg-white border-blue-100/50 hover:bg-white hover:border-blue-200 hover:shadow-sm'}
                `}
              >
                <div className={`
                  mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
                  ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-blue-300 bg-white'}
                `}>
                   {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className="flex-grow">
                  <span className={`text-sm font-medium leading-tight transition-all ${isChecked ? 'text-blue-800/60 line-through decoration-blue-800/40' : 'text-blue-800'}`}>
                    {item}
                  </span>
                  {isAssigned && (
                     <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-600 font-bold bg-blue-100 w-fit px-1.5 py-0.5 rounded">
                       <UserPlus className="w-3 h-3" /> Assigned
                     </div>
                  )}
                </div>
                <button 
                  onClick={(e) => handleAssign(e, idx)}
                  className={`p-1.5 rounded-md transition-colors ${isAssigned ? 'text-blue-600 bg-blue-100' : 'text-slate-300 hover:bg-slate-100 hover:text-blue-500'} opacity-0 group-hover:opacity-100`}
                  title="Assign Coaching Task"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
        
        {/* Schedule Follow-up Button */}
        <div className="mt-6 pt-6 border-t border-blue-200">
          {!isScheduling ? (
            <button 
              onClick={() => setIsScheduling(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              Schedule Follow-up Call
            </button>
          ) : (
             <div className="animate-fade-in">
               <label className="block text-xs font-semibold text-blue-800 mb-1.5">Select Date & Time</label>
               <div className="flex gap-2">
                 <input 
                   type="datetime-local" 
                   value={scheduleDate}
                   onChange={(e) => setScheduleDate(e.target.value)}
                   className="flex-grow px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 bg-white"
                 />
                 <button 
                   onClick={handleScheduleClick}
                   disabled={!scheduleDate}
                   className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 rounded-lg flex items-center justify-center"
                 >
                   <ArrowRight className="w-4 h-4" />
                 </button>
               </div>
               <button 
                 onClick={() => setIsScheduling(false)} 
                 className="text-xs text-slate-500 mt-2 hover:text-slate-700 underline"
               >
                 Cancel
               </button>
             </div>
          )}
        </div>
      </div>

      {/* Predicted Outcome */}
      {coaching.predictedOutcome && (
        <div className={`md:col-span-2 xl:col-span-2 ${outcomeStyles.bg} border ${outcomeStyles.border} rounded-xl p-6 shadow-sm flex flex-col h-full`}>
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg bg-white/50`}>
                  <TrendingUp className={`w-5 h-5 ${outcomeStyles.text}`} />
                </div>
                <h3 className={`font-bold text-lg ${outcomeStyles.text}`}>Predicted Outcome</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold bg-white border ${outcomeStyles.border} ${outcomeStyles.text}`}>
                {coaching.predictedOutcome.label}
              </span>
           </div>
           
           <div className="mb-6 flex-grow flex flex-col justify-center">
              <div className="flex justify-between items-end mb-2">
                 <span className="text-sm font-medium text-slate-600">Win Probability</span>
                 <span className={`text-4xl font-extrabold ${outcomeStyles.text}`}>{outcomeScore}%</span>
              </div>
              <div className="w-full h-4 bg-white rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                 <div className={`h-full rounded-full transition-all duration-1000 ${outcomeStyles.bar}`} style={{ width: `${outcomeScore}%` }}></div>
              </div>
           </div>
           
           <div className="bg-white/60 rounded-lg p-4 border border-slate-100 text-sm text-slate-700 leading-relaxed">
             <span className="font-bold block text-xs text-slate-400 uppercase mb-1">AI Rationale</span>
             {coaching.predictedOutcome.rationale}
           </div>
        </div>
      )}

      {/* Sales Pitch Effectiveness (Redesigned) */}
      {coaching.salesPitchAssessment && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 md:col-span-2 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
               <Megaphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-indigo-900 text-lg">Pitch Effectiveness (First 90s)</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-8 items-center justify-center">
             {/* Radial Score */}
             <div className="relative w-32 h-32 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                   <circle
                     cx="64" cy="64" r="36"
                     stroke="#f1f5f9" strokeWidth="8"
                     fill="transparent"
                   />
                   <circle
                     cx="64" cy="64" r="36"
                     stroke="currentColor" strokeWidth="8"
                     fill="transparent"
                     strokeDasharray={2 * Math.PI * 36}
                     strokeDashoffset={(2 * Math.PI * 36) - (pitchScore / 100) * (2 * Math.PI * 36)}
                     strokeLinecap="round"
                     className={`${pitchScore >= 80 ? 'text-indigo-500' : pitchScore >= 60 ? 'text-amber-500' : 'text-red-500'} transition-all duration-1000 ease-out`}
                   />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-3xl font-extrabold text-slate-800">{pitchScore}</span>
                   <span className="text-[10px] font-bold text-slate-400 uppercase">Score</span>
                </div>
             </div>

             {/* Breakdown */}
             <div className="flex-grow space-y-3 w-full">
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex gap-3">
                  <Target className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                     <h4 className="text-xs font-bold text-slate-700 uppercase mb-0.5">Hook & Clarity</h4>
                     <p className="text-xs text-slate-500 leading-snug">{coaching.salesPitchAssessment.hook || coaching.salesPitchAssessment.clarity}</p>
                  </div>
               </div>
               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex gap-3">
                  <ArrowRight className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                     <h4 className="text-xs font-bold text-slate-700 uppercase mb-0.5">Call to Action</h4>
                     <p className="text-xs text-slate-500 leading-snug">{coaching.salesPitchAssessment.callToAction}</p>
                  </div>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Key Objections Handled (Redesigned) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 md:col-span-2 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
             <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Key Objections Handled</h3>
        </div>
        <ul className="space-y-3">
           {(coaching.objectionsHandled || []).map((item, idx) => (
            <li key={idx} className="flex gap-3 text-sm text-slate-700 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 items-start">
               <div className="bg-emerald-100 text-emerald-600 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold mt-0.5 border border-emerald-200">
                <Check className="w-3.5 h-3.5" />
              </div>
               <span className="font-medium leading-relaxed">{item}</span>
            </li>
           ))}
           {(!coaching.objectionsHandled || coaching.objectionsHandled.length === 0) && (
             <div className="text-center py-8 text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm italic">No major objections detected in this call.</p>
             </div>
           )}
        </ul>
      </div>

      {/* Strengths (Winning Moments) - Full Height */}
      <div className="md:col-span-1 xl:col-span-2 bg-emerald-50 rounded-xl border border-emerald-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-emerald-100 rounded-lg">
             <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="font-bold text-emerald-900 text-lg">Winning Moments</h3>
        </div>
        <ul className="space-y-4">
          {(coaching.strengths || []).map((item, idx) => (
            <li key={idx} className="flex gap-3 text-sm text-emerald-800 bg-white/60 p-3 rounded-lg border border-emerald-100/50 shadow-sm">
              <span className="bg-emerald-200 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold mt-0.5 border border-emerald-300">
                {idx + 1}
              </span>
              <span className="font-medium">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Missed Opportunities - Full Height */}
      <div className="md:col-span-1 xl:col-span-2 bg-amber-50 rounded-xl border border-amber-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-amber-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="font-bold text-amber-900 text-lg">Missed Opportunities</h3>
        </div>
        <ul className="space-y-4">
          {(coaching.missedOpportunities || []).map((item, idx) => (
            <li key={idx} className="flex gap-3 text-sm text-amber-800 bg-white/60 p-3 rounded-lg border border-amber-100/50 shadow-sm">
              <span className="bg-amber-200 text-amber-700 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold mt-0.5 border border-amber-300">
                {idx + 1}
              </span>
              <span className="font-medium">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Key Questions - Prominent */}
      <div className="md:col-span-2 xl:col-span-4 bg-purple-50 rounded-xl border border-purple-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-purple-100 rounded-lg">
            <HelpCircle className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="font-bold text-purple-900 text-lg">Key Questions Asked</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coaching.keyQuestions && coaching.keyQuestions.length > 0 ? (
             (coaching.keyQuestions || []).map((item, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-purple-800 items-start bg-white/60 p-3 rounded-lg border border-purple-100 shadow-sm">
                 <span className="bg-purple-200 text-purple-700 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold mt-0.5 border border-purple-300">
                  Q
                </span>
                <span className="italic font-medium leading-relaxed">"{item}"</span>
              </li>
            ))
          ) : (
            <div className="col-span-2 text-sm text-slate-500 italic p-4 bg-white/50 rounded-lg text-center">
              No significant discovery questions detected in this call.
            </div>
          )}
        </div>
      </div>

      {/* Strategies to Close */}
      <div className="bg-fuchsia-50 rounded-xl border border-fuchsia-100 p-6 md:col-span-2 xl:col-span-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-fuchsia-100 rounded-lg">
             <Target className="w-5 h-5 text-fuchsia-600" />
          </div>
          <h3 className="font-bold text-fuchsia-900 text-lg">Closing Strategies</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {(coaching.closingSuggestions || []).map((item, idx) => (
            <li key={idx} className="flex gap-3 items-start text-sm bg-white/60 p-4 rounded-lg border border-fuchsia-100 shadow-sm">
               <div className="mt-0.5 flex-shrink-0 bg-fuchsia-100 p-1 rounded-full">
                  <ArrowRight className="w-3.5 h-3.5 text-fuchsia-600" />
               </div>
               <div>
                 <span className="block font-bold text-fuchsia-900 mb-1">{item.strategy}</span>
                 <span className="block text-slate-600 text-xs leading-relaxed">{item.rationale}</span>
               </div>
            </li>
          ))}
           {(!coaching.closingSuggestions || coaching.closingSuggestions.length === 0) && (
             <li className="text-sm text-slate-500 italic p-4">No closing suggestions available.</li>
           )}
        </div>
      </div>

    </div>
  );
};
