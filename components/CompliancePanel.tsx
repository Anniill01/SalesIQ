
import React, { useState } from 'react';
import { ComplianceCheck } from '../types';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { exportCompliancePanel } from '../services/exportService';

interface CompliancePanelProps {
  compliance: ComplianceCheck;
}

export const CompliancePanel: React.FC<CompliancePanelProps> = ({ compliance }) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 p-6 text-white mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h3 className="text-lg font-bold flex items-center gap-2">
             <ShieldCheck className="w-6 h-6 text-emerald-400" />
             QA & Compliance Scanner
           </h3>
           <p className="text-slate-400 text-sm">Automated detection of forbidden phrases and required scripts.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
             <span className="text-sm text-slate-300 font-medium">QA Score</span>
             <span className={`text-2xl font-bold ${compliance.complianceScore >= 90 ? 'text-emerald-400' : compliance.complianceScore >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
               {compliance.complianceScore}
             </span>
           </div>
           
           <div className="relative">
             <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                title="Export Compliance Report"
             >
                <Download className="w-5 h-5" />
             </button>
             {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <button 
                    onClick={() => { exportCompliancePanel(compliance, 'CSV'); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel / CSV
                  </button>
                  <button 
                    onClick={() => { exportCompliancePanel(compliance, 'PDF'); setShowExportMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-red-600" /> PDF Report
                  </button>
                </div>
             )}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Forbidden Phrases */}
        <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
          <h4 className="font-bold text-red-300 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Forbidden / Risky Phrases
          </h4>
          <div className="space-y-3">
            {(compliance.forbiddenPhrasesDetected || []).map((item, idx) => (
              <div key={idx} className="bg-red-900/20 border border-red-900/30 p-3 rounded-md">
                 <div className="flex justify-between items-start mb-1">
                    <span className="text-red-200 font-bold text-sm">"{item.phrase}"</span>
                    <span className="text-[10px] uppercase font-bold bg-red-900/40 text-red-300 px-1.5 py-0.5 rounded border border-red-800/50">{item.severity}</span>
                 </div>
                 <p className="text-slate-400 text-xs italic mb-2">"...{item.context}..."</p>
                 <div className="flex gap-2 items-center text-xs text-emerald-400 bg-emerald-900/10 p-1.5 rounded">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Say instead: "{item.correction}"</span>
                 </div>
              </div>
            ))}
            {(compliance.forbiddenPhrasesDetected || []).length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">Clean call. No risk language detected.</p>
              </div>
            )}
          </div>
        </div>

        {/* Required Statements */}
        <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
           <h4 className="font-bold text-blue-300 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Mandatory Scripts
          </h4>
          <ul className="space-y-3">
            {(compliance.requiredStatements || []).map((item, idx) => (
              <li key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700">
                <span className="text-sm text-slate-300">{item.statement}</span>
                {item.status === 'Present' ? (
                   <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded">
                     <CheckCircle2 className="w-3.5 h-3.5" /> Present
                   </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-900/20 px-2 py-1 rounded">
                     <XCircle className="w-3.5 h-3.5" /> Missing
                   </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};