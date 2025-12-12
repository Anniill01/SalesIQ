
import React, { useEffect, useState } from 'react';
import { getAllCalls, deleteCall, updateCall, seedDemoCalls } from '../../services/storageService';
import { SavedCall } from '../../types';
import { Play, Trash2, Calendar, User, Search, FileText, Star, DownloadCloud } from 'lucide-react';

interface CallLibraryProps {
  onLoadCall: (call: SavedCall) => void;
}

export const CallLibrary: React.FC<CallLibraryProps> = ({ onLoadCall }) => {
  const [calls, setCalls] = useState<SavedCall[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    const data = await getAllCalls();
    setCalls(data.sort((a, b) => b.dateSaved - a.dateSaved));
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this call from the vault?")) {
      await deleteCall(id);
      loadLibrary();
    }
  };

  const toggleExemplar = async (e: React.MouseEvent, id: string, currentStatus?: boolean) => {
    e.stopPropagation();
    await updateCall(id, { isExemplar: !currentStatus });
    loadLibrary();
  };

  const handleSeedData = async () => {
      await seedDemoCalls();
      loadLibrary();
  };

  const filteredCalls = calls.filter(c => 
    c.fileName.toLowerCase().includes(search.toLowerCase()) || 
    c.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Call Vault</h1>
          <p className="text-slate-500">Local saved library of your past coaching sessions.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search calls..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
          />
        </div>
      </div>

      {filteredCalls.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center">
          <FileText className="w-16 h-16 text-slate-200 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">Your Vault is Empty</h3>
          <p className="text-slate-500 mb-6 max-w-sm">Analyze a call in the "Coach" tab and click save, or load some demo data to see how it looks.</p>
          <button 
            onClick={handleSeedData}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-6 py-2.5 rounded-lg font-bold transition-colors"
          >
            <DownloadCloud className="w-5 h-5" />
            Load Demo Data
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCalls.map(call => (
            <div 
              key={call.id}
              onClick={() => onLoadCall(call)}
              className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col relative ${call.isExemplar ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200'}`}
            >
              {call.isExemplar && (
                <div className="absolute top-0 right-0 bg-amber-100 text-amber-600 px-2 py-1 rounded-bl-lg rounded-tr-lg text-[10px] font-bold flex items-center gap-1 z-10">
                   <Star className="w-3 h-3 fill-current" /> Exemplar
                </div>
              )}

              <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-3">
                   <div className="bg-blue-50 text-blue-700 p-2 rounded-lg">
                      <Play className="w-5 h-5" />
                   </div>
                   <div className="flex gap-1">
                      <button 
                         onClick={(e) => toggleExemplar(e, call.id, call.isExemplar)}
                         className={`p-1.5 rounded transition-colors ${call.isExemplar ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50'}`}
                         title={call.isExemplar ? "Remove Exemplar" : "Mark as Best Call"}
                       >
                         <Star className={`w-4 h-4 ${call.isExemplar ? 'fill-current' : ''}`} />
                       </button>
                       <button 
                         onClick={(e) => handleDelete(e, call.id)}
                         className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded hover:bg-red-50"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                   </div>
                </div>
                <h3 className="font-bold text-slate-800 mb-1 truncate" title={call.fileName}>{call.fileName}</h3>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(call.dateSaved).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {call.analysisData.dealIntelligence.buyingCommittee[0]?.nameOrReference || 'Unknown'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                  {call.summary}
                </p>
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-100 rounded-b-xl flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Call Score</span>
                  <span className={`text-lg font-extrabold ${call.stats.callScore >= 70 ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {call.stats.callScore}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Risk</span>
                  <span className="text-sm font-bold text-slate-700">
                    {call.analysisData.dealIntelligence.riskAnalysis.riskLevel}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
