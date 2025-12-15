
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Topic, Competitor } from '../types';
import { FileText, X, Swords, ChevronRight, Shield, Zap, Sparkles } from 'lucide-react';

interface TopicsChartProps {
  topics: Topic[];
  competitors?: Competitor[];
  onTopicClick: (topicName: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 text-white p-4 border border-slate-700 shadow-xl rounded-xl max-w-xs z-50 animate-fade-in">
        <p className="font-bold text-white mb-2 flex items-center gap-2">
           <Zap className="w-3 h-3 text-yellow-400" /> {data.name}
        </p>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 bg-slate-600 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400" style={{ width: `${data.relevance}%` }}></div>
          </div>
          <p className="text-xs text-blue-300 font-mono font-bold">{data.relevance}%</p>
        </div>
        <p className="text-[10px] text-slate-300 leading-relaxed opacity-90">{data.description}</p>
      </div>
    );
  }
  return null;
};

export const TopicsChart: React.FC<TopicsChartProps> = ({ topics, competitors, onTopicClick }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [expandedCompetitor, setExpandedCompetitor] = useState<number | null>(null);
  
  // Sort topics by relevance for better visualization and normalize percentages
  const sortedTopics = topics ? [...topics].map(t => ({
    ...t,
    relevance: (t.relevance > 0 && t.relevance <= 1) ? Math.round(t.relevance * 100) : Math.round(t.relevance)
  })).sort((a, b) => b.relevance - a.relevance) : [];

  const barColors = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full flex flex-col relative w-full overflow-hidden">
      <div className="mb-4 flex justify-between items-start">
        <div>
           <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <Sparkles className="w-5 h-5 text-blue-500" /> Key Topics Detected
           </h3>
           <p className="text-sm text-slate-500">Breakdown of conversation focus areas.</p>
        </div>
        <button 
          onClick={() => setShowSummary(true)}
          disabled={sortedTopics.length === 0}
          className="text-xs flex items-center gap-1.5 text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full transition-all font-bold disabled:opacity-50"
        >
          <FileText className="w-3.5 h-3.5" />
          View Summary
        </button>
      </div>
      
      {/* Explicit height container to fix Recharts in flex/grid layouts */}
      <div style={{ width: '100%', height: '300px' }} className="mt-2">
        {sortedTopics.length > 0 ? (
          <ResponsiveContainer>
            <BarChart 
              data={sortedTopics} 
              layout="vertical" 
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={140} 
                tick={({ x, y, payload }) => {
                  const topic = sortedTopics.find(t => t.name === payload.value);
                  const label = topic ? `${topic.name}` : payload.value;
                  return (
                    <text 
                      x={x} 
                      y={y} 
                      dy={4} 
                      textAnchor="end" 
                      fill="#475569" 
                      fontSize={11} 
                      fontWeight={600}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onTopicClick(payload.value)}
                    >
                      {label}
                    </text>
                  );
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', radius: 4 }} />
              <Bar 
                dataKey="relevance" 
                radius={[0, 6, 6, 0]} 
                barSize={20}
                onClick={(data) => onTopicClick(data.name)}
                style={{ cursor: 'pointer' }}
              >
                {sortedTopics.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={barColors[index % barColors.length]} 
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No topics detected.
          </div>
        )}
      </div>
      
      {/* Competitors Battlecards */}
      {competitors && competitors.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-100 flex-grow">
          <div className="flex items-center gap-2 mb-4">
             <div className="p-1.5 bg-rose-100 rounded-lg">
                <Swords className="w-4 h-4 text-rose-600" />
             </div>
             <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Competitor Battlecards</h4>
          </div>
          <div className="space-y-3">
            {competitors.map((comp, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md hover:border-rose-200"
              >
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer bg-slate-50/50"
                  onClick={() => setExpandedCompetitor(expandedCompetitor === idx ? null : idx)}
                >
                   <div className="flex items-center gap-2">
                     <span className="font-bold text-slate-700 text-sm">{comp.name}</span>
                     <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-100">
                       {comp.mentionCount} Mentions
                     </span>
                   </div>
                   <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedCompetitor === idx ? 'rotate-90' : ''}`} />
                </div>
                
                {/* Expanded Battlecard Details */}
                {expandedCompetitor === idx && (
                   <div className="p-4 bg-white border-t border-slate-100 text-xs animate-fade-in">
                      <div className="mb-3">
                         <p className="font-bold text-slate-400 uppercase text-[10px] mb-1 flex items-center gap-1">
                           <FileText className="w-3 h-3" /> Context
                         </p>
                         <p className="text-slate-700 italic bg-slate-50 p-2 rounded border border-slate-100">"{comp.context}"</p>
                      </div>
                      {comp.suggestedRebuttal && (
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                           <div className="flex items-center gap-1.5 mb-1 text-indigo-700 font-bold uppercase text-[10px]">
                              <Shield className="w-3 h-3" />
                              <span>AI Rebuttal</span>
                           </div>
                           <p className="text-slate-700 font-medium leading-relaxed">{comp.suggestedRebuttal}</p>
                        </div>
                      )}
                   </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topics Summary Modal */}
      {showSummary && (
        <div className="absolute inset-0 bg-white z-50 p-0 flex flex-col animate-fade-in">
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Topics Summary
            </h3>
            <button 
              onClick={() => setShowSummary(false)}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto custom-scrollbar flex-grow p-6 space-y-4">
            {sortedTopics.map((topic, idx) => (
              <div key={idx} className="group p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: barColors[idx % barColors.length] }}></span>
                    {topic.name}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{topic.relevance}%</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-4 border-l-2 border-slate-100">{topic.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
