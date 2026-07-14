
import { SalesAnalysisResult, QABatchStats, QACallRecord, ComplianceCheck, FullDealAnalysis } from '../types';

export const downloadCSV = (content: string, filename: string) => {
  // Add Byte Order Mark (BOM) for Excel UTF-8 compatibility
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Common CSS styles to mimic the application's UI in print
const REPORT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
  
  body { 
    font-family: 'Inter', sans-serif; 
    color: #1e293b; 
    line-height: 1.5; 
    margin: 0; 
    padding: 20px;
    background: #fff;
    -webkit-print-color-adjust: exact; 
    print-color-adjust: exact; 
  }

  .header {
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
  .subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }
  .timestamp { font-size: 12px; color: #94a3b8; font-family: monospace; }

  h2 { 
    font-size: 16px; 
    font-weight: 700; 
    text-transform: uppercase; 
    letter-spacing: 0.05em; 
    color: #475569; 
    margin: 30px 0 15px 0; 
    border-left: 4px solid #2563eb;
    padding-left: 10px;
  }

  /* Grid Layouts */
  .grid { display: grid; gap: 15px; }
  .cols-3 { grid-template-columns: repeat(3, 1fr); }
  .cols-4 { grid-template-columns: repeat(4, 1fr); }
  .cols-2 { grid-template-columns: 1fr 1fr; }

  /* Cards */
  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  }

  .metric-card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  }

  .metric-val { font-size: 32px; font-weight: 800; color: #0f172a; line-height: 1; }
  .metric-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-top: 8px; }

  /* Colors */
  .text-blue { color: #2563eb; }
  .text-green { color: #059669; }
  .text-red { color: #dc2626; }
  .text-amber { color: #d97706; }

  .bg-blue { background-color: #eff6ff; border-color: #dbeafe; }
  .bg-green { background-color: #ecfdf5; border-color: #d1fae5; }
  .bg-red { background-color: #fef2f2; border-color: #fee2e2; }
  .bg-amber { background-color: #fffbeb; border-color: #fef3c7; }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .badge-crit { background: #fee2e2; color: #b91c1c; }
  .badge-warn { background: #ffedd5; color: #c2410c; }
  .badge-safe { background: #d1fae5; color: #047857; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
  th { text-align: left; background: #f8fafc; color: #64748b; font-weight: 600; padding: 12px 15px; border-bottom: 2px solid #e2e8f0; font-size: 11px; text-transform: uppercase; }
  td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  tr:last-child td { border-bottom: none; }
  
  /* Lists */
  ul { list-style: none; padding: 0; margin: 0; }
  li { padding: 8px 0; border-bottom: 1px solid #f8fafc; display: flex; align-items: flex-start; gap: 10px; }
  li::before { content: "•"; color: #2563eb; font-weight: bold; }
  
  .section-summary { 
    background: #f8fafc; 
    padding: 20px; 
    border-radius: 12px; 
    font-size: 14px; 
    color: #334155; 
    border-left: 4px solid #6366f1;
  }
`;

export const triggerBrowserPrint = (title: string, contentHTML: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to export PDF.");
    return;
  }
  
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>${REPORT_STYLES}</style>
      </head>
      <body>
        ${contentHTML}
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const exportSingleCallReport = (data: SalesAnalysisResult, filename: string, format: 'CSV' | 'PDF' = 'CSV') => {
  const cleanFilename = filename.replace(/\.[^/.]+$/, "");

  if (format === 'PDF') {
    const html = `
      <div class="header">
        <div>
          <h1>Sales Analysis Report</h1>
          <div class="subtitle">${cleanFilename}</div>
        </div>
        <div class="timestamp">
          <div style="font-weight:bold; color:#334155;">Generated by SalesIQ</div>
          <div>${new Date().toLocaleString()}</div>
        </div>
      </div>

      <!-- Top Metrics -->
      <div class="grid cols-3">
        <div class="metric-card bg-blue">
          <div class="metric-val text-blue">${data.callStats.callScore}</div>
          <div class="metric-label">Call Score</div>
        </div>
        <div class="metric-card ${data.dealIntelligence.riskAnalysis.riskLevel === 'Low' ? 'bg-green' : data.dealIntelligence.riskAnalysis.riskLevel === 'Medium' ? 'bg-amber' : 'bg-red'}">
          <div class="metric-val ${data.dealIntelligence.riskAnalysis.riskLevel === 'Low' ? 'text-green' : data.dealIntelligence.riskAnalysis.riskLevel === 'Medium' ? 'text-amber' : 'text-red'}">
            ${data.dealIntelligence.riskAnalysis.riskLevel}
          </div>
          <div class="metric-label">Risk Level</div>
        </div>
        <div class="metric-card bg-amber">
          <div class="metric-val text-amber">${data.compliance.complianceScore}</div>
          <div class="metric-label">Compliance Score</div>
        </div>
      </div>
      
      <!-- Executive Summary -->
      <h2>Executive Summary</h2>
      <div class="section-summary">
        <p style="margin:0; font-style:italic;">"${data.coachingCard.overallSummary}"</p>
      </div>

      <!-- Analysis Grid -->
      <div class="grid cols-2" style="margin-top: 30px;">
        <div class="card" style="border-top:4px solid #059669;">
           <h3 style="margin-top:0; font-size:14px; font-weight:700; color:#059669; display:flex; align-items:center; gap:8px;">
             ✅ Winning Moments
           </h3>
           <ul>
             ${(data.coachingCard.strengths || []).length > 0 
                ? (data.coachingCard.strengths || []).map(s => `<li>${s}</li>`).join('')
                : '<li style="color:#94a3b8; font-style:italic;">No specific strengths highlighted.</li>'
             }
           </ul>
        </div>

        <div class="card" style="border-top:4px solid #d97706;">
           <h3 style="margin-top:0; font-size:14px; font-weight:700; color:#d97706; display:flex; align-items:center; gap:8px;">
             ⚠️ Missed Opportunities
           </h3>
           <ul>
             ${(data.coachingCard.missedOpportunities || []).length > 0 
                ? (data.coachingCard.missedOpportunities || []).map(m => `<li>${m}</li>`).join('')
                : '<li style="color:#94a3b8; font-style:italic;">No missed opportunities detected.</li>'
             }
           </ul>
        </div>
      </div>

      <!-- Action Plan -->
      <h2>Next Steps & Action Plan</h2>
      <div class="card bg-blue" style="border-color:#bfdbfe;">
        <ul>
          ${(data.coachingCard.nextActions || []).map(a => `<li style="border-bottom:1px solid #dbeafe; color:#1e40af;"><b>👉</b> ${a}</li>`).join('')}
        </ul>
      </div>

      <!-- Compliance Table -->
      <h2>Compliance Audit</h2>
      ${(data.compliance.forbiddenPhrasesDetected || []).length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Phrase Detected</th>
              <th>Severity</th>
              <th>Context</th>
            </tr>
          </thead>
          <tbody>
            ${(data.compliance.forbiddenPhrasesDetected || []).map(v => `
              <tr>
                <td><span class="badge ${v.severity === 'Critical' ? 'badge-crit' : 'badge-warn'}">${v.phrase}</span></td>
                <td><strong>${v.severity}</strong></td>
                <td style="font-style:italic;">"${v.context}"</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `
        <div class="card bg-green" style="text-align:center; color:#059669; font-weight:bold; padding:20px;">
          ✅ Clean Call. No compliance violations detected.
        </div>
      `}
      
      <div style="margin-top:50px; text-align:center; font-size:11px; color:#94a3b8; border-top:1px solid #f1f5f9; padding-top:20px;">
        SalesIQ AI Analysis • Confidential Report
      </div>
    `;
    triggerBrowserPrint(`Report - ${cleanFilename}`, html);
    return;
  }

  // CSV Generation Logic
  const headers = ['Category', 'Metric', 'Value', 'Details'];
  const rows = [];

  // Stats
  rows.push(['Stats', 'Call Score', data.callStats.callScore, '']);
  rows.push(['Stats', 'WPM', data.callStats.wpm, '']);
  rows.push(['Stats', 'Talk Ratio (Sales)', `${data.talkRatio.sales}%`, '']);
  
  // Intelligence
  rows.push(['Deal Intel', 'Risk Level', data.dealIntelligence.riskAnalysis.riskLevel, '']);
  rows.push(['Deal Intel', 'Predicted Outcome', data.coachingCard.predictedOutcome.label, data.coachingCard.predictedOutcome.rationale]);

  // Coaching
  (data.coachingCard.strengths || []).forEach(s => rows.push(['Strength', '', s, '']));
  (data.coachingCard.missedOpportunities || []).forEach(m => rows.push(['Missed Opp', '', m, '']));
  (data.coachingCard.nextActions || []).forEach(a => rows.push(['Action Item', '', a, '']));

  // Compliance
  rows.push(['Compliance', 'Score', data.compliance.complianceScore, '']);
  (data.compliance.forbiddenPhrasesDetected || []).forEach(v => 
    rows.push(['Violation', v.phrase, v.severity, v.context])
  );

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  downloadCSV(csvContent, `${cleanFilename}_Report.csv`);
};

export const exportQABatchReport = (stats: QABatchStats, calls: QACallRecord[], format: 'CSV' | 'PDF' = 'CSV') => {
  const dateStr = new Date().toISOString().split('T')[0];

  if (format === 'PDF') {
    const html = `
      <div class="header">
        <div>
          <h1>QA Batch Analysis</h1>
          <div class="subtitle">Compliance Audit Report</div>
        </div>
        <div class="timestamp">${dateStr}</div>
      </div>

      <div class="grid cols-4">
        <div class="metric-card">
          <div class="metric-val text-blue">${stats.averageScore}</div>
          <div class="metric-label">Avg Score</div>
        </div>
        <div class="metric-card">
          <div class="metric-val text-amber">${stats.totalCalls}</div>
          <div class="metric-label">Calls Processed</div>
        </div>
        <div class="metric-card ${stats.criticalFlagCount > 0 ? 'bg-red' : ''}">
          <div class="metric-val text-red">${stats.criticalFlagCount}</div>
          <div class="metric-label">Critical Risks</div>
        </div>
         <div class="metric-card bg-green">
          <div class="metric-val text-green">${stats.cleanCallCount}</div>
          <div class="metric-label">Clean Calls</div>
        </div>
      </div>

      <div class="grid cols-2" style="grid-template-columns: 2fr 1fr; margin-top:30px;">
        <div class="card">
          <h3 style="margin-top:0; font-size:14px; font-weight:700; color:#334155; margin-bottom:15px;">Top Violations</h3>
          ${(stats.topViolations || []).map(v => `
             <div style="margin-bottom:10px;">
               <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; margin-bottom:4px;">
                 <span>"${v.phrase}"</span>
                 <span>${v.count}</span>
               </div>
               <div style="background:#f1f5f9; height:8px; border-radius:4px; overflow:hidden;">
                  <div style="background:#ef4444; height:100%; width:${Math.min((v.count / stats.totalCalls) * 100, 100)}%;"></div>
               </div>
             </div>
          `).join('')}
        </div>
        <div class="card bg-red">
           <h3 style="margin-top:0; font-size:14px; font-weight:700; color:#b91c1c;">Coaching Needed</h3>
           <ul>
             ${(stats.lowestPerformingReps || []).map(r => `
               <li style="justify-content:space-between; border-color:#fee2e2;">
                 <span style="font-weight:600;">${r.name}</span>
                 <span class="badge badge-crit">${r.avgScore}</span>
               </li>
             `).join('')}
           </ul>
        </div>
      </div>

      <h2>Call Detail Log</h2>
      <table>
        <thead><tr><th>Rep</th><th>File</th><th>Score</th><th>Status</th><th>Violations</th></tr></thead>
        <tbody>
          ${(calls || []).map(c => `
            <tr>
              <td style="font-weight:600;">${c.repName}</td>
              <td style="color:#64748b;">${c.filename}</td>
              <td><span style="font-weight:800; color:${c.qaScore < 70 ? '#dc2626' : c.qaScore < 90 ? '#d97706' : '#059669'}">${c.qaScore}</span></td>
              <td><span class="badge ${c.status === 'Critical' ? 'badge-crit' : c.status === 'Review Needed' ? 'badge-warn' : 'badge-safe'}">${c.status}</span></td>
              <td>${c.violations.length > 0 ? `<span style="color:#dc2626; font-weight:bold;">${c.violations.length}</span>` : '<span style="color:#cbd5e1">-</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    triggerBrowserPrint(`QA Batch Report ${dateStr}`, html);
    return;
  }

  // CSV Generation (Unchanged)
  const summaryHeaders = ['Metric', 'Value'];
  const summaryRows = [
    ['Total Calls', stats.totalCalls],
    ['Average Score', stats.averageScore],
    ['Critical Calls', stats.criticalFlagCount],
    ['Clean Calls', stats.cleanCallCount]
  ];

  const detailHeaders = ['Filename', 'Rep Name', 'Date', 'Score', 'Status', 'Risk Level', 'Violations Count', 'Missing Scripts'];
  const detailRows = (calls || []).map(c => [
    c.filename,
    c.repName,
    c.date,
    c.qaScore,
    c.status,
    c.riskLevel,
    c.violations.length,
    c.missingRequiredScripts.join('; ')
  ]);

  const csvContent = [
    '--- SUMMARY ---',
    summaryHeaders.join(','),
    ...summaryRows.map(r => r.join(',')),
    '',
    '--- CALL DETAILS ---',
    detailHeaders.join(','),
    ...detailRows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  downloadCSV(csvContent, `QA_Batch_Report_${dateStr}.csv`);
};

export const exportCompliancePanel = (compliance: ComplianceCheck, format: 'CSV' | 'PDF' = 'CSV') => {
  if (format === 'PDF') {
     const html = `
      <div class="header">
        <h1>Compliance Report</h1>
        <div class="timestamp">${new Date().toLocaleString()}</div>
      </div>

      <div class="metric-card bg-amber" style="margin-bottom:30px;">
        <div class="metric-val text-amber">${compliance.complianceScore}</div>
        <div class="metric-label">Compliance Score</div>
      </div>
      
      <h2>Forbidden Phrases</h2>
      ${(compliance.forbiddenPhrasesDetected || []).length > 0 ? `
        <table>
          <thead><tr><th>Phrase</th><th>Severity</th><th>Context</th></tr></thead>
          <tbody>
            ${(compliance.forbiddenPhrasesDetected || []).map(v => `
              <tr>
                <td><span class="badge ${v.severity === 'Critical' ? 'badge-crit' : 'badge-warn'}">${v.phrase}</span></td>
                <td>${v.severity}</td>
                <td style="font-style:italic;">"${v.context}"</td>
              </tr>`).join('')}
          </tbody>
        </table>
      ` : '<div class="card bg-green" style="text-align:center; color:#059669; font-weight:bold;">✅ No forbidden phrases detected.</div>'}

      <h2>Required Scripts Check</h2>
      <div class="card">
        <ul>
          ${(compliance.requiredStatements || []).map(s => `
            <li style="justify-content:space-between;">
              <span>${s.statement}</span>
              <span class="badge ${s.status === 'Present' ? 'badge-safe' : 'badge-crit'}">${s.status}</span>
            </li>`).join('')}
        </ul>
      </div>
    `;
    triggerBrowserPrint('Compliance Report', html);
    return;
  }

  // CSV Generation (Unchanged)
  const headers = ['Type', 'Item', 'Status/Severity', 'Context'];
  const rows = [];
  
  rows.push(['Meta', 'Score', compliance.complianceScore, '']);
  
  (compliance.forbiddenPhrasesDetected || []).forEach(f => {
    rows.push(['Forbidden Phrase', f.phrase, f.severity, f.context]);
  });

  (compliance.requiredStatements || []).forEach(r => {
    rows.push(['Required Script', r.statement, r.status, '']);
  });

   const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  downloadCSV(csvContent, `Compliance_Report.csv`);
};

export const downloadScript = (script: string, filename: string) => {
  const blob = new Blob([script], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportDealReport = (data: FullDealAnalysis, format: 'CSV' | 'PDF' = 'CSV') => {
    if (format === 'PDF') {
        const html = `
        <div class="header">
            <div>
            <h1>Deal Intelligence Report</h1>
            <div class="subtitle">${data.dealName}</div>
            </div>
            <div class="timestamp">Generated by SalesIQ • ${new Date().toLocaleString()}</div>
        </div>

        <div class="grid cols-2">
            <div class="metric-card ${data.winProbability.label.includes('High') ? 'bg-green' : data.winProbability.label.includes('Medium') ? 'bg-amber' : 'bg-red'}">
                <div class="metric-val ${data.winProbability.label.includes('High') ? 'text-green' : data.winProbability.label.includes('Medium') ? 'text-amber' : 'text-red'}">
                    ${data.winProbability.score}%
                </div>
                <div class="metric-label">Win Probability</div>
            </div>
             <div class="metric-card bg-blue">
                <div class="metric-val text-blue">${data.overallSentimentTrend}</div>
                <div class="metric-label">Sentiment Trend</div>
            </div>
        </div>

        <h2>Executive Summary</h2>
        <div class="section-summary">
            "${data.executiveSummary}"
        </div>

        <div class="grid cols-2" style="margin-top: 30px;">
           <div class="card">
             <h3 style="margin-top:0; color:#059669; font-size:14px; font-weight:700;">Winning Moments</h3>
             <ul>
               ${data.keyMoments && data.keyMoments.length > 0 ? (data.keyMoments || []).map(m => `<li>${m}</li>`).join('') : '<li style="color:#94a3b8; font-style:italic;">None detected.</li>'}
             </ul>
           </div>
           <div class="card">
             <h3 style="margin-top:0; color:#d97706; font-size:14px; font-weight:700;">Missed Opportunities</h3>
             <ul>
               ${data.missedOpportunities && data.missedOpportunities.length > 0 ? (data.missedOpportunities || []).map(m => `<li>${m}</li>`).join('') : '<li style="color:#94a3b8; font-style:italic;">None detected.</li>'}
             </ul>
           </div>
        </div>

        <h2>Deal Health QA</h2>
        <table>
            <thead><tr><th>Check</th><th>Status</th><th>Details</th></tr></thead>
            <tbody>
                ${data.dealHealthChecks && (data.dealHealthChecks || []).map(c => `
                    <tr>
                        <td style="font-weight:600;">${c.check}</td>
                        <td><span class="badge ${c.status === 'Pass' ? 'badge-safe' : c.status === 'Fail' ? 'badge-crit' : 'badge-warn'}">${c.status}</span></td>
                        <td>${c.details}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <h2>Strategic Action Plan</h2>
        <div class="card bg-blue" style="border-color:#bfdbfe;">
            <ul>
                ${(data.actionPlan?.nextSteps || []).map(a => `<li style="border-bottom:1px solid #dbeafe; color:#1e40af;"><b>👉</b> ${a}</li>`).join('')}
            </ul>
        </div>
        `;
        triggerBrowserPrint(`Deal Report - ${data.dealName}`, html);
        return;
    }

    // CSV for Deal
    const csvContent = [
        `Deal Name,${data.dealName}`,
        `Win Probability,${data.winProbability.score}%`,
        `Trend,${data.overallSentimentTrend}`,
        '',
        '--- DEAL HEALTH QA ---',
        'Check,Status,Details',
        ...(data.dealHealthChecks || []).map(c => `"${c.check}","${c.status}","${c.details}"`),
        '',
        '--- ACTION PLAN ---',
        'Item',
        ...(data.actionPlan?.nextSteps || []).map(s => `"${s}"`)
    ].join('\n');
    downloadCSV(csvContent, `Deal_Report_${data.dealName.replace(/\s+/g, '_')}.csv`);
};