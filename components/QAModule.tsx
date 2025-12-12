
import React, { useState } from 'react';
import { BulkUpload } from './compliance/BulkUpload';
import { QADashboard } from './compliance/QADashboard';
import { PhraseLibrary } from './compliance/PhraseLibrary';
import { generateMockBatchData, getMockRules } from '../services/mockComplianceService';
import { QABatchStats, QACallRecord, ComplianceRule } from '../types';
import { Download, BarChart3, BookOpen, Upload, ChevronDown, FileText, FileSpreadsheet, Database, Check } from 'lucide-react';
import { exportQABatchReport } from '../services/exportService';

export const QAModule: React.FC = () => {
  const [view, setView] = useState<'UPLOAD' | 'DASHBOARD' | 'LIBRARY'>('UPLOAD');
  const [batchStats, setBatchStats] = useState<QABatchStats | null>(null);
  const [batchCalls, setBatchCalls] = useState<QACallRecord[]>([]);
  const [rules, setRules] = useState<ComplianceRule[]>(getMockRules());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  const handleUploadComplete = (files: File[]) => {
    const { calls, stats } = generateMockBatchData(files);
    setBatchCalls(calls);
    setBatchStats(stats);
    setView('DASHBOARD');
    setIsSynced(false);
  };

  const handleExport = (format: 'CSV' | 'PDF') => {
    if (batchStats && batchCalls.length > 0) {
      exportQABatchReport(batchStats, batchCalls, format);
      setShowExportMenu(false);
    }
  };

  const handleCRMSync = () => {
    // Mock sync
    const btn = document.getElementById('qa-sync-btn');
    if (btn) btn.innerText = 'Syncing...';
    setTimeout(() => {
        setIsSynced(true);
    }, 1500);
  };

  const handleUpdateRules = (updatedRules: ComplianceRule[]) => {
    setRules(updatedRules);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Compliance & QA Scanner</h1>
          <p className="text-slate-500">Automated audit for risk, scripts, and quality control.</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
             <button 
               onClick={() => setView('UPLOAD')}
               className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'UPLOAD' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <Upload className="w-4 h-4" /> New Batch
             </button>
             <button 
               onClick={() => setView('DASHBOARD')}
               disabled={!batchStats}
               className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'DASHBOARD' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'}`}
             >
               <BarChart3 className="w-4 h-4" /> Dashboard
             </button>
             <button 
               onClick={() => setView('LIBRARY')}
               className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'LIBRARY' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <BookOpen className="w-4 h-4" /> Rule Library
             </button>
        </div>

        {view === 'DASHBOARD' && (
          <div className="flex items-center gap-2">
            <button 
                id="qa-sync-btn"
                onClick={handleCRMSync}
                disabled={isSynced}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-sm text-sm transition-all
                  ${isSynced 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-default' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600'}
                `}
            >
                {isSynced ? <Check className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                {isSynced ? 'Synced to CRM' : 'Push to CRM'}
            </button>

            <div className="relative">
                <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold px-4 py-2 rounded-lg transition-colors shadow-sm text-sm"
                >
                <Download className="w-4 h-4" /> Export <ChevronDown className="w-3 h-3" />
                </button>
                {showExportMenu && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <button 
                    onClick={() => handleExport('CSV')}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel / CSV
                    </button>
                    <button 
                    onClick={() => handleExport('PDF')}
                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                    <FileText className="w-4 h-4 text-red-600" /> PDF Report
                    </button>
                </div>
                )}
            </div>
          </div>
        )}
      </div>

      <div className="min-h-[600px]">
        {view === 'UPLOAD' && <BulkUpload onUploadComplete={handleUploadComplete} />}
        {view === 'DASHBOARD' && batchStats && <QADashboard stats={batchStats} calls={batchCalls} />}
        {view === 'LIBRARY' && <PhraseLibrary rules={rules} onUpdateRules={handleUpdateRules} />}
      </div>
    </div>
  );
};
