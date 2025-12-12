
import React from 'react';
import { DealRisk, BuyingCommitteeMember, DealStageAssessment, CallIntent } from '../types';
import { AlertTriangle, Users, Briefcase, ChevronRight, ShieldCheck, TrendingUp, AlertOctagon, Zap, Target } from 'lucide-react';

interface DealIntelligenceProps {
  risk: DealRisk;
  committee: BuyingCommitteeMember[];
  stage: DealStageAssessment;
  intents?: CallIntent[];
}

export const DealIntelligence: React.FC<DealIntelligenceProps> = ({ risk, committee, stage, intents }) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getIntentColor = (category: string) => {
    switch(category) {
      case 'Buying': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Pricing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Risk': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
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
          <span className={`text-4xl font-extrabold ${risk.riskScore > 50 ? 'text-red-500' : 'text-green-500'}`}>
            {risk.riskScore}
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
                <p className="text-sm font-bold text-slate-700">{member.role}</p>
                <p className="text-xs text-slate-500">{member.nameOrReference}</p>
              </div>
              <div className={`
                w-2.5 h-2.5 rounded-full 
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

      {/* Intent Detection (New) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
         <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-800">Buyer Intent</h3>
         </div>
         <div className="space-y-3 flex-grow overflow-y-auto max-h-[200px] custom-scrollbar">
            {(intents || []).map((intent, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${getIntentColor(intent.category)}`}>
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold uppercase">{intent.category}</span>
                    <span className="text-xs font-mono font-bold">{intent.score}%</span>
                 </div>
                 <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-current opacity-50" style={{ width: `${intent.score}%` }}></div>
                 </div>
                 <p className="text-[10px] opacity-80 leading-tight">"{intent.evidence}"</p>
              </div>
            ))}
            {(!intents || intents.length === 0) && (
               <div className="text-xs text-slate-400 italic text-center py-4">
                  No strong intent signals detected.
               </div>
            )}
         </div>
      </div>

    </div>
  );
};