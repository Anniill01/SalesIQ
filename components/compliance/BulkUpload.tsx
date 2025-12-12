
import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileArchive, Loader2, FileAudio } from 'lucide-react';

interface BulkUploadProps {
  onUploadComplete: (files: File[]) => void;
}

export const BulkUpload: React.FC<BulkUploadProps> = ({ onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDivClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      setSelectedCount(files.length);
      handleUpload(files);
    }
  };

  const handleUpload = (files: File[]) => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setProgress(0);

    // Simulate progress bar
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5; // Increment by 5%
      });
    }, 100); // 2 seconds total roughly

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setIsUploading(false);
      onUploadComplete(files);
    }, 2200);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-10 max-w-2xl w-full text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <UploadCloud className="w-10 h-10 text-emerald-600" />
        </div>
        
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Bulk Compliance Scan</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Upload multiple audio files or a ZIP folder. The AI will audit, transcribe, and score every call for compliance risks in batch.
        </p>

        <div 
          onClick={handleDivClick}
          className={`
            border-3 border-dashed rounded-2xl p-10 transition-all cursor-pointer relative overflow-hidden group
            ${isUploading ? 'border-emerald-200 bg-emerald-50 cursor-not-allowed' : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30'}
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            multiple 
            accept="audio/*,.zip,.mp3,.wav,.m4a"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center z-10 relative">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
              <p className="font-bold text-emerald-800 text-lg">Processing {selectedCount} Files...</p>
              <div className="w-64 h-2 bg-emerald-200 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-emerald-600 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-emerald-600 mt-2">{progress}% Complete</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex gap-2 mb-4">
                <FileAudio className="w-8 h-8 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                <FileArchive className="w-12 h-12 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <FileAudio className="w-8 h-8 text-slate-300 group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className="text-lg font-semibold text-slate-700 mb-2">Drag & Drop files or click to browse</p>
              <p className="text-sm text-slate-400">Supports MP3, WAV, M4A, ZIP</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-4 text-xs text-slate-400">
           <span className="flex items-center gap-1">• SOC2 Compliant</span>
           <span className="flex items-center gap-1">• 256-bit Encryption</span>
           <span className="flex items-center gap-1">• Batch Processing Enabled</span>
        </div>
      </div>
    </div>
  );
};
