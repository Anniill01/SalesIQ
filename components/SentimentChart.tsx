
import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { SentimentPoint } from '../types';
import { Activity } from 'lucide-react';

interface SentimentChartProps {
  data: SentimentPoint[];
  highlightedTime?: number | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border border-slate-200 shadow-lg rounded-xl max-w-xs z-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{data.label}</span>
          <span className={`text-sm font-bold ${data.score >= 50 ? 'text-blue-600' : 'text-slate-600'}`}>
            Score: {Math.round(data.score)}
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          {data.insight}
        </p>
      </div>
    );
  }
  return null;
};

export const SentimentChart: React.FC<SentimentChartProps> = ({ data, highlightedTime }) => {
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // 1. Sort by time to ensure line draws correctly from left to right
    let sorted = [...data].sort((a, b) => a.timeOffset - b.timeOffset);
    
    // 2. Normalize scores if they appear to be 0-1 instead of 0-100.
    // This fixes the issue where charts look flat if the AI returns decimal percentages.
    const maxScore = Math.max(...sorted.map(d => d.score));
    if (maxScore > 0 && maxScore <= 1) {
       sorted = sorted.map(d => ({ ...d, score: d.score * 100 }));
    }

    // 3. Ensure types are correct
    return sorted.map(d => ({
        ...d,
        score: Number(d.score),
        timeOffset: Number(d.timeOffset)
    }));
  }, [data]);

  if (processedData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full flex flex-col items-center justify-center text-slate-400">
        <Activity className="w-12 h-12 mb-3 opacity-20" />
        <p>No sentiment data available for this call.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full flex flex-col w-full">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">Engagement & Sentiment Flow</h3>
        <p className="text-sm text-slate-500">Tracking conversation positivity and interest over time. Hover for insights.</p>
      </div>
      
      {/* Explicit height container to fix Recharts in flex/grid layouts */}
      <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer>
          <AreaChart data={processedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="timeOffset" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              dy={10}
              tickFormatter={(val) => {
                const minutes = Math.floor(val / 60);
                const seconds = Math.floor(val % 60);
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
              }}
              minTickGap={30}
              type="number"
              domain={['dataMin', 'dataMax']}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b' }} 
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#2563eb" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorScoreGradient)" 
              isAnimationActive={true}
              animationDuration={1500}
            />
            {highlightedTime !== undefined && highlightedTime !== null && (
              <ReferenceLine 
                x={highlightedTime} 
                stroke="#ef4444" 
                strokeWidth={2}
                label={{ position: 'top', value: 'Playing', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} 
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
