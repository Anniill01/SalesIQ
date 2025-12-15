
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Video, Image as ImageIcon, Sparkles, Loader2, Download, AlertTriangle, Film, MonitorPlay, Smartphone } from 'lucide-react';

// Helper to convert File to Base64 (Local copy to avoid dependency issues)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  
  const [status, setStatus] = useState<'IDLE' | 'CHECKING_KEY' | 'GENERATING' | 'COMPLETE' | 'ERROR'>('IDLE');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedVideoUri, setGeneratedVideoUri] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingMessages = [
    "Dreaming up pixels...",
    "Calculating light physics...",
    "Composing the scene...",
    "Rendering textures...",
    "Polishing frames...",
    "Applying cinematic grading..."
  ];

  useEffect(() => {
    let interval: any;
    if (status === 'GENERATING') {
      let i = 0;
      interval = setInterval(() => {
        setLoadingMessage(loadingMessages[i % loadingMessages.length]);
        i++;
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const checkApiKeyAndGenerate = async () => {
    setErrorMsg(null);
    
    // 1. Check for Paid API Key selection (Required for Veo)
    try {
      const aistudio = (window as any).aistudio;
      if (aistudio && aistudio.hasSelectedApiKey && aistudio.openSelectKey) {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setStatus('CHECKING_KEY');
          return; // Wait for user to select key
        }
      }
    } catch (e) {
      console.warn("AI Studio bridge not found, falling back to env key if available.");
    }

    startGeneration();
  };

  const handleOpenKeySelection = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      // Assume success after dialog interaction (Race condition mitigation)
      startGeneration();
    } catch (e) {
      setErrorMsg("Failed to open key selection dialog.");
      setStatus('IDLE');
    }
  };

  const startGeneration = async () => {
    setStatus('GENERATING');
    setVideoUrl(null);
    
    try {
      // Initialize AI with the specific environment key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let operation;
      const config = {
        numberOfVideos: 1,
        resolution: resolution,
        aspectRatio: aspectRatio,
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' }
        ]
      };

      if (image) {
        const imageBase64 = await fileToBase64(image);
        operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: prompt,
          image: {
            imageBytes: imageBase64,
            mimeType: image.type,
          },
          config: config
        });
      } else {
        operation = await ai.models.generateVideos({
          model: 'veo-3.1-fast-generate-preview',
          prompt: prompt,
          config: config
        });
      }

      // Polling Loop
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
        operation = await ai.operations.getVideosOperation({ operation: operation });
        console.log("Veo Operation Status:", operation.metadata);
      }

      if (operation.error) {
        throw new Error(operation.error.message || "Video generation failed.");
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!videoUri) throw new Error("No video URI returned.");

      setGeneratedVideoUri(videoUri);

      // Fetch the actual video bytes using the API key
      const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
      if (!videoResponse.ok) throw new Error("Failed to download generated video.");
      
      const videoBlob = await videoResponse.blob();
      const localVideoUrl = URL.createObjectURL(videoBlob);
      
      setVideoUrl(localVideoUrl);
      setStatus('COMPLETE');

    } catch (e: any) {
      console.error(e);
      // Handle the specific "Requested entity was not found" error which implies stale key
      if (e.message?.includes("Requested entity was not found")) {
         setStatus('CHECKING_KEY');
         setErrorMsg("Session expired. Please re-select your API Key.");
      } else {
         setStatus('ERROR');
         setErrorMsg(e.message || "An unexpected error occurred during generation.");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <Film className="w-8 h-8 text-rose-500" />
          AI Video Studio
          <span className="text-xs font-normal bg-rose-100 text-rose-700 px-2 py-1 rounded-full border border-rose-200">Veo 3.1 Fast</span>
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Generate high-definition marketing videos for YouTube Shorts or Landscape.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Controls */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Prompt */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 mb-2">Video Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video you want to generate... (e.g., A cinematic drone shot of a futuristic neon city at night)"
              className="w-full h-32 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm resize-none bg-slate-50"
              disabled={status === 'GENERATING'}
            />
          </div>

          {/* Reference Image */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 mb-2">Starting Image (Optional)</label>
            <div 
              onClick={() => status !== 'GENERATING' && fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden
                ${status === 'GENERATING' ? 'opacity-50 cursor-not-allowed' : 'hover:border-rose-400 hover:bg-rose-50'}
                ${imagePreview ? 'border-rose-200' : 'border-slate-200'}
              `}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Reference" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white font-bold text-xs">Change Image</span>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                  <span className="text-xs">Click to upload reference</span>
                </div>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
                disabled={status === 'GENERATING'}
              />
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-bold text-slate-700 mb-4">Configuration</h3>
             
             <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Aspect Ratio</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setAspectRatio('16:9')}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-all ${aspectRatio === '16:9' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                      <MonitorPlay className="w-4 h-4" /> 16:9 (YouTube)
                    </button>
                    <button 
                      onClick={() => setAspectRatio('9:16')}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-all ${aspectRatio === '9:16' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                      <Smartphone className="w-4 h-4" /> 9:16 (Shorts)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Resolution</label>
                  <select 
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-rose-500"
                  >
                    <option value="720p">720p (Fast)</option>
                    <option value="1080p">1080p (HD)</option>
                  </select>
                </div>
             </div>
          </div>

          {/* Generate Button */}
          {status === 'CHECKING_KEY' ? (
             <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h4 className="font-bold text-amber-800 mb-1">Billing Account Required</h4>
                <p className="text-xs text-amber-700 mb-3">
                  Veo video generation requires a paid Google Cloud Project. Please select a project with billing enabled.
                </p>
                <button 
                  onClick={handleOpenKeySelection}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm text-sm"
                >
                  Select Paid API Key
                </button>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="block mt-2 text-[10px] text-amber-600 underline">
                  Learn about Gemini API billing
                </a>
             </div>
          ) : (
            <button 
              onClick={checkApiKeyAndGenerate}
              disabled={!prompt.trim() || status === 'GENERATING'}
              className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              {status === 'GENERATING' ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Generate Video</>
              )}
            </button>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}

        </div>

        {/* RIGHT: Output Stage */}
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col min-h-[500px]">
           
           {status === 'IDLE' || status === 'CHECKING_KEY' ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 p-8 text-center">
                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                   <Film className="w-10 h-10 text-slate-700" />
                </div>
                <h3 className="text-xl font-bold text-slate-500">Canvas Empty</h3>
                <p className="text-slate-600 max-w-xs mt-2">Enter a prompt and configure settings to start generating cinematic video.</p>
             </div>
           ) : null}

           {status === 'GENERATING' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10 p-8 text-center">
                <div className="relative w-32 h-32 mb-8">
                   <div className="absolute inset-0 border-4 border-rose-500/20 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-rose-500 rounded-full border-t-transparent animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-rose-500 animate-pulse" />
                   </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 animate-pulse">Creating Video</h3>
                <p className="text-rose-400 font-mono text-sm">{loadingMessage}</p>
                <div className="mt-8 px-6 py-2 bg-slate-800 rounded-full border border-slate-700 text-xs text-slate-400">
                  This may take 1-2 minutes. Please don't close the tab.
                </div>
             </div>
           )}

           {status === 'COMPLETE' && videoUrl && (
             <div className="flex flex-col h-full bg-black">
                <div className="flex-grow flex items-center justify-center bg-black relative">
                   <video 
                     src={videoUrl} 
                     controls 
                     autoPlay 
                     loop 
                     className="max-h-full max-w-full shadow-2xl"
                     style={{ aspectRatio: aspectRatio === '16:9' ? '16/9' : '9/16' }}
                   />
                </div>
                <div className="bg-slate-900 p-6 border-t border-slate-800 flex justify-between items-center">
                   <div>
                     <p className="text-white font-bold text-lg mb-1">Generation Complete</p>
                     <p className="text-slate-400 text-xs">Veo 3.1 • {resolution} • {aspectRatio}</p>
                   </div>
                   <a 
                     href={videoUrl} 
                     download={`veo-generation-${Date.now()}.mp4`}
                     className="flex items-center gap-2 bg-white text-black hover:bg-slate-200 px-6 py-3 rounded-xl font-bold transition-colors"
                   >
                     <Download className="w-5 h-5" /> Download MP4
                   </a>
                </div>
             </div>
           )}

           {status === 'ERROR' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-900">
                <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                   <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-red-400">Generation Failed</h3>
                <p className="text-slate-500 max-w-md mt-2 mb-6">{errorMsg}</p>
                <button 
                  onClick={() => setStatus('IDLE')}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white font-medium transition-all"
                >
                  Try Again
                </button>
             </div>
           )}

        </div>
      </div>
    </div>
  );
};
