
import { SavedCall, SalesAnalysisResult, SavedDeal, FullDealAnalysis } from '../types';

const DB_NAME = 'SalesIQ_DB';
const STORE_NAME = 'saved_calls';
const DEAL_STORE_NAME = 'saved_deals';
const DB_VERSION = 2; // Incremented for new store

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject("Database error: " + (event.target as any).errorCode);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DEAL_STORE_NAME)) {
        db.createObjectStore(DEAL_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
  });
};

export const saveCall = async (analysis: SalesAnalysisResult, fileName: string): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const call: SavedCall = {
    id: crypto.randomUUID(),
    fileName,
    dateSaved: Date.now(),
    summary: analysis.coachingCard.overallSummary,
    stats: analysis.callStats,
    analysisData: analysis,
    isExemplar: false
  };

  store.put(call);
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const updateCall = async (id: string, updates: Partial<SavedCall>): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  const request = store.get(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const data = request.result as SavedCall;
      if (!data) return reject("Call not found");
      
      const updatedData = { ...data, ...updates };
      const updateRequest = store.put(updatedData);
      
      updateRequest.onsuccess = () => resolve();
      updateRequest.onerror = () => reject(updateRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getAllCalls = async (): Promise<SavedCall[]> => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteCall = async (id: string): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.delete(id);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// --- DEAL STORAGE ---

export const saveDeal = async (deal: SavedDeal): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction(DEAL_STORE_NAME, 'readwrite');
  const store = tx.objectStore(DEAL_STORE_NAME);
  store.put(deal);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getAllDeals = async (): Promise<SavedDeal[]> => {
  const db = await initDB();
  // Ensure store exists before query
  if (!db.objectStoreNames.contains(DEAL_STORE_NAME)) return [];
  
  const tx = db.transaction(DEAL_STORE_NAME, 'readonly');
  const store = tx.objectStore(DEAL_STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Mock Data Generator for Deal Demo
export const getDemoDealAnalysis = (): FullDealAnalysis => {
  return {
    dealName: "Acme Corp Global Enterprise Expansion",
    winProbability: {
      score: 72,
      label: "Medium Likelihood",
      rationale: "Strong technical champion in Engineering, but CFO is blocking due to Q4 budget freeze. Value prop is clear, but timing is at risk."
    },
    journeyTimeline: [
      { stage: "Prospecting", date: "2023-10-15", sentiment: "Neutral", summary: "Cold outreach via LinkedIn. Connected with DevOps Lead.", keySignal: "Response received within 2 hours." },
      { stage: "Discovery", date: "2023-10-20", sentiment: "Positive", summary: "Identified pain point: Slow CI/CD pipelines causing 4hr weekly delay per dev.", keySignal: "'We are losing 4 hours a week per dev.'" },
      { stage: "Demo", date: "2023-11-05", sentiment: "Positive", summary: "Technical demo with Engineering Lead. Validated all functional requirements.", keySignal: "'This is exactly what we need.'" },
      { stage: "Negotiation", date: "2023-11-25", sentiment: "Negative", summary: "Initial proposal rejected by Procurement. Price is 20% over budget.", keySignal: "'We have a freeze on new SaaS tools.'" }
    ],
    stakeholders: [
      { role: "Decision Maker", nameOrReference: "Sarah (CTO)", sentiment: "Positive" },
      { role: "Blocker", nameOrReference: "Mike (CFO)", sentiment: "Negative" },
      { role: "Influencer", nameOrReference: "Dave (DevOps Lead)", sentiment: "Positive" },
      { role: "End User", nameOrReference: "Eng Team", sentiment: "Positive" }
    ],
    allObjections: [
      { objection: "Price too high", status: "Open", strategy: "Demonstrate ROI from developer productivity gains to justify cost." },
      { objection: "Security Compliance", status: "Resolved", strategy: "Shared SOC2 Type II report and Architecture diagram." }
    ],
    actionPlan: {
      nextSteps: ["Schedule ROI workshop with CFO", "Draft new proposal with tiered pricing", "Get CTO to send email support to Finance"],
      risksToMitigate: ["Budget freeze risk", "Competitor X lowering price aggressively"],
      upsellOpportunities: ["Add Advanced Security Module", "Premier Support Package"]
    },
    overallSentimentTrend: "Stable",
    executiveSummary: "Deal is technically won but financially at risk. The CTO is sold, but the CFO is enforcing a strict budget freeze. We need to build a strong business case (ROI) to unlock funds from the 'Innovation' bucket instead of 'OpEx'. Competitor X is sniffing around with a lower price point.",
    missedOpportunities: ["Did not multi-thread to CFO earlier in the cycle.", "Could have leveraged end-of-year discount earlier to create urgency."],
    keyMoments: ["CTO explicitly stated current solution is failing.", "DevOps Lead became a champion after the trial period.", "Procurement flagged legal review timeline."],
    dealHealthChecks: [
      { check: "Decision Maker Access", status: "Pass", details: "Direct line to CTO and bi-weekly syncs." },
      { check: "Budget Confirmed", status: "Fail", details: "Budget is frozen for Q4. Funds must be 'found'." },
      { check: "Competitor Analysis", status: "Warning", details: "Competitor X is known to be in the account." },
      { check: "Paper Process", status: "Pass", details: "Legal review started." }
    ],
    coachingInsights: {
      strengths: ["Strong technical alignment with CTO", "Effective use of customer testimonials"],
      improvementAreas: ["Need to engage Finance earlier", "Value proposition for CFO is currently weak"],
      keyTakeaways: ["Technical win secured", "Procurement is the primary bottleneck"]
    },
    keyQuestions: [
      "How does the current budget freeze impact your 2024 roadmap?",
      "What specific ROI metrics does Mike (CFO) care most about?",
      "If we can demonstrate a 6-month payback, does that change the budget conversation?"
    ],
    closingSuggestions: [
      { strategy: "ROI-Based Business Case", rationale: "CFO is the blocker; need hard numbers to justify spend during freeze." },
      { strategy: "Phased Implementation", rationale: "Lower initial cost to fit into remaining Q4 'Innovation' budget." }
    ],
    consolidatedScript: "SalesIQ: Hi Sarah, thanks for joining. How are the CI/CD pipelines treating you?\nSarah (CTO): Honestly, they're a mess. We're losing 4 hours a week per dev.\nSalesIQ: That's significant. If we could cut that to 15 minutes, what would that mean for your roadmap?\nSarah: It would be a game changer. We could pull in the Q1 release.\n... [Later in Negotiation] ...\nMike (CFO): I like the tech, but we have a strict freeze on new SaaS tools for Q4.\nSalesIQ: Understood, Mike. If we can show that this tool pays for itself in 6 months through dev productivity, is there an 'Innovation' bucket we can look at?\nMike: Possibly, but the ROI case has to be bulletproof."
  };
};

// Seed function for demo data
export const seedDemoCalls = async (): Promise<void> => {
    const demoCalls: SavedCall[] = [
        {
            id: 'demo-1',
            fileName: 'Discovery_Call_AcmeCorp.mp3',
            dateSaved: Date.now() - 86400000 * 2, // 2 days ago
            summary: "Strong discovery call identifying pain points around scaling. Good rapport established, but missed a key pricing objection regarding seat licensing.",
            stats: { callScore: 82, wpm: 145, interruptions: 3, longestMonologue: 45, patienceScore: 78, duration: "12:30", scoreBreakdown: { talkRatioContribution: 20, patienceContribution: 20, sentimentContribution: 25, interruptionsContribution: 17 } },
            isExemplar: true,
            analysisData: { 
                talkRatio: { sales: 42, prospect: 58 },
                dealIntelligence: { 
                  buyingCommittee: [{ role: 'Decision Maker', nameOrReference: 'John (VP Eng)', sentiment: 'Positive' }, { role: 'Influencer', nameOrReference: 'Sarah (Ops)', sentiment: 'Neutral' }], 
                  riskAnalysis: { riskLevel: 'Low', riskScore: 20, riskFactors: ["Timeline uncertainty"] }, 
                  dealStage: { recommendedStage: 'Proposal', currentStage: 'Discovery', justification: 'Needs identified, budget confirmed.' }, 
                  intents: [{ category: 'Buying', score: 85, evidence: "We definitely need a solution by Q3." }] 
                },
                coachingCard: { 
                  overallSummary: "Strong discovery call identifying pain points around scaling. Good rapport established.", 
                  nextActions: ["Send technical specs to Sarah", "Schedule demo with John"], 
                  keyTakeaways: ["Pain point: Manual data entry", "Timeline: Q3 Launch"], 
                  strengths: ["Active Listening", "Agenda Setting"], 
                  missedOpportunities: ["Did not dig deep into budget approval process"], 
                  keyQuestions: ["What happens if you don't solve this problem?", "Who else needs to sign off?"], 
                  objectionsHandled: ["Security Compliance"], 
                  salesPitchAssessment: { score: 85, clarity: "Good", hook: "Strong", callToAction: "Clear" }, 
                  closingSuggestions: [{ strategy: "Assumptive Close", rationale: "Prospect is engaged." }], 
                  improvementAreas: ["Pause more after asking questions"], 
                  predictedOutcome: { score: 75, label: "High Likelihood", rationale: "Good fit and urgent need." } 
                },
                callStats: { callScore: 82, wpm: 145, interruptions: 3, longestMonologue: 45, patienceScore: 78, duration: "12:30", scoreBreakdown: { talkRatioContribution: 20, patienceContribution: 20, sentimentContribution: 25, interruptionsContribution: 17 } },
                transcript: [],
                sentimentGraph: [
                  { timeOffset: 0, score: 50, label: "Neutral", insight: "Intro" },
                  { timeOffset: 20, score: 40, label: "Negative", insight: "Problem description" },
                  { timeOffset: 50, score: 80, label: "Positive", insight: "Solution vision" },
                  { timeOffset: 75, score: 30, label: "Negative", insight: "Pricing Objection" },
                  { timeOffset: 100, score: 60, label: "Neutral", insight: "Next Steps" }
                ], 
                topics: [{ name: "Workflow", relevance: 80, description: "Manual entry issues" }, { name: "Pricing", relevance: 60, description: "Per-seat model concern" }], 
                competitors: [], 
                silenceAnalysis: { listeningRatio: 60, smartSilenceCount: 5, awkwardSilenceCount: 1, explanation: "Good use of silence after questions." }, 
                compliance: { complianceScore: 100, forbiddenPhrasesDetected: [], requiredStatements: [{ statement: "Call Recording Consent", status: "Present" }] }, 
                customerProfile: { discType: 'Dominance', communicationStyle: "Direct", sellingTips: ["Be concise", "Focus on ROI"] }, 
                followUp: { emailSubject: "Acme Corp <> SalesIQ Next Steps", emailBody: "Hi John,\n\nGreat chatting today...", agendaItems: ["Review Tech Specs", "Discuss Pricing"] }
            } as any
        },
        {
            id: 'demo-2',
            fileName: 'Contract_Review_Globex.wav',
            dateSaved: Date.now() - 86400000 * 5, // 5 days ago
            summary: "Negotiation session. Prospect pushed back hard on the enterprise tier pricing. Handled objections well but conceded discount too early.",
            stats: { callScore: 74, wpm: 160, interruptions: 8, longestMonologue: 60, patienceScore: 65, duration: "24:10", scoreBreakdown: { talkRatioContribution: 15, patienceContribution: 15, sentimentContribution: 20, interruptionsContribution: 10 } },
            isExemplar: false,
            analysisData: { 
                talkRatio: { sales: 55, prospect: 45 },
                dealIntelligence: { 
                  buyingCommittee: [{ role: 'Blocker', nameOrReference: 'CFO', sentiment: 'Negative' }], 
                  riskAnalysis: { riskLevel: 'High', riskScore: 75, riskFactors: ["Budget cuts", "Competitor undercut"] }, 
                  dealStage: { recommendedStage: 'Negotiation', currentStage: 'Negotiation', justification: 'Price friction.' }, 
                  intents: [{ category: 'Risk', score: 90, evidence: "We are looking at cheaper options." }] 
                },
                coachingCard: { 
                  overallSummary: "Tough negotiation on pricing. Prospect pushed back hard on the enterprise tier.", 
                  predictedOutcome: { score: 45, label: "Medium Likelihood", rationale: "Price sensitivity high." },
                  strengths: ["Polite Pushback"], missedOpportunities: ["Failed to anchor value"], nextActions: ["Send revised proposal"]
                },
                callStats: { callScore: 74, wpm: 160, interruptions: 8, longestMonologue: 60, patienceScore: 65, duration: "24:10", scoreBreakdown: { talkRatioContribution: 15, patienceContribution: 15, sentimentContribution: 20, interruptionsContribution: 10 } },
                transcript: [],
                sentimentGraph: [{timeOffset: 0, score: 60, label: "Neutral", insight: "Start"}],
                topics: [{name: "Budget", relevance: 90, description: "Cost reduction"}],
                competitors: [{name: "CompetitorX", mentionCount: 3, context: "They offered 20% less", suggestedRebuttal: "Highlight our superior support"}],
                silenceAnalysis: { listeningRatio: 45, smartSilenceCount: 1, awkwardSilenceCount: 4, explanation: "Rushed to fill silences." },
                compliance: { complianceScore: 85, forbiddenPhrasesDetected: [{phrase: "To be honest", severity: "Warning", context: "To be honest, we can drop price", correction: "Transparently"}], requiredStatements: [] },
                customerProfile: { discType: 'Conscientiousness', communicationStyle: "Analytical", sellingTips: ["Provide data", "Be precise"] },
                followUp: { emailSubject: "Revised Proposal", emailBody: "Attached...", agendaItems: [] }
            } as any
        },
        {
            id: 'demo-3',
            fileName: 'Tech_Demo_Initech.mp3',
            dateSaved: Date.now() - 86400000 * 10, // 10 days ago
            summary: "Excellent technical demo. Addressed all security concerns with confidence. The CTO was very impressed.",
            stats: { callScore: 94, wpm: 135, interruptions: 1, longestMonologue: 30, patienceScore: 92, duration: "45:00", scoreBreakdown: { talkRatioContribution: 25, patienceContribution: 25, sentimentContribution: 25, interruptionsContribution: 19 } },
            isExemplar: true,
            analysisData: { 
                talkRatio: { sales: 35, prospect: 65 },
                dealIntelligence: { 
                  buyingCommittee: [{ role: 'Decision Maker', nameOrReference: 'CTO', sentiment: 'Positive' }], 
                  riskAnalysis: { riskLevel: 'Low', riskScore: 10, riskFactors: [] }, 
                  dealStage: { recommendedStage: 'Contract', currentStage: 'Demo', justification: 'Technical win secured.' }, 
                  intents: [{ category: 'Buying', score: 95, evidence: "This is exactly what we need." }] 
                },
                coachingCard: { 
                  overallSummary: "Excellent technical demo. Addressed all security concerns.", 
                  predictedOutcome: { score: 95, label: "High Likelihood", rationale: "Technical win secured." },
                  strengths: ["Technical Knowledge", "Patience"], missedOpportunities: [], nextActions: ["Send contract"]
                },
                callStats: { callScore: 94, wpm: 135, interruptions: 1, longestMonologue: 30, patienceScore: 92, duration: "45:00", scoreBreakdown: { talkRatioContribution: 25, patienceContribution: 25, sentimentContribution: 25, interruptionsContribution: 19 } },
                transcript: [],
                sentimentGraph: [{timeOffset: 0, score: 70, label: "Positive", insight: "Tech deep dive"}],
                topics: [{name: "Security", relevance: 95, description: "SOC2 Compliance"}],
                competitors: [],
                silenceAnalysis: { listeningRatio: 65, smartSilenceCount: 8, awkwardSilenceCount: 0, explanation: "Great listening." },
                compliance: { complianceScore: 100, forbiddenPhrasesDetected: [], requiredStatements: [] },
                customerProfile: { discType: 'Steadiness', communicationStyle: "Calm", sellingTips: ["Build trust", "Go slow"] },
                followUp: { emailSubject: "Security Docs", emailBody: "Here are the docs...", agendaItems: [] }
            } as any
        }
    ];

    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Use put to upsert based on ID
    demoCalls.forEach(call => store.put(call));
    
    return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
    });
}
