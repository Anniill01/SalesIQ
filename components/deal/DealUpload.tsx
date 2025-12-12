
import React, { useRef, useState } from 'react';
import { UploadCloud, FileAudio, FileText, Image, StickyNote, Plus, X, ArrowRight, Loader2, Briefcase, PlayCircle } from 'lucide-react';
import { DealInteraction } from '../../types';

interface DealUploadProps {
  onAnalyze: (interactions: DealInteraction[]) => void;
  isAnalyzing: boolean;
  onLoadDemo: () => void;
}

export const DealUpload: React.FC<DealUploadProps> = ({ onAnalyze, isAnalyzing, onLoadDemo }) => {
  const [interactions, setInteractions] = useState<DealInteraction[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [activeTab, setActiveTab] = useState<'FILES' | 'NOTE'>('FILES');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file: File) => {
        let type: DealInteraction['type'] = 'PDF';
        if (file.type.includes('audio')) type = 'Audio';
        else if (file.type.includes('image')) type = 'Image';
        
        return {
          id: Math.random().toString(36).substr(2, 9),
          type,
          fileName: file.name,
          file,
          date: new Date().toISOString()
        } as DealInteraction;
      });
      setInteractions([...interactions, ...newFiles]);
    }
  };

  const addNote = () => {
    if (!noteInput.trim()) return;
    setInteractions([...interactions, {
      id: Math.random().toString(36).substr(2, 9),
      type: 'Note',
      fileName: 'Sales Note / Email',
      content: noteInput,
      date: new Date().toISOString()
    }]);
    setNoteInput('');
  };

  const removeInteraction = (id: string) => {
    setInteractions(interactions.filter(i => i.id !== id));
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'Audio': return <FileAudio className="w-5 h-5 text-purple-500" />;
      case 'Image': return <Image className="w-5 h-5 text-blue-500" />;
      case 'Note': return <StickyNote className="w-5 h-5 text-yellow-500" />;
      default: return <FileText className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl mx-auto mt-10">
      <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-indigo-100 rounded-xl">
             <Briefcase className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Customer 360 Deal Analyzer</h2>
            <p className="text-slate-500">Upload calls, emails, proposals, and notes to get a holistic view of the deal.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* LEFT: Upload Area */}
        <div className="p-8 border-r border-slate-100">
           <div className="flex gap-4 mb-6">
             <button 
               onClick={() => setActiveTab('FILES')}
               className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'FILES' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
             >
               Upload Files
             </button>
             <button 
               onClick={() => setActiveTab('NOTE')}
               className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'NOTE' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
             >
               Paste Text / Notes
             </button>
           </div>

           {activeTab === 'FILES' ? (
             <div 
               onClick={() => !isAnalyzing && fileInputRef.current?.click()}
               className={`border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer transition-colors ${isAnalyzing ? 'bg-slate-50 border-slate-200 cursor-wait' : 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-400'}`}
             >
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 multiple 
                 accept="audio/*,application/pdf,image/*,text/plain" 
                 onChange={handleFileChange}
                 disabled={isAnalyzing} 
               />
               <UploadCloud className="w-10 h-10 text-indigo-400 mb-3" />
               <p className="font-bold text-slate-600">Click to upload documents</p>
               <p className="text-xs text-slate-400 mt-1">Audio, PDF, Images supported</p>
             </div>
           ) : (
             <div className="h-64 flex flex-col">
               <textarea 
                 value={noteInput}
                 onChange={(e) => setNoteInput(e.target.value)}
                 className="flex-grow p-4 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                 placeholder="Paste email thread, CRM notes, or meeting summary here..."
               />
               <button 
                 onClick={addNote}
                 disabled={!noteInput.trim()}
                 className="mt-3 bg-slate-800 text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-900 disabled:opacity-50"
               >
                 Add Note
               </button>
             </div>
           )}
        </div>

        {/* RIGHT: Staging Area */}
        <div className="p-8 bg-slate-50/50 flex flex-col">
          <h3 className="font-bold text-slate-700 mb-4 flex justify-between items-center">
            Deal Artifacts <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">{interactions.length}</span>
          </h3>
          
          <div className="flex-grow overflow-y-auto space-y-3 mb-6 pr-2 max-h-[300px] custom-scrollbar">
            {interactions.length === 0 ? (
              <div className="text-center text-slate-400 py-10 italic text-sm">
                No items added yet.
              </div>
            ) : (
              interactions.map(item => (
                <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex-shrink-0 bg-slate-100 p-2 rounded-lg">
                      {getIcon(item.type)}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-slate-700 truncate">{item.fileName}</p>
                      <p className="text-[10px] text-slate-400">{item.type} • {new Date(item.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeInteraction(item.id)}
                    className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3">
            <button 
                onClick={() => onAnalyze(interactions)}
                disabled={interactions.length === 0 || isAnalyzing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
            >
                {isAnalyzing ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Analyzing Deal...
                </>
                ) : (
                <>
                    Analyze Deal <ArrowRight className="w-5 h-5" />
                </>
                )}
            </button>
            
            {!isAnalyzing && interactions.length === 0 && (
                <button 
                    onClick={onLoadDemo}
                    className="w-full bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                    <PlayCircle className="w-5 h-5 text-indigo-500" /> Load Demo Deal (Mock)
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
