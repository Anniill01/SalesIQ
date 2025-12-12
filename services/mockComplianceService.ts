
import { QACallRecord, QABatchStats, ComplianceRule } from '../types';

const REPS = ["Sarah Jenkins", "Michael Chen", "David Miller", "Jessica Wu", "Robert Fox", "Amanda Low", "James Wilson"];
const VIOLATIONS = [
  { phrase: "Guarantee", severity: "Critical", fix: "We aim to deliver..." },
  { phrase: "Refund", severity: "Critical", fix: "Our policy ensures..." },
  { phrase: "To be honest", severity: "Warning", fix: "Ideally, avoid filler..." },
  { phrase: "Trust me", severity: "Warning", fix: "Based on the data..." },
  { phrase: "Cheap", severity: "Warning", fix: "Cost-effective" },
  { phrase: "No problem", severity: "Info", fix: "You're welcome" },
  { phrase: "Risk-free", severity: "Critical", fix: "Low risk assessment" },
  { phrase: "I promise", severity: "Warning", fix: "We are committed to" }
];

const REQUIRED_SCRIPTS = [
  "This call is being recorded",
  "Pricing disclaimer",
  "Next steps confirmation",
  "Data privacy notice"
];

// Generate a random date within the last 30 days
const getRandomDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 30));
  return date.toISOString().split('T')[0];
};

export const generateMockBatchData = (uploadedFiles: File[] = []): { calls: QACallRecord[], stats: QABatchStats } => {
  // If no files uploaded, generate 15 dummy ones
  const count = uploadedFiles.length > 0 ? uploadedFiles.length : 15;
  
  const calls: QACallRecord[] = Array.from({ length: count }).map((_, i) => {
    const file = uploadedFiles[i];
    const rep = REPS[Math.floor(Math.random() * REPS.length)];
    const hasViolation = Math.random() > 0.4; // 40% chance of violation
    const hasMissingScript = Math.random() > 0.7; // 30% chance of missing script
    
    // Calculate Score
    let score = 100;
    const violations = [];
    const missingScripts = [];

    if (hasViolation) {
      const vCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < vCount; j++) {
        const v = VIOLATIONS[Math.floor(Math.random() * VIOLATIONS.length)];
        score -= (v.severity === 'Critical' ? 20 : 5);
        violations.push({
          id: `v-${i}-${j}`,
          phrase: v.phrase,
          timestamp: `0${Math.floor(Math.random() * 9)}:${Math.floor(Math.random() * 59)}`,
          severity: v.severity as any,
          speaker: 'Salesperson' as const,
          contextSnippet: `...yeah so we can ${v.phrase} that specifically if you sign today...`,
          aiExplanation: `Using '${v.phrase}' creates potential liability or mistrust.`,
          suggestedFix: v.fix
        });
      }
    }

    if (hasMissingScript) {
      const script = REQUIRED_SCRIPTS[Math.floor(Math.random() * REQUIRED_SCRIPTS.length)];
      score -= 15;
      missingScripts.push(script);
    }

    // Clamp score
    score = Math.max(0, score);

    let status: 'Clean' | 'Review Needed' | 'Critical' = 'Clean';
    if (score < 70) status = 'Critical';
    else if (score < 90) status = 'Review Needed';

    return {
      id: `call-${i}`,
      filename: file ? file.name : `recording_${rep.replace(' ', '_')}_${1000+i}.mp3`,
      repName: rep,
      date: getRandomDate(),
      duration: `${Math.floor(Math.random() * 10 + 2)}:${Math.floor(Math.random() * 59)}`,
      qaScore: score,
      riskLevel: score < 60 ? 'High' : score < 85 ? 'Medium' : 'Low',
      violations,
      missingRequiredScripts: missingScripts,
      status
    };
  });

  // Calculate Stats
  const totalCalls = calls.length;
  const averageScore = totalCalls > 0 ? Math.round(calls.reduce((acc, c) => acc + c.qaScore, 0) / totalCalls) : 0;
  const criticalFlagCount = calls.filter(c => c.status === 'Critical').length;
  const cleanCallCount = calls.filter(c => c.status === 'Clean').length;

  const topViolationsMap = new Map<string, number>();
  calls.forEach(c => c.violations.forEach(v => {
    topViolationsMap.set(v.phrase, (topViolationsMap.get(v.phrase) || 0) + 1);
  }));
  const topViolations = Array.from(topViolationsMap.entries())
    .map(([phrase, count]) => ({ phrase, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const repScores = new Map<string, {total: number, count: number}>();
  calls.forEach(c => {
    const curr = repScores.get(c.repName) || { total: 0, count: 0 };
    repScores.set(c.repName, { total: curr.total + c.qaScore, count: curr.count + 1 });
  });

  const lowestPerformingReps = Array.from(repScores.entries())
    .map(([name, data]) => ({ name, avgScore: Math.round(data.total / data.count) }))
    .sort((a, b) => a.avgScore - b.avgScore)
    .slice(0, 3);

  return {
    calls,
    stats: {
      totalCalls,
      averageScore,
      criticalFlagCount,
      cleanCallCount,
      topViolations,
      lowestPerformingReps
    }
  };
};

export const getMockRules = (): ComplianceRule[] => [
  { id: '1', phrase: 'Guarantee', type: 'Forbidden', severity: 'Critical', category: 'Legal', active: true },
  { id: '2', phrase: 'Promise', type: 'Forbidden', severity: 'Warning', category: 'Sales Hygiene', active: true },
  { id: '3', phrase: 'Refund', type: 'Forbidden', severity: 'Critical', category: 'Legal', active: true },
  { id: '4', phrase: 'Recording Consent', type: 'Required', severity: 'Critical', category: 'Compliance', active: true },
  { id: '5', phrase: 'Pricing Disclaimer', type: 'Required', severity: 'Warning', category: 'Compliance', active: true },
  { id: '6', phrase: 'Cheap', type: 'Forbidden', severity: 'Info', category: 'Brand', active: true },
  { id: '7', phrase: 'Free trial', type: 'Forbidden', severity: 'Warning', category: 'Sales Hygiene', active: true },
  { id: '8', phrase: 'Next Steps', type: 'Required', severity: 'Warning', category: 'Process', active: true },
];
