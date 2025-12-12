
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Topic, Competitor } from '../types';
import { FileText, X, Swords, ChevronRight, Shield } from 'lucide-react';

interface TopicsChartProps {
  topics: Topic[];
  competitors?: Competitor[];
  onTopicClick: (topicName: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border border-slate-200 shadow-lg rounded-xl max-w-xs z-50">
        <p className="font-bold text-slate-800 mb-1">{data.name}</p>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${data.relevance}%` }}></div>
          </div>
          <p className="text-xs text-blue-600 font-semibold">{data.relevance}%</p>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{data.description}</p>
      </div>
    );
  }
  return null;
};

export const TopicsChart: React.FC<TopicsChartProps> = ({ topics, competitors, onTopicClick }) => {
  const [showSummary, setShowSummary] = useState(false);
  const [expandedCompetitor, setExpandedCompetitor] = useState<number | null>(null);
  
  // Sort topics by relevance for better visualization
  const sortedTopics = topics ? [...topics].sort((a, b) => b.relevance - a.relevance) : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full flex flex-col relative w-full">
      <div className="mb-4 flex justify-between items-start">
        <div>
           <h3 className="text-lg font-bold text-slate-800">Key Topics Detected</h3>
           <p className="text-sm text-slate-500">Relevance and time spent on subjects.</p>
        </div>
        <button 
          onClick={() => setShowSummary(true)}
          disabled={sortedTopics.length === 0}
          className="text-xs flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          <FileText className="w-3.5 h-3.5" />
          Summary
        </button>
      </div>
      
      {/* Explicit height container to fix Recharts in flex/grid layouts */}
      <div style={{ width: '100%', height: '300px' }}>
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
                  const label = topic ? `${topic.name} (${topic.relevance}%)` : payload.value;
                  return (
                    <text 
                      x={x} 
                      y={y} 
                      dy={4} 
                      textAnchor="end" 
                      fill="#64748b" 
                      fontSize={11} 
                      fontWeight={500}
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
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar 
                dataKey="relevance" 
                radius={[0, 4, 4, 0]} 
                barSize={24}
                onClick={(data) => onTopicClick(data.name)}
                style={{ cursor: 'pointer' }}
              >
                {sortedTopics.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} 
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No topics detected.
          </div>
        )}
      </div>
      
      {/* Competitors Battlecards */}
      {competitors && competitors.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-100 flex-grow">
          <div className="flex items-center gap-2 mb-4">
             <div className="p-1.5 bg-rose-50 rounded-lg">
                <Swords className="w-4 h-4 text-rose-500" />
             </div>
             <h4 className="text-sm font-bold text-slate-700">Competitor Battlecards</h4>
          </div>
          <div className="space-y-3">
            {competitors.map((comp, idx) => (
              <div 
                key={idx} 
                className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden transition-all"
              >
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-100"
                  onClick={() => setExpandedCompetitor(expandedCompetitor === idx ? null : idx)}
                >
                   <div className="flex items-center gap-2">
                     <span className="font-medium text-slate-700">{comp.name}</span>
                     <span className="bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                       {comp.mentionCount}x
                     </span>
                   </div>
                   <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedCompetitor === idx ? 'rotate-90' : ''}`} />
                </div>
                
                {/* Expanded Battlecard Details */}
                {expandedCompetitor === idx && (
                   <div className="p-3 bg-white border-t border-slate-200 text-xs animate-fade-in">
                      <div className="mb-2">
                         <p className="font-bold text-slate-500 uppercase text-[10px] mb-1">Context</p>
                         <p className="text-slate-700 italic">"{comp.context}"</p>
                      </div>
                      {comp.suggestedRebuttal && (
                        <div className="bg-rose-50 p-2 rounded border border-rose-100">
                           <div className="flex items-center gap-1.5 mb-1 text-rose-700 font-bold">
                              <Shield className="w-3 h-3" />
                              <span>AI Rebuttal</span>
                           </div>
                           <p className="text-slate-700">{comp.suggestedRebuttal}</p>
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
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 rounded-xl p-6 flex flex-col animate-fade-in">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Topics Summary
            </h3>
            <button 
              onClick={() => setShowSummary(false)}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto custom-scrollbar flex-grow space-y-4 pr-2">
            {sortedTopics.map((topic, idx) => (
              <div key={idx} className="group border-b border-slate-50 last:border-0 pb-4 last:pb-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-semibold text-sm text-slate-800 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    {topic.name}
                  </span>
                  <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{topic.relevance}%</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pl-4">{topic.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
