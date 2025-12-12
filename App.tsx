
import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { TranscriptView } from './components/TranscriptView';
import { SentimentChart } from './components/SentimentChart';
import { CoachingCard } from './components/CoachingCard';
import { StatsOverview } from './components/StatsOverview';
import { TopicsChart } from './components/TopicsChart';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { FeedbackModal } from './components/FeedbackModal';
import { DealIntelligence } from './components/DealIntelligence';
import { CompliancePanel } from './components/CompliancePanel';
import { CustomerProfile } from './components/CustomerProfile';
import { CRMIntegration } from './components/CRMIntegration';
import { ThinkingOverlay } from './components/ThinkingOverlay';
import { analyzeSalesCall, analyzeFullDeal } from './services/geminiService';
import { AppState, SalesAnalysisResult, SavedCall, DealInteraction, FullDealAnalysis } from './types';
import { Activity, RefreshCcw, Sparkles, MessageSquare, Menu, Save, Check, Layout, BrainCircuit, ListTodo, FileText, ShieldCheck, Download, ChevronDown, FileSpreadsheet, AlertTriangle, PlayCircle } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { QAModule } from './components/QAModule';
import { CallLibrary } from './components/library/CallLibrary';
import { TrendsDashboard } from './components/trends/TrendsDashboard';
import { LiveCopilot } from './components/live/LiveCopilot';
import { DealUpload } from './components/deal/DealUpload';
import { DealDashboard } from './components/deal/DealDashboard';
import { exportSingleCallReport } from './services/exportService'; 
import { saveCall as saveCallToDb, seedDemoCalls, getAllCalls, getDemoDealAnalysis } from './services/storageService'; 

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'COACH' | 'QA' | 'LIBRARY' | 'TRENDS' | 'LIVE' | 'DEAL'>('COACH');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // COACHING STATE
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<SalesAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentAudioTime, setCurrentAudioTime] = useState<number | null>(null);
  const [transcriptSearchTerm, setTranscriptSearchTerm] = useState('');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [fileName, setFileName] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // DEAL STATE
  const [dealAnalysis, setDealAnalysis] = useState<FullDealAnalysis | null>(null);
  const [isDealAnalyzing, setIsDealAnalyzing] = useState(false);
  const [dealError, setDealError] = useState<string | null>(null);

  // TAB STATE
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INTEL' | 'COACHING' | 'COMPLIANCE' | 'TRANSCRIPT'>('OVERVIEW');

  const handleFileSelect = async (file: File) => {
    setAppState(AppState.ANALYZING);
    setError(null);
    setTranscriptSearchTerm('');
    setCurrentAudioTime(0);
    setFileName(file.name);
    setIsSaved(false);
    
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    try {
      const data = await analyzeSalesCall(file);
      setResult(data);
      setAppState(AppState.COMPLETE);
      setActiveTab('OVERVIEW'); // Reset to overview on new file
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze the audio file.");
      setAppState(AppState.ERROR);
    }
  };

  const handleLoadDemo = async () => {
    setAppState(AppState.ANALYZING);
    setError(null);
    
    try {
      await seedDemoCalls();
      const calls = await getAllCalls();
      const demoCall = calls.find(c => c.fileName.includes('Discovery')) || calls[0];

      // Simulate network delay to show the Vibe animations
      setTimeout(() => {
        if (demoCall) {
          setResult(demoCall.analysisData);
          setFileName(demoCall.fileName);
          setIsSaved(true);
          setAppState(AppState.COMPLETE);
          setActiveTab('OVERVIEW');
          setAudioUrl(null); // No audio for demo
        } else {
          setError("Could not load demo data.");
          setAppState(AppState.ERROR);
        }
      }, 2000);
    } catch (e) {
      console.error(e);
      setError("Failed to load demo.");
      setAppState(AppState.ERROR);
    }
  };

  const handleDealAnalyze = async (interactions: DealInteraction[]) => {
    setIsDealAnalyzing(true);
    setDealError(null);
    try {
      const result = await analyzeFullDeal(interactions);
      setDealAnalysis(result);
    } catch (e: any) {
      setDealError(e.message || "Deal analysis failed. Please try again.");
    } finally {
      setIsDealAnalyzing(false);
    }
  };

  const handleLoadDemoDeal = () => {
    setIsDealAnalyzing(true);
    setDealError(null);
    // Simulate AI processing delay
    setTimeout(() => {
        const demoData = getDemoDealAnalysis();
        setDealAnalysis(demoData);
        setIsDealAnalyzing(false);
    }, 2500);
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setResult(null);
    setError(null);
    setTranscriptSearchTerm('');
    setCurrentAudioTime(null);
    setIsSaved(false);
    setShowExportMenu(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const handleSaveToLibrary = async () => {
    if (result && !isSaved) {
      try {
        await saveCallToDb(result, fileName);
        setIsSaved(true);
      } catch (e) {
        console.error("Failed to save", e);
        alert("Failed to save to local library.");
      }
    }
  };

  const handleExportReport = (format: 'CSV' | 'PDF') => {
    if (result) {
      exportSingleCallReport(result, fileName, format);
      setShowExportMenu(false);
    }
  };

  const loadFromLibrary = (call: SavedCall) => {
    setResult(call.analysisData);
    setAppState(AppState.COMPLETE);
    setFileName(call.fileName);
    setIsSaved(true);
    setAudioUrl(null); // Audio blob is not stored in this version
    setCurrentView('COACH');
    setActiveTab('OVERVIEW');
  };

  const handleTopicClick = (topicName: string) => {
    setTranscriptSearchTerm(topicName);
    setActiveTab('TRANSCRIPT'); // Switch to transcript view
  };

  const handleTimestampClick = (time: number) => {
    setCurrentAudioTime(time);
  };

  // Render content based on active tab within COACH view
  const renderCoachTabs = () => {
    if (!result) return null;

    switch (activeTab) {
      case 'OVERVIEW':
        return (
          <div className="animate-fade-in space-y-8">
             <StatsOverview 
                stats={result.callStats} 
                ratio={result.talkRatio} 
                silence={result.silenceAnalysis}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Explicit Height for Charts */}
                 <div className="h-[450px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <SentimentChart 
                      data={result.sentimentGraph} 
                      highlightedTime={currentAudioTime} 
                    />
                 </div>
                 <div className="h-[450px]">
                    <TopicsChart topics={result.topics} competitors={result.competitors} onTopicClick={handleTopicClick} />
                 </div>
              </div>
              <CustomerProfile profile={result.customerProfile} followUp={result.followUp} />
          </div>
        );
      case 'INTEL':
        return (
          <div className="animate-fade-in space-y-8">
            <DealIntelligence 
              risk={result.dealIntelligence.riskAnalysis}
              committee={result.dealIntelligence.buyingCommittee}
              stage={result.dealIntelligence.dealStage}
              intents={result.dealIntelligence.intents}
            />
          </div>
        );
      case 'COMPLIANCE':
        return (
          <div className="animate-fade-in">
             <CompliancePanel compliance={result.compliance} />
          </div>
        );
      case 'COACHING':
        return (
          <div className="animate-fade-in">
             <CoachingCard coaching={result.coachingCard} />
          </div>
        );
      case 'TRANSCRIPT':
        return (
          <div className="animate-fade-in h-[calc(100vh-200px)]">
             <TranscriptView 
                transcript={result.transcript || []} 
                searchTerm={transcriptSearchTerm}
                onSearchChange={setTranscriptSearchTerm}
                onTimestampClick={handleTimestampClick}
                currentAudioTime={currentAudioTime}
              />
          </div>
        );
      default: return null;
    }
  };

  const renderContent = () => {
    switch(currentView) {
      case 'QA': return <QAModule />;
      case 'LIBRARY': return <CallLibrary onLoadCall={loadFromLibrary} />;
      case 'TRENDS': return <TrendsDashboard />;
      case 'LIVE': return <LiveCopilot />;
      case 'DEAL': return !dealAnalysis ? (
        <div className="animate-fade-in">
           {dealError && (
             <div className="max-w-4xl mx-auto mt-6 mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-start gap-3 shadow-sm">
               <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
               <div>
                 <p className="font-bold">Analysis Failed</p>
                 <p className="text-sm opacity-90">{dealError}</p>
               </div>
             </div>
           )}
           <DealUpload 
             onAnalyze={handleDealAnalyze} 
             isAnalyzing={isDealAnalyzing} 
             onLoadDemo={handleLoadDemoDeal}
           />
        </div>
      ) : (
        <div className="animate-fade-in">
           <button onClick={() => setDealAnalysis(null)} className="mb-4 text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
             <RefreshCcw className="w-4 h-4" /> Start New Deal Analysis
           </button>
           <DealDashboard analysis={dealAnalysis} />
        </div>
      );
      default: return (
        <div className="max-w-7xl mx-auto space-y-6 pb-32">
             {/* Header for Single Call Mode */}
             <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
                <div>
                   <h1 className="text-2xl font-bold text-slate-800">Sales Call Coach</h1>
                   <p className="text-slate-500">Single call analysis & deep intelligence.</p>
                </div>
                {appState === AppState.COMPLETE && result && (
                  <div className="flex items-center gap-2 self-start xl:self-auto flex-wrap">
                     <CRMIntegration data={result} />
                     
                     {/* Export Dropdown */}
                     <div className="relative">
                        <button 
                          onClick={() => setShowExportMenu(!showExportMenu)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors rounded-lg flex items-center gap-2 text-sm font-bold bg-white border border-slate-200"
                        >
                           <Download className="w-5 h-5" />
                           <span className="hidden sm:inline">Export Report</span>
                           <ChevronDown className="w-4 h-4" />
                        </button>
                        {showExportMenu && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                            <button 
                              onClick={() => handleExportReport('PDF')}
                              className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50"
                            >
                              <FileText className="w-4 h-4 text-red-600" /> PDF Report
                            </button>
                            <button 
                              onClick={() => handleExportReport('CSV')}
                              className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel / CSV
                            </button>
                          </div>
                        )}
                     </div>

                     <button 
                       onClick={handleSaveToLibrary}
                       disabled={isSaved}
                       className={`p-2 transition-colors rounded-lg flex items-center gap-2 text-sm font-bold ${isSaved ? 'text-emerald-600 bg-emerald-50 cursor-default' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'}`}
                     >
                       {isSaved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                       <span className="hidden sm:inline">{isSaved ? 'Saved to Vault' : 'Save to Library'}</span>
                     </button>
                     <button 
                        onClick={() => setIsFeedbackOpen(true)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={resetApp}
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors bg-white border border-slate-200 px-3 py-2 rounded-lg"
                      >
                        <RefreshCcw className="w-4 h-4" />
                        <span className="hidden sm:inline">New Analysis</span>
                      </button>
                  </div>
                )}
             </div>

             {/* Tab Navigation */}
             {appState === AppState.COMPLETE && (
               <div className="flex border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
                 <button 
                   onClick={() => setActiveTab('OVERVIEW')}
                   className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'OVERVIEW' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                 >
                   <Layout className="w-4 h-4" /> Overview
                 </button>
                 <button 
                   onClick={() => setActiveTab('INTEL')}
                   className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'INTEL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                 >
                   <BrainCircuit className="w-4 h-4" /> Deal Intel
                 </button>
                 <button 
                   onClick={() => setActiveTab('COMPLIANCE')}
                   className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'COMPLIANCE' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                 >
                   <ShieldCheck className="w-4 h-4" /> QA & Compliance
                 </button>
                 <button 
                   onClick={() => setActiveTab('COACHING')}
                   className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'COACHING' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                 >
                   <ListTodo className="w-4 h-4" /> Coaching
                 </button>
                 <button 
                   onClick={() => setActiveTab('TRANSCRIPT')}
                   className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'TRANSCRIPT' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                 >
                   <FileText className="w-4 h-4" /> Transcript
                 </button>
               </div>
             )}

             {/* Content */}
             {appState === AppState.IDLE || appState === AppState.ANALYZING || appState === AppState.ERROR ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                   <div className="text-center mb-10 animate-fade-in-up px-4">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-4 border border-blue-100">
                       <Sparkles className="w-3 h-3" />
                       <span>POWERED BY GEMINI 3.0 PRO</span>
                     </div>
                     <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                       Turn Sales Calls into <br/>
                       <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Revenue Science</span>
                     </h2>
                     <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                       Upload your sales recordings. Our AI engine extracts diarized transcripts, 
                       deal risks, buying committee maps, compliance scores, and follow-up emails in seconds.
                     </p>
                   </div>
                   <FileUpload onFileSelect={handleFileSelect} isAnalyzing={appState === AppState.ANALYZING} />
                   
                   {/* DEMO BUTTON */}
                   {appState === AppState.IDLE && (
                      <button 
                        onClick={handleLoadDemo}
                        className="mt-6 flex items-center gap-2 text-slate-500 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-300 px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all font-semibold text-sm animate-fade-in-up"
                        style={{ animationDelay: '0.2s' }}
                      >
                        <PlayCircle className="w-4 h-4" />
                        Try Demo Analysis (No File Needed)
                      </button>
                   )}

                   {appState === AppState.ERROR && (
                     <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 max-w-lg text-center shadow-sm mx-auto">
                       <p className="font-bold flex items-center justify-center gap-2">
                         Analysis Failed
                       </p>
                       <p className="text-sm mt-1">{error}</p>
                       <button onClick={resetApp} className="mt-3 text-xs font-bold uppercase tracking-wide text-red-800 hover:underline">Try Again</button>
                     </div>
                   )}
                </div>
              ) : null}

              {appState === AppState.COMPLETE && result && renderCoachTabs()}
          </div>
      );
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans flex">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Thinking Overlay for Vibe */}
      <ThinkingOverlay isVisible={appState === AppState.ANALYZING} mode="CALL" />
      <ThinkingOverlay isVisible={isDealAnalyzing} mode="DEAL" />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 p-4 lg:p-8 transition-all duration-300 w-full overflow-hidden">
        
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg"
             >
               <Menu className="w-6 h-6" />
             </button>
             <span className="font-bold text-slate-800 text-lg">SalesIQ</span>
           </div>
        </div>

        {renderContent()}

        {/* Audio Player Bar (Only visible in COACH mode with audio) */}
        {currentView === 'COACH' && appState === AppState.COMPLETE && audioUrl && (
          <div className="lg:pl-64"> 
             <AudioPlayerBar 
               audioSrc={audioUrl} 
               onTimeUpdate={setCurrentAudioTime}
               externalCurrentTime={currentAudioTime}
             />
          </div>
        )}

        {/* Feedback Modal */}
        <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      </div>
    </div>
  );
};

export default App;
