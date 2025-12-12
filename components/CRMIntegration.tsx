
import React, { useState } from 'react';
import { SalesAnalysisResult } from '../types';
import { Database, Check, Copy, X, Loader2, Server } from 'lucide-react';

interface CRMIntegrationProps {
  data: SalesAnalysisResult;
}

export const CRMIntegration: React.FC<CRMIntegrationProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS'>('IDLE');

  const handleSync = () => {
    setStatus('SYNCING');
    // Simulate API delay
    setTimeout(() => {
      setStatus('SUCCESS');
      setTimeout(() => {
        setStatus('IDLE');
        setIsOpen(false);
      }, 2000);
    }, 1500);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors px-4 py-2 rounded-lg shadow-sm"
      >
        <Database className="w-4 h-4" />
        Sync to CRM
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            CRM Integration API
          </h3>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            This action will push the analyzed call data, sentiment scores, and coaching insights to your connected CRM (Salesforce / HubSpot) via REST API.
          </p>
          
          <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-green-400 overflow-y-auto max-h-[300px] mb-6 border border-slate-700">
            <pre>{JSON.stringify({
              object: "CallLog",
              action: "create",
              source: "SalesIQ_Coach",
              payload: {
                call_score: data.callStats.callScore,
                sentiment_trend: "Positive", 
                risk_level: data.dealIntelligence.riskAnalysis.riskLevel,
                compliance_score: data.compliance.complianceScore,
                deal_stage_recommendation: data.dealIntelligence.dealStage.recommendedStage,
                meeting_notes: data.coachingCard.overallSummary,
                next_steps: data.coachingCard.nextActions,
                deal_health_suggestions: data.dealIntelligence.riskAnalysis.riskFactors,
                key_takeaways: data.coachingCard.keyTakeaways,
                sentiment_score: data.callStats.scoreBreakdown?.sentimentContribution
              }
            }, null, 2)}</pre>
          </div>

          <div className="flex justify-end gap-3">
             <button 
               onClick={() => setIsOpen(false)}
               className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
             >
               Cancel
             </button>
             <button 
               onClick={handleSync}
               disabled={status !== 'IDLE'}
               className={`
                 flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold text-white transition-all
                 ${status === 'SUCCESS' ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700'}
               `}
             >
               {status === 'SYNCING' && <Loader2 className="w-4 h-4 animate-spin" />}
               {status === 'SUCCESS' && <Check className="w-4 h-4" />}
               {status === 'IDLE' ? 'Push Data to CRM' : status === 'SYNCING' ? 'Syncing...' : 'Synced!'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
