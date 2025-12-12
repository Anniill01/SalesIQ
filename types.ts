
export interface TranscriptSegment {
  speaker: 'Salesperson' | 'Prospect';
  text: string;
  timestamp: string;
  isObjection?: boolean;
  objectionHandlingFeedback?: string;
}

export interface SentimentPoint {
  timeOffset: number;
  label: string;
  score: number;
  insight: string;
}

export interface ClosingStrategy {
  strategy: string;
  rationale: string;
}

export interface PredictedOutcome {
  score: number;
  label: 'High Likelihood' | 'Medium Likelihood' | 'Low Likelihood';
  rationale: string;
}

export interface SalesPitchAssessment {
  score: number;
  clarity: string;
  hook: string;
  callToAction: string;
}

// --- NEW INTELLIGENCE TYPES ---

export interface DealRisk {
  riskScore: number; // 0-100 (High score = High risk)
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  riskFactors: string[];
}

export interface BuyingCommitteeMember {
  role: 'Decision Maker' | 'Influencer' | 'End User' | 'Blocker' | 'Unknown';
  nameOrReference: string; // e.g., "John" or "The VP of Marketing"
  sentiment: 'Positive' | 'Neutral' | 'Negative';
}

export interface DealStageAssessment {
  currentStage: string;
  recommendedStage: string;
  justification: string;
}

export interface ProspectProfile {
  discType: 'Dominance' | 'Influence' | 'Steadiness' | 'Conscientiousness';
  communicationStyle: string; // e.g., "Direct and result-oriented"
  sellingTips: string[]; // How to adapt to this person
  avatarBase64?: string; // New: AI Generated Avatar
}

export interface ComplianceCheck {
  complianceScore: number; // 0-100
  forbiddenPhrasesDetected: Array<{
    phrase: string;
    context: string;
    severity: 'Critical' | 'Warning';
    correction: string;
  }>;
  requiredStatements: Array<{
    statement: string; // e.g., "Call Recording Consent"
    status: 'Present' | 'Missing';
  }>;
}

export interface EmailDraft {
  tone: 'Professional' | 'Friendly' | 'Urgent';
  subject: string;
  body: string;
}

export interface FollowUpContent {
  emailSubject: string;
  emailBody: string; // HTML or Markdown supported
  agendaItems: string[];
  emailVariations?: EmailDraft[];
  proposalBullets?: string[];
}

export interface CallIntent {
  category: 'Buying' | 'Pricing' | 'Timeline' | 'Feature Fit' | 'Risk';
  score: number; // 0-100 confidence/intensity
  evidence: string;
}

export interface SilenceAnalysis {
  listeningRatio: number; // 0-100 (higher means rep listened more)
  smartSilenceCount: number; // Pauses that led to prospect revealing more info
  awkwardSilenceCount: number; // Pauses that caused friction
  explanation: string;
}

// ------------------------------

export interface CoachingInsights {
  strengths: string[];
  missedOpportunities: string[];
  overallSummary: string;
  keyTakeaways: string[];
  nextActions: string[];
  keyQuestions: string[];
  closingSuggestions: ClosingStrategy[];
  improvementAreas: string[];
  predictedOutcome: PredictedOutcome;
  objectionsHandled: string[];
  salesPitchAssessment: SalesPitchAssessment;
}

export interface CallScoreBreakdown {
  talkRatioContribution: number;
  patienceContribution: number;
  sentimentContribution: number;
  interruptionsContribution: number;
}

export interface CallStats {
  wpm: number;
  interruptions: number;
  longestMonologue: number;
  patienceScore: number;
  duration: string;
  callScore: number;
  scoreBreakdown: CallScoreBreakdown;
}

export interface TalkRatio {
  sales: number;
  prospect: number;
}

export interface Topic {
  name: string;
  relevance: number;
  description: string;
}

export interface Competitor {
  name: string;
  mentionCount: number;
  context: string;
  suggestedRebuttal: string;
}

export interface SalesAnalysisResult {
  transcript: TranscriptSegment[];
  sentimentGraph: SentimentPoint[];
  coachingCard: CoachingInsights;
  callStats: CallStats;
  talkRatio: TalkRatio;
  topics: Topic[];
  competitors: Competitor[];
  // New Sections
  dealIntelligence: {
    riskAnalysis: DealRisk;
    buyingCommittee: BuyingCommitteeMember[];
    dealStage: DealStageAssessment;
    intents: CallIntent[];
  };
  silenceAnalysis: SilenceAnalysis;
  compliance: ComplianceCheck;
  customerProfile: ProspectProfile;
  followUp: FollowUpContent;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

// --- BULK QA MODULE TYPES ---

export type ViolationSeverity = 'Critical' | 'Warning' | 'Info';

export interface QAViolation {
  id: string;
  phrase: string;
  timestamp: string;
  severity: ViolationSeverity;
  speaker: 'Salesperson' | 'Prospect';
  contextSnippet: string;
  aiExplanation: string;
  suggestedFix: string;
}

export interface QACallRecord {
  id: string;
  filename: string;
  repName: string;
  date: string;
  duration: string;
  qaScore: number; // 0-100
  riskLevel: 'High' | 'Medium' | 'Low';
  violations: QAViolation[];
  missingRequiredScripts: string[];
  status: 'Clean' | 'Review Needed' | 'Critical';
}

export interface QABatchStats {
  totalCalls: number;
  averageScore: number;
  criticalFlagCount: number;
  cleanCallCount: number;
  topViolations: { phrase: string; count: number }[];
  lowestPerformingReps: { name: string; avgScore: number }[];
}

export interface ComplianceRule {
  id: string;
  phrase: string;
  type: 'Forbidden' | 'Required';
  severity: ViolationSeverity;
  category: string; // e.g. "Legal", "Sales Hygiene"
  active: boolean;
}

// --- NEW STORAGE & LIVE TYPES ---

export interface SavedCall {
  id: string;
  fileName: string;
  dateSaved: number; // timestamp
  repName?: string;
  summary: string;
  stats: CallStats;
  analysisData: SalesAnalysisResult;
  isExemplar?: boolean; // For "Best Call Library"
}

export interface LiveTranscriptChunk {
  text: string;
  speaker?: 'user' | 'model'; // Added for chat UI
  isObjection: boolean;
  alert?: string;
  suggestion?: string; // New: AI suggested response
  coachingTip?: string; // New: Strategic tip
  timestamp: number;
  audioUrl?: string; // For replaying snippets
  isSaved?: boolean; // If user bookmarked this moment
}

// --- DEAL INTELLIGENCE TYPES ---

export interface DealInteraction {
  id: string;
  type: 'Audio' | 'Email' | 'Note' | 'PDF' | 'Image';
  fileName: string;
  file?: File;
  content?: string; // For text inputs
  date: string;
}

export interface DealJourneyPoint {
  stage: string;
  date: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  summary: string;
  keySignal: string;
}

export interface DealHealthCheck {
  check: string;
  status: 'Pass' | 'Fail' | 'Warning';
  details: string;
}

export interface FullDealAnalysis {
  dealName: string;
  winProbability: PredictedOutcome;
  journeyTimeline: DealJourneyPoint[];
  stakeholders: BuyingCommitteeMember[];
  allObjections: Array<{ objection: string, status: 'Resolved' | 'Open', strategy: string }>;
  actionPlan: {
    nextSteps: string[];
    risksToMitigate: string[];
    upsellOpportunities: string[];
  };
  overallSentimentTrend: 'Improving' | 'Declining' | 'Stable';
  executiveSummary: string;
  // Enhanced Fields
  missedOpportunities: string[];
  keyMoments: string[];
  dealHealthChecks: DealHealthCheck[];
}

export interface SavedDeal {
  id: string;
  customerName: string;
  lastUpdated: number;
  interactionsCount: number;
  analysis: FullDealAnalysis;
}