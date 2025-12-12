
import React, { useState } from 'react';
import { ProspectProfile, FollowUpContent } from '../types';
import { UserCog, BrainCircuit, Mail, Copy, Check, Calendar, ChevronDown, ListChecks } from 'lucide-react';

interface CustomerProfileProps {
  profile: ProspectProfile;
  followUp: FollowUpContent;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ profile, followUp }) => {
  const [copied, setCopied] = useState(false);
  const [selectedTone, setSelectedTone] = useState<'Default' | 'Professional' | 'Friendly' | 'Urgent'>('Default');

  // Determine current email content based on selected tone
  const currentEmail = React.useMemo(() => {
    if (selectedTone === 'Default' || !followUp.emailVariations) {
      return { subject: followUp.emailSubject, body: followUp.emailBody };
    }
    const variation = followUp.emailVariations.find(v => v.tone === selectedTone);
    return variation ? { subject: variation.subject, body: variation.body } : { subject: followUp.emailSubject, body: followUp.emailBody };
  }, [selectedTone, followUp]);

  const handleCopy = () => {
    const text = `Subject: ${currentEmail.subject}\n\n${currentEmail.body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadICS = () => {
    const now = new Date();
    // Start tomorrow at 10 AM
    const start = new Date(now);
    start.setDate(start.getDate() + 1);
    start.setHours(10, 0, 0, 0);
    
    // End 1 hour later
    const end = new Date(start);
    end.setHours(11, 0, 0, 0);

    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SalesIQ//Coach//EN
BEGIN:VEVENT
UID:${Date.now()}@salesiq.app
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:Follow-up: ${currentEmail.subject}
DESCRIPTION:${(followUp.agendaItems || []).map(i => `• ${i}`).join('\\n')}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'follow_up.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDiscColor = (type: string) => {
    switch (type) {
      case 'Dominance': return 'text-red-600 bg-red-50 border-red-200';
      case 'Influence': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Steadiness': return 'text-green-600 bg-green-50 border-green-200';
      case 'Conscientiousness': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      
      {/* Prospect Personality */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <BrainCircuit className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800">Prospect Personality (DiSC)</h3>
        </div>

        <div className="flex items-center gap-6 mb-6">
           {profile.avatarBase64 ? (
              <div className="relative">
                 <img 
                    src={`data:image/png;base64,${profile.avatarBase64}`} 
                    alt="AI Generated Prospect Avatar" 
                    className={`w-24 h-24 rounded-full object-cover border-4 shadow-md ${getDiscColor(profile.discType)}`}
                 />
                 <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm border-2 border-white">
                    AI GEN
                 </div>
              </div>
           ) : (
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold border-2 shadow-sm ${getDiscColor(profile.discType)}`}>
                {profile.discType.charAt(0)}
              </div>
           )}
           
           <div>
             <h4 className="font-bold text-xl text-slate-800">{profile.discType}</h4>
             <p className="text-sm text-slate-500 font-medium mb-1">{profile.communicationStyle}</p>
             <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getDiscColor(profile.discType)}`}>
               Analyzed
             </span>
           </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex-grow">
          <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
            <UserCog className="w-3 h-3" /> Adaptation Strategy
          </h5>
          <ul className="space-y-2">
            {(profile.sellingTips || []).map((tip, idx) => (
              <li key={idx} className="text-sm text-slate-700 flex gap-2 items-start">
                <span className="text-indigo-500 font-bold">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Smart Follow-Up */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-slate-800">Smart Follow-Up</h3>
          </div>
          
          <div className="flex gap-2">
            {/* Tone Selector */}
            <div className="relative group">
               <button className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                 {selectedTone === 'Default' ? 'Default Tone' : `${selectedTone} Tone`}
                 <ChevronDown className="w-3 h-3" />
               </button>
               <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-32 hidden group-hover:block z-20">
                 {['Default', 'Professional', 'Friendly', 'Urgent'].map(tone => (
                   <button 
                     key={tone}
                     onClick={() => setSelectedTone(tone as any)}
                     className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 ${selectedTone === tone ? 'text-blue-600 font-bold' : 'text-slate-600'}`}
                   >
                     {tone}
                   </button>
                 ))}
               </div>
            </div>

            <button 
              onClick={downloadICS}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
              title="Add to Calendar (.ics)"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex-grow bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-xs text-slate-700 leading-relaxed overflow-y-auto max-h-[400px] custom-scrollbar">
           <div className="mb-3 pb-3 border-b border-slate-200">
             <span className="text-slate-400 select-none">Subject: </span>
             <span className="font-bold text-slate-800">{currentEmail.subject}</span>
           </div>
           <div className="whitespace-pre-wrap">{currentEmail.body}</div>
           
           {(followUp.agendaItems || []).length > 0 && (
             <div className="mt-4 pt-4 border-t border-slate-200 border-dashed">
               <p className="text-slate-400 mb-2 font-bold select-none">Proposed Agenda:</p>
               <ul className="list-disc pl-4 space-y-1">
                 {(followUp.agendaItems || []).map((item, idx) => (
                   <li key={idx}>{item}</li>
                 ))}
               </ul>
             </div>
           )}

           {(followUp.proposalBullets || []).length > 0 && (
             <div className="mt-4 pt-4 border-t border-slate-200 border-dashed">
               <div className="flex items-center gap-2 mb-2">
                 <ListChecks className="w-3.5 h-3.5 text-indigo-500" />
                 <p className="text-slate-400 font-bold select-none">Proposal Bullets:</p>
               </div>
               <ul className="list-disc pl-4 space-y-1 bg-white p-3 rounded border border-slate-200">
                 {(followUp.proposalBullets || []).map((item, idx) => (
                   <li key={idx} className="text-indigo-900">{item}</li>
                 ))}
               </ul>
             </div>
           )}
        </div>
      </div>

    </div>
  );
};