
import React from 'react';
import { DealRisk, BuyingCommitteeMember, DealStageAssessment, CallIntent, CoachingInsights } from '../types';
import { AlertTriangle, Users, Briefcase, ChevronRight, ShieldCheck, TrendingUp, AlertOctagon, Target, DollarSign, Clock, Search, XCircle, Lightbulb, ThumbsUp, ListChecks } from 'lucide-react';

interface DealIntelligenceProps {
  risk: DealRisk;
  committee: BuyingCommitteeMember[];
  stage: DealStageAssessment;
  intents?: CallIntent[];
  coaching?: CoachingInsights;
}

export const DealIntelligence: React.FC<DealIntelligenceProps> = ({ risk, committee, stage, intents, coaching }) => {
  // Normalize scores
  const riskScore = (risk.riskScore > 0 && risk.riskScore <= 1) ? Math.round(risk.riskScore * 100) : Math.round(risk.riskScore);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getIntentStyles = (category: string) => {
    switch(category) {
      case 'Buying': return { bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500', icon: <Target className="w-4 h-4 text-emerald-600" /> };
      case 'Pricing': return { bg: 'bg-blue-50', border: 'border-blue-200', bar: 'bg-blue-500', icon: <DollarSign className="w-4 h-4 text-blue-600" /> };
      case 'Risk': return { bg: 'bg-red-50', border: 'border-red-200', bar: 'bg-red-500', icon: <AlertTriangle className="w-4 h-4 text-red-600" /> };
      case 'Timeline': return { bg: 'bg-purple-50', border: 'border-purple-200', bar: 'bg-purple-500', icon: <Clock className="w-4 h-4 text-purple-600" /> };
      case 'Feature Fit': return { bg: 'bg-indigo-50', border: 'border-indigo-200', bar: 'bg-indigo-500', icon: <Search className="w-4 h-4 text-indigo-600" /> };
      default: return { bg: 'bg-slate-50', border: 'border-slate-200', bar: 'bg-slate-400', icon: <Briefcase className="w-4 h-4 text-slate-500" /> };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
      
      {/* Risk Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-slate-500" />
            Deal Risk
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getRiskColor(risk.riskLevel)}`}>
            {risk.riskLevel}
          </span>
        </div>
        
        <div className="flex items-end gap-2 mb-4">
          <span className={`text-4xl font-extrabold ${riskScore > 50 ? 'text-red-500' : 'text-green-500'}`}>
            {riskScore}
          </span>
          <span className="text-sm text-slate-400 mb-1.5">/ 100</span>
        </div>

        <ul className="space-y-3 flex-grow">
          {(risk.riskFactors || []).map((factor, idx) => (
            <li key={idx} className="flex gap-2 items-start text-xs text-slate-600">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
              <span>{factor}</span>
            </li>
          ))}
          {(risk.riskFactors || []).length === 0 && (
             <li className="text-xs text-slate-500 italic flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-green-500" /> No significant risks.
             </li>
          )}
        </ul>
      </div>

      {/* Buying Committee */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-slate-800">Stakeholders</h3>
        </div>
        
        <div className="space-y-3 overflow-y-auto max-h-[200px] custom-scrollbar">
          {(committee || []).map((member, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-700">{member.nameOrReference}</p>
                <p className="text-xs text-slate-500 font-medium">{member.role}</p>
              </div>
              <div className={`
                w-3 h-3 rounded-full border-2 border-white shadow-sm 
                ${member.sentiment === 'Positive' ? 'bg-green-500' : member.sentiment === 'Negative' ? 'bg-red-500' : 'bg-slate-300'}
              `} title={`Sentiment: ${member.sentiment}`}></div>
            </div>
          ))}
          {(committee || []).length === 0 && (
            <p className="text-sm text-slate-400 italic">No stakeholders identified.</p>
          )}
        </div>
      </div>

      {/* Pipeline Stage */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-purple-500" />
          <h3 className="font-bold text-slate-800">Deal Stage</h3>
        </div>

        <div className="flex items-center justify-between bg-purple-50 p-3 rounded-lg border border-purple-100 mb-4">
          <div>
            <p className="text-[10px] text-purple-600 font-semibold uppercase">Current</p>
            <p className="font-bold text-purple-900 text-sm">{stage.currentStage}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-300" />
          <div className="text-right">
            <p className="text-[10px] text-emerald-600 font-semibold uppercase">Recommended</p>
            <p className="font-bold text-emerald-900 text-sm">{stage.recommendedStage}</p>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex-grow">
          <div className="flex items-center gap-2 mb-2">
             <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
             <p className="text-[10px] font-bold text-slate-500 uppercase">Rationale</p>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">{stage.justification}</p>
        </div>
      </div>

      {/* Intent Detection (Polished) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
         <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-800">Buyer Intent</h3>
         </div>
         <div className="space-y-3 flex-grow overflow-y-auto max-h-[250px] custom-scrollbar pr-1">
            {(intents || []).map((intent, idx) => {
              const styles = getIntentStyles(intent.category);
              const intentScore = (intent.score > 0 && intent.score <= 1) ? Math.round(intent.score * 100) : Math.round(intent.score);
              return (
                <div key={idx} className={`p-3 rounded-lg border ${styles.bg} ${styles.border} transition-all hover:shadow-sm`}>
                   <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                         {styles.icon}
                         <span className="text-xs font-bold uppercase text-slate-700">{intent.category}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-600">{intentScore}%</span>
                   </div>
                   
                   <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden mb-2 border border-black/5">
                      <div className={`h-full ${styles.bar}`} style={{ width: `${intentScore}%` }}></div>
                   </div>
                   
                   <div className="bg-white/50 p-2 rounded border border-black/5 text-[10px] text-slate-600 italic leading-tight">
                     "{intent.evidence}"
                   </div>
                </div>
              );
            })}
            {(!intents || intents.length === 0) && (
               <div className="text-xs text-slate-400 italic text-center py-4">
                  No strong intent signals detected.
               </div>
            )}
         </div>
      </div>

      {/* Coaching Integration in Deal Intel */}
      {coaching && (
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
           <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5 shadow-sm">
              <h3 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                 <ThumbsUp className="w-4 h-4" /> Winning Moments
              </h3>
              <ul className="space-y-2">
                 {(coaching.strengths || []).slice(0, 3).map((m, i) => (
                     <li key={i} className="text-xs text-emerald-800 flex gap-2 items-start">
                         <span className="font-bold">•</span> {m}
                     </li>
                 ))}
              </ul>
           </div>
           
           <div className="bg-amber-50 rounded-xl border border-amber-100 p-5 shadow-sm">
              <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                 <AlertTriangle className="w-4 h-4" /> Improvement Areas
              </h3>
              <ul className="space-y-2">
                 {(coaching.improvementAreas || []).slice(0, 3).map((m, i) => (
                     <li key={i} className="text-xs text-amber-900 flex gap-2 items-start">
                          <span className="font-bold">•</span> {m}
                     </li>
                 ))}
              </ul>
           </div>

           <div className="bg-blue-50 rounded-xl border border-blue-100 p-5 shadow-sm">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                 <Lightbulb className="w-4 h-4" /> Key Takeaways
              </h3>
              <ul className="space-y-2">
                 {(coaching.keyTakeaways || []).slice(0, 3).map((m, i) => (
                     <li key={i} className="text-xs text-blue-900 flex gap-2 items-start">
                          <span className="font-bold">•</span> {m}
                     </li>
                 ))}
              </ul>
           </div>
        </div>
      )}

    </div>
  );
};
