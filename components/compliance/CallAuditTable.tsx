
import React, { useState } from 'react';
import { QACallRecord, ViolationSeverity } from '../../types';
import { AlertCircle, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, Play, FileText, User, XCircle } from 'lucide-react';

interface CallAuditTableProps {
  calls: QACallRecord[];
}

export const CallAuditTable: React.FC<CallAuditTableProps> = ({ calls }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Critical' | 'Review Needed' | 'Clean'>('All');

  const filteredCalls = filter === 'All' ? calls : (calls || []).filter(c => c.status === filter);

  const getSeverityColor = (sev: ViolationSeverity) => {
    switch (sev) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'Warning': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Info': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Critical': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle className="w-3 h-3"/> Failed</span>;
      case 'Review Needed': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700"><AlertTriangle className="w-3 h-3"/> Review</span>;
      case 'Clean': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3"/> Passed</span>;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header & Filters */}
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 text-lg">Batch Audit Log</h3>
        <div className="flex gap-2">
          {['All', 'Critical', 'Review Needed', 'Clean'].map((f) => (
             <button 
               key={f}
               onClick={() => setFilter(f as any)}
               className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
             >
               {f}
             </button>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <div className="col-span-4">Representative / File</div>
        <div className="col-span-2 text-center">Score</div>
        <div className="col-span-2">Violations</div>
        <div className="col-span-2">Scripts</div>
        <div className="col-span-2 text-right">Status</div>
      </div>

      {/* List */}
      <div className="max-h-[600px] overflow-y-auto">
        {(filteredCalls || []).map((call) => (
          <div key={call.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
            <div 
              className="grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer"
              onClick={() => setExpandedId(expandedId === call.id ? null : call.id)}
            >
              <div className="col-span-4">
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded transition-transform ${expandedId === call.id ? 'rotate-90' : ''}`}>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{call.repName}</p>
                    <p className="text-xs text-slate-500 font-mono">{call.filename} • {call.date}</p>
                  </div>
                </div>
              </div>
              
              <div className="col-span-2 text-center">
                 <span className={`text-lg font-bold ${call.qaScore < 70 ? 'text-red-600' : call.qaScore < 90 ? 'text-amber-500' : 'text-emerald-600'}`}>
                   {call.qaScore}
                 </span>
              </div>

              <div className="col-span-2">
                 {(call.violations || []).length > 0 ? (
                   <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">
                     {(call.violations || []).length} Detected
                   </span>
                 ) : (
                   <span className="text-xs text-slate-400">-</span>
                 )}
              </div>

              <div className="col-span-2">
                 {(call.missingRequiredScripts || []).length > 0 ? (
                   <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                     {(call.missingRequiredScripts || []).length} Missing
                   </span>
                 ) : (
                   <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                     <CheckCircle2 className="w-3 h-3" /> All Set
                   </span>
                 )}
              </div>

              <div className="col-span-2 text-right">
                {getStatusBadge(call.status)}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedId === call.id && (
              <div className="px-14 pb-6 animate-fade-in bg-slate-50/50 border-t border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {/* Violations List */}
                  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                    <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Phrase Violations
                    </h4>
                    {(call.violations || []).length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No forbidden phrases detected.</p>
                    ) : (
                      <div className="space-y-3">
                        {(call.violations || []).map((v) => (
                          <div key={v.id} className="p-3 bg-red-50 rounded border border-red-100">
                            <div className="flex justify-between items-start mb-1">
                               <span className="font-bold text-red-800 text-xs uppercase">"{v.phrase}"</span>
                               <span className="font-mono text-[10px] text-red-500">{v.timestamp}</span>
                            </div>
                            <p className="text-xs text-slate-600 italic mb-2">"{v.contextSnippet}"</p>
                            <div className="text-xs bg-white p-2 rounded border border-red-100 text-slate-700">
                               <span className="font-bold text-emerald-600 block mb-0.5">Fix Suggestion:</span>
                               {v.suggestedFix}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Missing Scripts */}
                  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                    <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Required Scripts Check
                    </h4>
                    {(call.missingRequiredScripts || []).length === 0 ? (
                      <p className="text-xs text-slate-400 italic flex items-center gap-2">
                         <CheckCircle2 className="w-4 h-4 text-emerald-500" /> All mandatory statements found.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                         {(call.missingRequiredScripts || []).map((script, idx) => (
                           <li key={idx} className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-100">
                             <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                             Missing: "{script}"
                           </li>
                         ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
