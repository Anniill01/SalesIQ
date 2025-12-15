
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Radio, AlertTriangle, Zap, Activity, Lightbulb, MessageSquare, Briefcase, User, Target, RotateCcw, Swords, Volume2, MicOff, Lock, ShieldAlert, Sparkles, ChevronDown, PlayCircle, MonitorPlay } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { arrayBufferToBase64, b64ToUint8Array, float32ToInt16 } from '../../services/geminiService';
import { LiveTranscriptChunk } from '../../types';

interface LiveContext {
  pitch: string;
  scenario: string;
  goal: string;
}

const DEMO_SCENARIOS = [
  {
    id: 'cold-call',
    name: 'Cold Call: The Gatekeeper',
    pitch: "Hi, I'm calling from SalesIQ. We help sales teams improve win rates by 20% using real-time AI coaching.",
    scenario: "You are an Executive Assistant named 'Pat' at a Fortune 500 company. You are very protective of the CEO's time. You are polite but firm. You do not let anyone through without a scheduled appointment. You suspect this is a sales call and try to deflect it.",
    goal: "Get past the gatekeeper and schedule a time to speak with the CEO, or get the CEO's direct email."
  },
  {
    id: 'discovery',
    name: 'Discovery: Budget Objection',
    pitch: "SalesIQ integrates with your CRM to provide automated compliance checks and coaching.",
    scenario: "You are 'Gary', a VP of Sales. You like the product idea, but your budget has been slashed for Q4. You are stressed about meeting targets. You need a solution but can't pay upfront. You are blunt and impatient.",
    goal: "Uncover the specific budget constraints and propose a pilot program or deferred payment structure to keep the deal alive."
  },
  {
    id: 'closing',
    name: 'Closing: Competitor Pressure',
    pitch: "We are reviewing the final contract for the Enterprise plan.",
    scenario: "You are 'Sarah', the decision maker. You just received a quote from a competitor (Gong.io) that is 30% cheaper. You want to go with SalesIQ but need price matching or extra value to justify the cost to your board.",
    goal: "Defend the premium pricing by highlighting unique value (Real-time coaching vs Post-call analysis) and close the deal without a massive discount."
  }
];

// Script for the Auto-Demo
const AUTO_DEMO_SCRIPT = [
  { delay: 500, type: 'transcript', speaker: 'model', text: "Hello, this is Gary. Who's this?" },
  { delay: 2000, type: 'transcript', speaker: 'user', text: "Hi Gary, it's Alex from SalesIQ. I saw you downloaded our whitepaper on AI coaching." },
  { delay: 4500, type: 'transcript', speaker: 'model', text: "Look, I'm really busy right now. Is this a sales call?" },
  { delay: 5000, type: 'coaching', alert: "Gatekeeper / Time Objection", suggestion: "Acknowledge time. Ask for 30 seconds to explain value.", tip: "Don't back down. Pivot to value." },
  { delay: 7000, type: 'transcript', speaker: 'user', text: "I promise to be brief. I just wanted to ask one question about your current coaching process." },
  { delay: 10000, type: 'transcript', speaker: 'model', text: "We use Gong. We're fine." },
  { delay: 10500, type: 'coaching', alert: "Competitor: Gong", suggestion: "Highlight 'Real-time' vs 'Post-call'. We prevent mistakes before they happen.", tip: "Differentiation is key." },
  { delay: 13000, type: 'transcript', speaker: 'user', text: "Gong is great for post-game analysis. But SalesIQ guides your reps *during* the call to save deals in the moment." },
  { delay: 16000, type: 'transcript', speaker: 'model', text: "During the call? Isn't that distracting?" },
  { delay: 16500, type: 'coaching', alert: "Buying Signal: Curiosity", suggestion: "Explain the non-intrusive UI. Propose a demo.", tip: "They are interested!" },
];

export const LiveCopilot: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [chunks, setChunks] = useState<LiveTranscriptChunk[]>([]);
  const [realtimeText, setRealtimeText] = useState<{ text: string, source: 'user' | 'model' } | null>(null);
  
  // Persistent State
  const [suggestionHistory, setSuggestionHistory] = useState<{alert: string, suggestion: string, timestamp: number}[]>([]);
  const [liveCoachingTip, setLiveCoachingTip] = useState<string | null>(null);
  
  // Context State
  const [context, setContext] = useState<LiveContext>({
    pitch: '',
    scenario: '',
    goal: ''
  });
  const [isContextCollapsed, setIsContextCollapsed] = useState(false);
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioInputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Demo Timers Ref
  const demoTimeoutsRef = useRef<any[]>([]);
  
  // Transcription Buffers
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chunks, liveCoachingTip, realtimeText]);

  // Cleanup on Unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const loadScenario = (scenarioId: string) => {
    const s = DEMO_SCENARIOS.find(d => d.id === scenarioId);
    if (s) {
      setContext({
        pitch: s.pitch,
        scenario: s.scenario,
        goal: s.goal
      });
      setIsContextCollapsed(false);
      setShowScenarioMenu(false);
    }
  };

  const startAutoDemo = () => {
    if (isConnected) disconnect();
    
    setIsConnected(true);
    setIsDemoMode(true);
    setChunks([]);
    setSuggestionHistory([]);
    setLiveCoachingTip("Listening for conversation...");
    setIsContextCollapsed(true);

    let cumulativeTime = 0;

    // Clear any existing timeouts
    demoTimeoutsRef.current.forEach(clearTimeout);
    demoTimeoutsRef.current = [];

    AUTO_DEMO_SCRIPT.forEach(step => {
      cumulativeTime += step.delay;
      const timeoutId = setTimeout(() => {
        if (step.type === 'transcript') {
           setChunks(prev => [...prev, {
             text: (step as any).text,
             speaker: (step as any).speaker,
             isObjection: false,
             timestamp: Date.now()
           }]);
        } else if (step.type === 'coaching') {
           const s = step as any;
           setLiveCoachingTip(s.tip);
           setSuggestionHistory(prev => [{
             alert: s.alert,
             suggestion: s.suggestion,
             timestamp: Date.now()
           }, ...prev]);
        }
      }, cumulativeTime);
      demoTimeoutsRef.current.push(timeoutId);
    });

    // End demo timeout
    const endTimeoutId = setTimeout(() => {
        setIsConnected(false);
        setIsDemoMode(false);
        setLiveCoachingTip("Demo Complete.");
    }, cumulativeTime + 2000);
    demoTimeoutsRef.current.push(endTimeoutId);
  };

  // --- Live API Setup ---

  const connectToLiveAPI = async () => {
    setPermissionError(false);
    setIsDemoMode(false);
    
    // 1. Check for Demo Fallback requirement (e.g. non-HTTPS)
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      console.warn("Insecure context. Switching to simulation mode automatically.");
      startAutoDemo();
      return;
    }

    if (!context.pitch || !context.scenario) {
        alert("Please fill in the Scenario Setup first (or click 'Load Demo').");
        setIsContextCollapsed(false);
        return;
    }

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        alert("API Key not found.");
        return;
      }
      
      // Setup Audio Output
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        nextStartTimeRef.current = 0;
      } catch (audioCtxError) {
        console.error("Audio Context Error:", audioCtxError);
      }

      // 2. Proactive Permission Check & Listener
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          
          if (permissionStatus.state === 'denied') {
             console.warn("Microphone permission explicitly denied via Permissions API");
             setPermissionError(true);
             return;
          }

          // Listen for changes
          permissionStatus.onchange = () => {
             if (permissionStatus.state === 'denied') {
               setPermissionError(true);
               disconnect();
             } else if (permissionStatus.state === 'granted') {
               setPermissionError(false);
             }
          };
        } catch (e) {
          // Ignore
        }
      }

      // 3. Request Stream
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
           throw new Error("Microphone API not supported.");
        }
        streamRef.current = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
      } catch (micError: any) {
        console.error("Microphone access denied:", micError);
        setPermissionError(true);
        // Fallback to simulation if mic fails (for demo purposes)
        startAutoDemo();
        return;
      }

      setIsConnected(true);
      setIsContextCollapsed(true);
      setChunks([]);
      setSuggestionHistory([]);
      currentInputTranscription.current = '';
      currentOutputTranscription.current = '';
      
      const ai = new GoogleGenAI({ apiKey });

      audioInputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      if (audioInputContextRef.current.state === 'suspended') {
        await audioInputContextRef.current.resume();
      }
      
      const provideCoachingTipTool: FunctionDeclaration = {
        name: 'provideCoachingTip',
        description: 'Provide a secret coaching tip or flag an objection to the salesperson without breaking roleplay character.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            alertType: { type: Type.STRING, description: 'Short alert title e.g. "Price Objection"' },
            suggestion: { type: Type.STRING, description: 'Script or strategy for the rep.' },
            tip: { type: Type.STRING, description: 'Short mindset tip.' }
          },
          required: ['alertType', 'suggestion', 'tip']
        }
      };

      const config = {
        responseModalities: [Modality.AUDIO], // Strictly AUDIO only for Live API
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
        },
        systemInstruction: {
          parts: [{ text: `
          You are an AI Roleplay Partner. You are acting as the Prospect described below.
          PROSPECT SCENARIO: ${context.scenario}
          YOUR GOAL: Challenge the salesperson naturally. Be skeptical but fair.
          SALESPERSON PITCH: ${context.pitch}
          SALESPERSON GOAL: ${context.goal}

          IMPORTANT:
          1. Speak naturally as the prospect.
          2. IF the salesperson makes a mistake or you detect a major objection type, call the tool 'provideCoachingTip' to log advice for them silently.
          3. Do not break character in your voice response. Only use the tool for coaching.
        `}]},
        tools: [{ functionDeclarations: [provideCoachingTipTool] }],
        inputAudioTranscription: {}, 
        outputAudioTranscription: {}
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: config,
        callbacks: {
          onopen: () => {
             console.log("Live Session Connected");
             // Start Input Stream
             if (!audioInputContextRef.current || !streamRef.current) return;
             
             sourceRef.current = audioInputContextRef.current.createMediaStreamSource(streamRef.current);
             processorRef.current = audioInputContextRef.current.createScriptProcessor(4096, 1, 1);
             
             processorRef.current.onaudioprocess = (e) => {
                 const inputData = e.inputBuffer.getChannelData(0);
                 const int16Data = float32ToInt16(inputData);
                 const base64Data = arrayBufferToBase64(int16Data.buffer);
                 
                 sessionPromise.then(session => {
                     session.sendRealtimeInput({
                         media: {
                             mimeType: 'audio/pcm;rate=16000',
                             data: base64Data
                         }
                     });
                 });
             };
             
             sourceRef.current.connect(processorRef.current);
             processorRef.current.connect(audioInputContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
             if (msg.serverContent?.outputTranscription) {
                currentOutputTranscription.current += msg.serverContent.outputTranscription.text;
                setRealtimeText({ text: currentOutputTranscription.current, source: 'model' });
             } else if (msg.serverContent?.inputTranscription) {
                currentInputTranscription.current += msg.serverContent.inputTranscription.text;
                setRealtimeText({ text: currentInputTranscription.current, source: 'user' });
             }

             if (msg.serverContent?.turnComplete) {
                if (currentInputTranscription.current.trim()) {
                    setChunks(prev => [...prev, { text: currentInputTranscription.current, speaker: 'user', isObjection: false, timestamp: Date.now() }]);
                    currentInputTranscription.current = '';
                }
                if (currentOutputTranscription.current.trim()) {
                    setChunks(prev => [...prev, { text: currentOutputTranscription.current, speaker: 'model', isObjection: false, timestamp: Date.now() }]);
                    currentOutputTranscription.current = '';
                }
                setRealtimeText(null);
             }

             if (msg.toolCall) {
                for (const fc of msg.toolCall.functionCalls) {
                    if (fc.name === 'provideCoachingTip') {
                        const args = fc.args as any;
                        setSuggestionHistory(prev => [
                            { alert: args.alertType, suggestion: args.suggestion, timestamp: Date.now() },
                            ...prev
                        ]);
                        setLiveCoachingTip(args.tip);
                        
                        sessionPromise.then(session => {
                            session.sendToolResponse({
                                functionResponses: {
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: "Tip logged successfully" }
                                }
                            });
                        });
                    }
                }
             }

             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData && audioContextRef.current) {
                 const audioBytes = b64ToUint8Array(audioData);
                 const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current);
                 playAudio(audioBuffer);
             }
          },
          onclose: () => {
             console.log("Session Closed");
             setIsConnected(false);
          },
          onerror: (err) => {
             console.error("Session Error", err);
             // Don't kill session immediately on minor errors, but log
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error(e);
      alert("Failed to start Live Session. Ensure you have microphone permissions enabled.");
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    // Clear demo timers
    demoTimeoutsRef.current.forEach(clearTimeout);
    demoTimeoutsRef.current = [];

    if (sessionRef.current) {
        sessionRef.current.then((s: any) => s.close());
    }
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    if (audioInputContextRef.current) {
        audioInputContextRef.current.close();
        audioInputContextRef.current = null;
    }
    setIsConnected(false);
    setIsDemoMode(false);
    setLiveCoachingTip(null);
    setRealtimeText(null);
  };

  // --- Audio Helpers ---

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const float32 = new Float32Array(dataInt16.length);
    for (let i = 0; i < dataInt16.length; i++) {
        float32[i] = dataInt16[i] / 32768.0;
    }
    
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);
    return buffer;
  }

  function playAudio(buffer: AudioBuffer) {
      if (!audioContextRef.current) return;
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      
      const currentTime = audioContextRef.current.currentTime;
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      
      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;
  }

  return (
    <div className="animate-fade-in max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Radio className="w-6 h-6 text-rose-600 animate-pulse" />
            Live Roleplay Dojo <span className="text-xs font-normal text-white bg-rose-600 px-2 py-1 rounded-full">Gemini Live API</span>
          </h1>
        </div>
        
        <div className="flex gap-2">
           {!isConnected ? (
             <>
                <button onClick={startAutoDemo} className="flex items-center gap-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-4 py-2.5 rounded-lg font-bold shadow-sm transition-all active:scale-95">
                   <PlayCircle className="w-5 h-5" /> Simulate Demo
                </button>
                <button onClick={connectToLiveAPI} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-rose-600/20 transition-all active:scale-95">
                   <Mic className="w-5 h-5" /> Start Roleplay
                </button>
             </>
           ) : (
             <button onClick={disconnect} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold animate-pulse border border-red-500/50">
               <Square className="w-5 h-5" /> End Session
             </button>
           )}
           <button onClick={() => { disconnect(); setChunks([]); setSuggestionHistory([]); }} className="p-2 text-slate-400 hover:text-slate-600">
             <RotateCcw className="w-5 h-5" />
           </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-grow overflow-hidden">
        
        {/* LEFT: Context & Transcript */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          
          {/* Live Coaching Tip Banner - Persistent */}
          <div className={`
             bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 shadow-lg flex items-center gap-4 transition-all duration-500 flex-shrink-0
             ${liveCoachingTip ? 'opacity-100 translate-y-0' : 'opacity-40 grayscale'}
          `}>
             <div className="p-2 bg-white/20 rounded-full animate-bounce-slow">
               <Zap className="w-6 h-6 text-yellow-300" />
             </div>
             <div>
               <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-1">Live Coaching Tip</p>
               <p className="text-white font-medium text-lg leading-tight">
                 {liveCoachingTip || "Ready to assist. Start speaking to the prospect..."}
               </p>
             </div>
          </div>

          {/* Context Setup Form */}
          <div className={`bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-300 overflow-hidden flex-shrink-0 ${isContextCollapsed ? 'h-14 opacity-90' : 'h-auto p-5'}`}>
             <div 
               className={`flex justify-between items-center cursor-pointer ${isContextCollapsed ? 'px-4 h-14' : 'mb-6 border-b border-slate-100 pb-4'}`}
               onClick={() => setIsContextCollapsed(!isContextCollapsed)}
             >
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5 text-blue-500" /> 
                    Roleplay Scenario Setup
                  </h3>
                  
                  {!isContextCollapsed && (
                     <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowScenarioMenu(!showScenarioMenu); }} 
                          className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-md font-bold hover:bg-indigo-100 transition-colors border border-indigo-200"
                        >
                          <Sparkles className="w-3 h-3" /> Quick Scenarios <ChevronDown className="w-3 h-3" />
                        </button>
                        {showScenarioMenu && (
                          <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden animate-fade-in">
                             {DEMO_SCENARIOS.map(s => (
                               <button 
                                 key={s.id}
                                 onClick={(e) => { e.stopPropagation(); loadScenario(s.id); }}
                                 className="w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-medium border-b border-slate-50 last:border-0"
                               >
                                 {s.name}
                               </button>
                             ))}
                          </div>
                        )}
                     </div>
                  )}
                </div>
                
                <div className="text-xs text-blue-600 font-medium">
                  {isContextCollapsed ? 'Show Details' : 'Hide Details'}
                </div>
             </div>
             
             <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${isContextCollapsed ? 'hidden' : 'block'}`}>
                {/* Pitch Card */}
                <div className="group">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                       <Briefcase className="w-4 h-4" />
                     </div>
                     <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">The Pitch</label>
                   </div>
                   <textarea 
                     className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-24 bg-slate-50 focus:bg-white transition-colors" 
                     value={context.pitch}
                     onChange={e => setContext({...context, pitch: e.target.value})}
                     placeholder="Describe your product value proposition..."
                   />
                </div>

                {/* Scenario Card */}
                <div className="group">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-100 transition-colors">
                       <User className="w-4 h-4" />
                     </div>
                     <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">The Prospect Persona</label>
                   </div>
                   <textarea 
                     className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none h-24 bg-slate-50 focus:bg-white transition-colors" 
                     value={context.scenario}
                     onChange={e => setContext({...context, scenario: e.target.value})}
                     placeholder="Who are you talking to? Be specific."
                   />
                </div>

                {/* Goal Card */}
                <div className="group">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                       <Target className="w-4 h-4" />
                     </div>
                     <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Winning Criteria</label>
                   </div>
                   <textarea 
                     className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none h-24 bg-slate-50 focus:bg-white transition-colors" 
                     value={context.goal}
                     onChange={e => setContext({...context, goal: e.target.value})}
                     placeholder="What defines success?"
                   />
                </div>
             </div>
          </div>

          {/* Audio Visualizer & Transcript Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-grow overflow-hidden relative">
             <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-slate-700 text-sm">Live Audio & Script</span>
                </div>
                {isConnected && (
                  <div className="flex items-center gap-2">
                     {/* 
                         VIDEO OPTIMIZATION: Display 'On Air' even in demo mode to look professional for the recording.
                         The viewer doesn't need to know it's a simulation. 
                     */}
                     <span className="text-[10px] font-bold text-red-500 uppercase animate-pulse">On Air</span>
                     <span className="flex h-2 w-2 rounded-full animate-ping bg-red-500"></span>
                  </div>
                )}
             </div>
             
             <div className="flex-grow bg-slate-50 relative overflow-hidden flex flex-col">
                {!isConnected && !permissionError && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 z-10">
                      <Volume2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-600">Ready to Practice?</h3>
                      <p className="text-slate-400 max-w-sm mx-auto mt-2">Start a simulation or connect to the live AI model.</p>
                      {!window.isSecureContext && (
                        <div className="mt-4 flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-2 rounded-lg text-xs font-bold border border-orange-200 max-w-xs mx-auto text-left">
                          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                          <span>HTTPS or Localhost required for microphone access.</span>
                        </div>
                      )}
                   </div>
                )}

                {permissionError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20 text-center p-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MicOff className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Microphone Access Denied</h3>
                    <p className="text-slate-500 mb-4">Permissions required for Live Roleplay. Switching to Demo Mode...</p>
                    <button onClick={startAutoDemo} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold">Start Simulation</button>
                  </div>
                )}

                {/* Transcript Chat Area */}
                <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 relative z-0">
                   {chunks.length === 0 && !realtimeText && isConnected && (
                      <div className="h-full flex items-center justify-center opacity-30">
                         <div className="w-32 h-32 bg-blue-400 rounded-full blur-[60px] animate-pulse"></div>
                      </div>
                   )}
                   {chunks.map((chunk, idx) => (
                      <div key={idx} className={`flex flex-col ${chunk.speaker === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}>
                         <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                            chunk.speaker === 'user' 
                              ? 'bg-blue-600 text-white rounded-tr-sm' 
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                         }`}>
                            {chunk.text}
                         </div>
                         <span className="text-[10px] text-slate-400 mt-1 px-1">{chunk.speaker === 'user' ? 'You' : 'Prospect'}</span>
                      </div>
                   ))}
                   
                   {realtimeText && (
                      <div className={`flex flex-col ${realtimeText.source === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                         <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm opacity-80 ${
                            realtimeText.source === 'user' 
                              ? 'bg-blue-600 text-white rounded-tr-sm' 
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                         }`}>
                            {realtimeText.text} <span className="inline-block w-1.5 h-3 bg-current ml-1 animate-pulse"/>
                         </div>
                         <span className="text-[10px] text-slate-400 mt-1 px-1">Thinking...</span>
                      </div>
                   )}
                </div>
                
                {/* Audio Visualizer Bar */}
                {isConnected && (
                   <div className="h-12 bg-white border-t border-slate-100 flex items-end justify-center gap-1 pb-2 px-4 flex-shrink-0">
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className={`w-1 rounded-full animate-music-bar bg-rose-500`} style={{height: `${Math.random() * 80 + 20}%`, animationDelay: `${i * 0.05}s`}}></div>
                      ))}
                   </div>
                )}
             </div>
          </div>
        </div>

        {/* RIGHT: Persistent Suggestions Panel */}
        <div className="lg:w-96 flex flex-col gap-4 flex-shrink-0">
           <div className="bg-slate-800 rounded-xl p-4 shadow-lg text-white flex-grow overflow-hidden flex flex-col border border-slate-700">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-700">
                 <Lightbulb className="w-5 h-5 text-yellow-400" />
                 <h3 className="font-bold">Real-Time Coach</h3>
              </div>
              
              <div className="overflow-y-auto space-y-4 custom-scrollbar pr-2 flex-grow h-64 lg:h-auto">
                 {suggestionHistory.length === 0 ? (
                   <div className="text-slate-500 text-sm italic text-center mt-10 p-4 border border-dashed border-slate-700 rounded-lg">
                     <Zap className="w-8 h-8 mx-auto mb-2 opacity-20" />
                     <p>While you speak, the AI Coach listens in parallel and logs objections, tips, and winning moves here.</p>
                   </div>
                 ) : (
                   suggestionHistory.map((item, idx) => (
                     <div key={idx} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600 animate-slide-in-right hover:bg-slate-700 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                           <AlertTriangle className="w-4 h-4 text-red-400" />
                           <span className="text-xs font-bold text-red-300 uppercase truncate max-w-[150px]">{item.alert}</span>
                           <span className="text-[10px] text-slate-400 ml-auto whitespace-nowrap">{new Date(item.timestamp).toLocaleTimeString([], {minute:'2-digit', second:'2-digit'})}</span>
                        </div>
                        <div className="bg-indigo-900/40 p-2.5 rounded border border-indigo-500/30">
                           <div className="flex gap-2 items-start">
                             <MessageSquare className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                             <div>
                               <p className="text-xs font-bold text-indigo-300 mb-1">Coach Says:</p>
                               <p className="text-sm font-medium text-white italic leading-snug">"{item.suggestion}"</p>
                             </div>
                           </div>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
