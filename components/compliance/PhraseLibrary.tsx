
import React, { useState } from 'react';
import { ComplianceRule, ViolationSeverity } from '../../types';
import { Plus, Trash2, ShieldAlert, FileText, Check, X } from 'lucide-react';

interface PhraseLibraryProps {
  rules: ComplianceRule[];
  onUpdateRules?: (rules: ComplianceRule[]) => void;
}

export const PhraseLibrary: React.FC<PhraseLibraryProps> = ({ rules, onUpdateRules }) => {
  const [activeTab, setActiveTab] = useState<'Forbidden' | 'Required'>('Forbidden');
  const [isAdding, setIsAdding] = useState(false);
  const [newRule, setNewRule] = useState<Partial<ComplianceRule>>({
    phrase: '',
    severity: 'Warning',
    category: 'General'
  });

  const filteredRules = rules.filter(r => r.type === activeTab);

  const handleDelete = (id: string) => {
    if (onUpdateRules) {
      onUpdateRules(rules.filter(r => r.id !== id));
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.phrase || !onUpdateRules) return;

    const rule: ComplianceRule = {
      id: Date.now().toString(),
      phrase: newRule.phrase,
      type: activeTab,
      severity: newRule.severity as ViolationSeverity || 'Warning',
      category: newRule.category || 'General',
      active: true
    };

    onUpdateRules([...rules, rule]);
    setIsAdding(false);
    setNewRule({ phrase: '', severity: 'Warning', category: 'General' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[600px] flex flex-col relative">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div>
           <h3 className="font-bold text-slate-800 text-lg">Compliance Rule Library</h3>
           <p className="text-sm text-slate-500">Manage prohibited language and mandatory scripts.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('Forbidden')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'Forbidden' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Forbidden Phrases
        </button>
        <button 
          onClick={() => setActiveTab('Required')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'Required' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Required Scripts
        </button>
      </div>

      <div className="overflow-y-auto flex-grow p-6 space-y-3">
        {filteredRules.length === 0 && (
          <p className="text-center text-slate-400 italic py-10">No rules defined for this category.</p>
        )}
        {filteredRules.map(rule => (
          <div key={rule.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg group hover:border-indigo-200 hover:shadow-sm transition-all">
             <div className="flex items-start gap-3">
                <div className={`mt-1 p-1.5 rounded-full ${rule.severity === 'Critical' ? 'bg-red-100 text-red-600' : rule.severity === 'Warning' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                   {activeTab === 'Forbidden' ? <ShieldAlert className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                </div>
                <div>
                   <p className="font-bold text-slate-800">"{rule.phrase}"</p>
                   <div className="flex gap-2 mt-1">
                      <span className="text-[10px] font-bold uppercase bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">
                        {rule.category}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                        rule.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-100' :
                        rule.severity === 'Warning' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {rule.severity}
                      </span>
                   </div>
                </div>
             </div>
             
             <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDelete(rule.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* Add Rule Modal */}
      {isAdding && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-10 p-4 rounded-xl">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-800">Add New Rule</h3>
               <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phrase</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder={activeTab === 'Forbidden' ? "e.g., Guarantee" : "e.g., Recording Consent"}
                  value={newRule.phrase}
                  onChange={e => setNewRule({...newRule, phrase: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Severity</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    value={newRule.severity}
                    onChange={e => setNewRule({...newRule, severity: e.target.value as any})}
                  >
                    <option value="Critical">Critical</option>
                    <option value="Warning">Warning</option>
                    <option value="Info">Info</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Legal"
                    value={newRule.category}
                    onChange={e => setNewRule({...newRule, category: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg mt-2 transition-colors"
              >
                Save Rule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
