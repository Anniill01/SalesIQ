
import React from 'react';
import { QABatchStats, QACallRecord } from '../../types';
import { CallAuditTable } from './CallAuditTable';
import { BarChart3, AlertOctagon, ShieldCheck, TrendingDown } from 'lucide-react';

interface QADashboardProps {
  stats: QABatchStats;
  calls: QACallRecord[];
}

export const QADashboard: React.FC<QADashboardProps> = ({ stats, calls }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Batch Average Score</h4>
            <div className="flex items-end gap-2">
              <span className={`text-4xl font-extrabold ${stats.averageScore >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {stats.averageScore}
              </span>
              <span className="text-xs text-slate-400 mb-1.5">/ 100</span>
            </div>
         </div>

         <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Critical Violations</h4>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-extrabold text-red-500">
                {stats.criticalFlagCount}
              </span>
              <span className="text-xs text-slate-400 mb-1.5">calls flagged</span>
            </div>
         </div>

         <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Clean Calls</h4>
            <div className="flex items-end gap-2">
               <span className="text-4xl font-extrabold text-emerald-500">
                {stats.totalCalls > 0 ? Math.round((stats.cleanCallCount / stats.totalCalls) * 100) : 0}%
              </span>
              <span className="text-xs text-slate-400 mb-1.5">pass rate</span>
            </div>
         </div>

         <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Calls Processed</h4>
            <div className="text-4xl font-extrabold text-blue-600">
               {stats.totalCalls}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Violations Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
           <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
             <TrendingDown className="w-5 h-5 text-red-500" />
             Top Compliance Violations
           </h3>
           <div className="space-y-4">
             {(stats.topViolations || []).map((v, idx) => (
               <div key={idx}>
                 <div className="flex justify-between text-sm mb-1">
                   <span className="font-medium text-slate-700">"{v.phrase}"</span>
                   <span className="text-slate-500">{v.count} occurrences</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-red-500 h-2.5 rounded-full" 
                      style={{ width: `${stats.totalCalls > 0 ? (v.count / stats.totalCalls) * 100 : 0}%` }}
                    ></div>
                 </div>
               </div>
             ))}
             {(!stats.topViolations || stats.topViolations.length === 0) && (
               <div className="text-center text-slate-400 py-4 text-sm italic">No violations detected.</div>
             )}
           </div>
        </div>

        {/* Training Opportunities */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
             <AlertOctagon className="w-5 h-5 text-orange-500" />
             Training Needed
           </h3>
           <div className="space-y-4">
             {(stats.lowestPerformingReps || []).map((rep, idx) => (
               <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                 <span className="font-bold text-slate-700 text-sm">{rep.name}</span>
                 <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                   Avg Score: {rep.avgScore}
                 </span>
               </div>
             ))}
             {(!stats.lowestPerformingReps || stats.lowestPerformingReps.length === 0) && (
                <div className="text-center text-slate-400 py-4 text-sm italic">No low performing reps.</div>
             )}
             <button className="w-full mt-4 py-2 text-xs font-bold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
               Assign Coaching Modules
             </button>
           </div>
        </div>
      </div>

      {/* Audit List */}
      <CallAuditTable calls={calls} />
    </div>
  );
};
