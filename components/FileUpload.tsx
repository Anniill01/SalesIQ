
import React, { useEffect, useState } from 'react';
import { Upload, Music, FileAudio } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isAnalyzing }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev; // Hold at 90 until complete
          return prev + 2;
        });
      }, 500); // Slower progress for single file analysis feeling
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Sales Call</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Upload an audio file (MP3, WAV, M4A) to generate an AI-powered coaching report with sentiment analysis and transcript.
          </p>

          <label className={`
            relative flex flex-col items-center justify-center w-full h-48 
            border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300
            ${isAnalyzing ? 'border-slate-200 bg-slate-50 cursor-not-allowed' : 'border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-300'}
          `}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6 w-full px-10">
              {isAnalyzing ? (
                <div className="w-full max-w-xs">
                  <div className="flex justify-between text-xs text-blue-600 font-bold mb-2">
                    <span>Analyzing...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-2 mb-4 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-400">Processing audio, transcribing, and extracting insights.</p>
                </div>
              ) : (
                <>
                  <FileAudio className="w-10 h-10 text-slate-400 mb-3" />
                  <p className="mb-2 text-sm text-slate-700">
                    <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-500">MP3, WAV, M4A, AAC</p>
                </>
              )}
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="audio/*" 
              onChange={handleFileChange} 
              disabled={isAnalyzing}
            />
          </label>
        </div>
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Music className="w-3 h-3" />
          <span>Powered by Gemini 2.5 Flash Audio Analysis</span>
        </div>
      </div>
    </div>
  );
};
