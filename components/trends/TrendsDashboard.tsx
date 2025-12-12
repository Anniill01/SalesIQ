
import React, { useEffect, useState } from 'react';
import { getAllCalls, seedDemoCalls } from '../../services/storageService';
import { SavedCall } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Award, AlertOctagon, Users, Crown, DownloadCloud } from 'lucide-react';

export const TrendsDashboard: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [averages, setAverages] = useState({ score: 0, talkRatio: 0, patience: 0 });
  const [viewMode, setViewMode] = useState<'PERSONAL' | 'TEAM'>('PERSONAL');

  const loadData = async () => {
    const calls = await getAllCalls();
    // Sort by date ascending
    const sorted = calls.sort((a, b) => a.dateSaved - b.dateSaved);
    
    const chartData = sorted.map(c => ({
      date: new Date(c.dateSaved).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: c.stats.callScore,
      talkRatio: c.analysisData.talkRatio.sales,
      patience: c.stats.patienceScore
    }));

    setData(chartData);

    if (calls.length > 0) {
      setAverages({
        score: Math.round(calls.reduce((acc, c) => acc + c.stats.callScore, 0) / calls.length),
        talkRatio: Math.round(calls.reduce((acc, c) => acc + c.analysisData.talkRatio.sales, 0) / calls.length),
        patience: Math.round(calls.reduce((acc, c) => acc + c.stats.patienceScore, 0) / calls.length)
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedData = async () => {
    await seedDemoCalls();
    loadData();
  };

  const renderTeamLeaderboard = () => {
    // Mock Data for Team
    const teamData = [
      { name: 'You', score: averages.score || 78, closings: 12, ratio: averages.talkRatio || 48 },
      { name: 'Sarah J.', score: 92, closings: 18, ratio: 44 },
      { name: 'Mike C.', score: 85, closings: 15, ratio: 52 },
      { name: 'David M.', score: 81, closings: 14, ratio: 46 },
      { name: 'Jessica W.', score: 76, closings: 10, ratio: 60 },
    ].sort((a, b) => b.score - a.score);

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
         <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" /> Team Leaderboard
            </h3>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">This Month</span>
         </div>
         <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
           <div className="col-span-1">Rank</div>
           <div className="col-span-4">Rep Name</div>
           <div className="col-span-3 text-center">Avg Score</div>
           <div className="col-span-2 text-center">Talk Ratio</div>
           <div className="col-span-2 text-right">Est. Closes</div>
         </div>
         <div className="divide-y divide-slate-100">
           {teamData.map((rep, idx) => (
             <div key={idx} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center ${rep.name === 'You' ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                <div className="col-span-1 font-bold text-slate-400">#{idx + 1}</div>
                <div className="col-span-4 font-bold text-slate-700 flex items-center gap-2">
                   {idx === 0 && <Crown className="w-3 h-3 text-amber-400" />}
                   {rep.name}
                   {rep.name === 'You' && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Me</span>}
                </div>
                <div className="col-span-3 text-center">
                  <span className={`font-bold ${rep.score >= 85 ? 'text-emerald-500' : rep.score >= 75 ? 'text-blue-500' : 'text-amber-500'}`}>{rep.score}</span>
                </div>
                <div className="col-span-2 text-center text-slate-600 text-sm">{rep.ratio}%</div>
                <div className="col-span-2 text-right font-bold text-slate-800">{rep.closings}</div>
             </div>
           ))}
         </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Performance Trends</h1>
            <p className="text-slate-500">Analysis of sales performance and team benchmarks.</p>
          </div>
          <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
             <button 
               onClick={() => setViewMode('PERSONAL')}
               className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'PERSONAL' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Personal Stats
             </button>
             <button 
               onClick={() => setViewMode('TEAM')}
               className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'TEAM' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Team Benchmarks
             </button>
          </div>
        </div>

        {viewMode === 'TEAM' ? renderTeamLeaderboard() : (
          <>
            {(data.length === 0) ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 bg-white rounded-xl border border-slate-200">
                <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-slate-600">No trend data yet</h3>
                <p className="mb-6 max-w-sm text-center">Save calls to your library to generate performance insights, or load demo data to see how it looks.</p>
                <button 
                  onClick={handleSeedData}
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-6 py-2.5 rounded-lg font-bold transition-colors"
                >
                  <DownloadCloud className="w-5 h-5" />
                  Load Demo Data
                </button>
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Call Score</p>
                        <p className="text-3xl font-extrabold text-slate-800 mt-1">{averages.score}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                        <Award className="w-6 h-6" />
                      </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Talk Ratio</p>
                        <p className="text-3xl font-extrabold text-slate-800 mt-1">{averages.talkRatio}%</p>
                      </div>
                      <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Patience</p>
                        <p className="text-3xl font-extrabold text-slate-800 mt-1">{averages.patience}</p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                        <AlertOctagon className="w-6 h-6" />
                      </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-4">Score Progression</h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                              <Tooltip />
                              <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                            </LineChart>
                        </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-4">Talk Ratio vs Patience</h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                              <Tooltip />
                              <Line type="monotone" dataKey="talkRatio" name="Talk Ratio" stroke="#8b5cf6" strokeWidth={2} />
                              <Line type="monotone" dataKey="patience" name="Patience" stroke="#10b981" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                      </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
    </div>
  );
};
