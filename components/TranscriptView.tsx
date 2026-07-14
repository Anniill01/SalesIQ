
import React, { useState, useEffect, useRef } from 'react';
import { TranscriptSegment } from '../types';
import { User, Headphones, Search, AlertTriangle, Filter, Play, Volume2, AlertCircle, Lightbulb, MessageSquare, LayoutList, AlignLeft, Download } from 'lucide-react';
import { downloadScript } from '../services/exportService';

interface TranscriptViewProps {
  transcript: TranscriptSegment[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onTimestampClick: (timeInSeconds: number) => void;
  currentAudioTime: number | null; // For syncing with audio player
}

type FilterType = 'All' | 'Salesperson' | 'Prospect' | 'Objections';
type ViewMode = 'TABLE' | 'CHAT';

export const TranscriptView: React.FC<TranscriptViewProps> = ({ 
  transcript, 
  searchTerm, 
  onSearchChange,
  onTimestampClick,
  currentAudioTime
}) => {
  const [filterType, setFilterType] = useState<FilterType>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE');
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLTableRowElement | HTMLDivElement>(null);

  const handleDownload = () => {
    const text = transcript.map(s => `[${s.timestamp}] ${s.speaker}: ${s.text}`).join('\n');
    downloadScript(text, 'Call_Transcript.txt');
  };

  const filteredTranscript = transcript.filter(segment => {
    const matchesSearch = segment.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          segment.speaker.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filterType === 'Salesperson') matchesFilter = segment.speaker === 'Salesperson';
    if (filterType === 'Prospect') matchesFilter = segment.speaker === 'Prospect';
    if (filterType === 'Objections') matchesFilter = segment.isObjection === true;

    return matchesSearch && matchesFilter;
  });

  // Helper to highlight search term matches with distinct colors
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="rounded-sm px-0.5 bg-yellow-200 text-slate-900 font-semibold">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  // Helper to parse MM:SS to seconds
  const parseTimestamp = (timestamp: string): number => {
    const parts = timestamp.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
  };

  // Determine active segment index based on current audio time
  const activeSegmentIndex = currentAudioTime !== null 
    ? transcript.findIndex((seg, idx) => {
        const time = parseTimestamp(seg.timestamp);
        const nextTime = transcript[idx + 1] ? parseTimestamp(transcript[idx + 1].timestamp) : Infinity;
        return currentAudioTime >= time && currentAudioTime < nextTime;
      })
    : -1;

  // Auto-scroll to active row/bubble
  useEffect(() => {
    if (activeSegmentIndex !== -1 && activeRowRef.current && !searchTerm) {
      activeRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeSegmentIndex, searchTerm]);

  // --- Render Functions ---

  const renderTable = () => (
    <table className="w-full text-left border-collapse">
      <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
        <tr>
          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-16">Play</th>
          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Time</th>
          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Speaker</th>
          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Message</th>
          <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-64">Analysis</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {filteredTranscript.map((segment, index) => {
          const isSales = segment.speaker === 'Salesperson';
          const originalIndex = transcript.indexOf(segment);
          const isActive = originalIndex === activeSegmentIndex;
          const isObjection = segment.isObjection;

          return (
            <tr 
              key={index} 
              ref={isActive ? activeRowRef as React.RefObject<HTMLTableRowElement> : null}
              className={`
                group transition-colors duration-200 hover:bg-slate-50
                ${isActive ? 'bg-blue-50/60' : ''}
                ${isObjection ? 'bg-red-50/30' : ''}
              `}
            >
              {/* Play Button */}
              <td className="px-6 py-4 whitespace-nowrap">
                  <button 
                    onClick={() => onTimestampClick(parseTimestamp(segment.timestamp))}
                    className={`
                      p-2 rounded-full transition-all
                      ${isActive 
                        ? 'bg-blue-600 text-white shadow-md scale-110' 
                        : 'bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600 group-hover:scale-110'}
                    `}
                  >
                    {isActive ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
              </td>

              {/* Timestamp */}
              <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                {segment.timestamp}
              </td>

              {/* Speaker Badge */}
              <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
                    ${isSales 
                      ? 'bg-blue-50 text-blue-700 border-blue-100' 
                      : 'bg-slate-100 text-slate-700 border-slate-200'}
                  `}>
                    {isSales ? <Headphones className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {segment.speaker}
                  </span>
              </td>

              {/* Transcript Text */}
              <td className="px-6 py-4">
                <div className={`text-sm leading-relaxed ${isObjection ? 'font-medium text-slate-800' : 'text-slate-600'}`}>
                  {highlightText(segment.text, searchTerm)}
                </div>
              </td>

              {/* Analysis / Objection Column */}
              <td className="px-6 py-4 align-top">
                {isObjection && segment.objectionHandlingFeedback ? (
                  <div className="bg-white border border-red-100 rounded-lg p-3 shadow-sm min-w-[240px]">
                      <div className="flex items-center gap-1.5 mb-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Objection Analysis</span>
                      </div>
                      <p className="text-xs text-slate-600 italic leading-relaxed mb-2">
                        "{segment.objectionHandlingFeedback}"
                      </p>
                      <div className="flex items-start gap-1.5 text-emerald-600 bg-emerald-50 p-2 rounded border border-emerald-100">
                        <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span className="text-[10px] font-semibold leading-tight">Review coaching card for better response.</span>
                      </div>
                  </div>
                ) : (
                    <span className="text-xs text-slate-300">-</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderChat = () => (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-full">
      {filteredTranscript.map((segment, index) => {
        const isSales = segment.speaker === 'Salesperson';
        const originalIndex = transcript.indexOf(segment);
        const isActive = originalIndex === activeSegmentIndex;
        const isObjection = segment.isObjection;

        return (
          <div 
            key={index}
            ref={isActive ? activeRowRef as React.RefObject<HTMLDivElement> : null}
            className={`flex flex-col ${isSales ? 'items-end' : 'items-start'}`}
          >
            <div className={`flex items-end gap-2 max-w-[80%] ${isSales ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar Circle */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs shadow-sm border
                ${isSales ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-600 border-slate-200'}
              `}>
                 {isSales ? <Headphones className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div 
                onClick={() => onTimestampClick(parseTimestamp(segment.timestamp))}
                className={`
                  relative px-4 py-3 shadow-sm cursor-pointer transition-all hover:shadow-md
                  ${isSales ? 'rounded-2xl rounded-tr-none' : 'rounded-2xl rounded-tl-none'}
                  ${isObjection 
                    ? 'bg-red-50 text-red-900 border border-red-200 ring-2 ring-red-400 ring-offset-1 font-medium' 
                    : isSales 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-slate-800 border border-slate-200'
                  }
                  ${isActive && !isObjection ? 'ring-2 ring-offset-2 ring-blue-400' : ''}
                `}
              >
                 {/* Objection Alert Icon */}
                 {isObjection && (
                    <div className="absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full shadow-md border-2 border-white">
                       <AlertCircle className="w-3 h-3" />
                    </div>
                 )}

                 <p className="text-sm leading-relaxed">
                    {highlightText(segment.text, searchTerm)}
                 </p>
              </div>

              {/* Time */}
              <span className="text-[10px] text-slate-400 font-mono mb-1">
                {segment.timestamp}
              </span>
            </div>

            {/* Objection Analysis Box (Inline) */}
            {isObjection && segment.objectionHandlingFeedback && (
              <div className={`
                 mt-2 max-w-[70%] p-3 rounded-xl border border-red-100 bg-red-50/50 shadow-sm
                 ${isSales ? 'mr-10' : 'ml-10'}
              `}>
                <div className="flex items-center gap-1.5 mb-1 text-red-700">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase">Coach's Analysis</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{segment.objectionHandlingFeedback}"
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[600px] flex flex-col">
      {/* Header Controls */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Call Transcript</h3>
          <p className="text-sm text-slate-500">
            {filteredTranscript.length} segments found
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
           <button 
             onClick={handleDownload}
             className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors rounded-lg flex items-center gap-2 text-xs font-bold bg-white border border-slate-200"
             title="Download Transcript as .txt"
           >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline">Download</span>
           </button>

           {/* View Toggle */}
           <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
             <button 
               onClick={() => setViewMode('TABLE')}
               className={`p-1.5 rounded-md transition-all ${viewMode === 'TABLE' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
               title="Data Grid View"
             >
               <LayoutList className="w-4 h-4" />
             </button>
             <button 
               onClick={() => setViewMode('CHAT')}
               className={`p-1.5 rounded-md transition-all ${viewMode === 'CHAT' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
               title="Chat Messenger View"
             >
               <MessageSquare className="w-4 h-4" />
             </button>
           </div>

          {/* Filter Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
             {['All', 'Salesperson', 'Prospect', 'Objections'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type as FilterType)}
                  className={`
                    px-3 py-1.5 text-xs font-bold rounded-md transition-all
                    ${filterType === type 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                  `}
                >
                  {type === 'Objections' ? <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Objections</span> : type}
                </button>
             ))}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Search className="h-4 w-4 text-slate-400" />
             </div>
             <input
               type="text"
               className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
               placeholder="Search transcript..."
               value={searchTerm}
               onChange={(e) => onSearchChange(e.target.value)}
             />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow overflow-auto custom-scrollbar relative">
        {filteredTranscript.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Search className="w-12 h-12 mb-3 opacity-20" />
              <p>No results found for your filters</p>
           </div>
        ) : (
          viewMode === 'TABLE' ? renderTable() : renderChat()
        )}
      </div>
    </div>
  );
};
