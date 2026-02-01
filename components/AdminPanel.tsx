import React, { useState } from 'react';
import { Plus, Loader2, Save, Trash2, Code2, PenTool, ClipboardList, Check, X as XIcon, Eye, ShieldAlert } from 'lucide-react';
import { Competition, Problem, CompetitionStatus, TestCase, Submission } from '../types';
import { generateProblem } from '../services/geminiService';
import { CodeEditor } from './CodeEditor';

interface AdminPanelProps {
  competitions: Competition[];
  setCompetitions: React.Dispatch<React.SetStateAction<Competition[]>>;
  submissions: Submission[];
  onGradeSubmission: (id: string, score: number, feedback: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ competitions, setCompetitions, submissions, onGradeSubmission }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'grading'>('create');
  
  // Grading State
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(100);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  // Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('manual');
  
  // AI State
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');

  // Manual Creation State
  const [manualProblem, setManualProblem] = useState<Partial<Problem>>({
    title: '',
    description: '',
    difficulty: 'Medium',
    timeLimit: 30,
    starterCode: '# Write your solution here\n'
  });
  const [manualTestCases, setManualTestCases] = useState<TestCase[]>([]);
  
  const [newCompetition, setNewCompetition] = useState<Partial<Competition>>({
    title: '',
    status: CompetitionStatus.DRAFT,
    problems: []
  });

  // --- Handlers for Grading ---
  const handleGradeSubmit = () => {
    if (selectedSubmission) {
        onGradeSubmission(selectedSubmission.id, gradeScore, gradeFeedback);
        setSelectedSubmission(null);
        setGradeScore(100);
        setGradeFeedback('');
    }
  };

  // --- Handlers for Creation ---
  const handleGenerateProblem = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const problem = await generateProblem(topic, difficulty);
      setNewCompetition(prev => ({
        ...prev,
        problems: [...(prev.problems || []), problem]
      }));
      setTopic('');
    } catch (e) {
      console.error(e);
      alert("Failed to generate problem. Check API Key.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddManualProblem = () => {
    if (!manualProblem.title || !manualProblem.description) {
        alert("Please fill in title and description.");
        return;
    }

    const problem: Problem = {
        id: crypto.randomUUID(),
        title: manualProblem.title || 'Untitled',
        description: manualProblem.description || '',
        difficulty: (manualProblem.difficulty as any) || 'Medium',
        timeLimit: manualProblem.timeLimit || 30,
        starterCode: manualProblem.starterCode || '',
        testCases: manualTestCases
    };

    setNewCompetition(prev => ({
        ...prev,
        problems: [...(prev.problems || []), problem]
    }));

    // Reset Form
    setManualProblem({
        title: '',
        description: '',
        difficulty: 'Medium',
        timeLimit: 30,
        starterCode: '# Write your solution here\n'
    });
    setManualTestCases([]);
  };

  const handleSaveCompetition = () => {
    if (!newCompetition.title || !newCompetition.problems?.length) {
      alert("Please provide a title and at least one problem.");
      return;
    }

    const comp: Competition = {
      id: crypto.randomUUID(),
      title: newCompetition.title,
      status: CompetitionStatus.ACTIVE, // Auto launch for demo
      participants: 0,
      problems: newCompetition.problems as Problem[],
      createdAt: new Date().toISOString()
    };

    setCompetitions(prev => [comp, ...prev]);
    setIsCreating(false);
    setNewCompetition({ title: '', status: CompetitionStatus.DRAFT, problems: [] });
  };

  // Test Case Helpers
  const addTestCase = () => {
      setManualTestCases([...manualTestCases, { input: '', expectedOutput: '', isHidden: false }]);
  };

  const updateTestCase = (idx: number, field: keyof TestCase, value: any) => {
      const newCases = [...manualTestCases];
      newCases[idx] = { ...newCases[idx], [field]: value };
      setManualTestCases(newCases);
  };

  const removeTestCase = (idx: number) => {
      setManualTestCases(manualTestCases.filter((_, i) => i !== idx));
  };

  // --- Render ---

  if (selectedSubmission) {
    // Grading View
    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <button onClick={() => setSelectedSubmission(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4">
                <XIcon size={16} /> Close Grading
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">{selectedSubmission.participantName}</h2>
                                <p className="text-indigo-400 text-sm">{selectedSubmission.problemTitle}</p>
                            </div>
                            <span className="text-xs text-slate-500">{new Date(selectedSubmission.submittedAt).toLocaleString()}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-800 p-3 rounded">
                                <div className="text-xs text-slate-500 uppercase">Trust Score</div>
                                <div className="text-xl font-mono font-bold text-emerald-400">
                                    {100 - (selectedSubmission.antiCheatMetrics.tabSwitches * 10) - (selectedSubmission.antiCheatMetrics.copyPasteCount * 2)}%
                                </div>
                            </div>
                            <div className="bg-slate-800 p-3 rounded">
                                <div className="text-xs text-slate-500 uppercase">Suspicious Acts</div>
                                <div className="text-xl font-mono font-bold text-yellow-400">
                                    {selectedSubmission.antiCheatMetrics.tabSwitches + selectedSubmission.antiCheatMetrics.copyPasteCount}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Score (0-100)</label>
                                <input 
                                    type="number" 
                                    min="0" max="100"
                                    value={gradeScore}
                                    onChange={(e) => setGradeScore(parseInt(e.target.value))}
                                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-mono text-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Feedback</label>
                                <textarea 
                                    value={gradeFeedback}
                                    onChange={(e) => setGradeFeedback(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white h-24"
                                    placeholder="Good logic, but check edge cases..."
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button onClick={() => { setGradeScore(0); setGradeFeedback('Code failed logic check.'); }} className="flex-1 bg-red-900/30 text-red-400 border border-red-900/50 py-2 rounded hover:bg-red-900/50">Fail</button>
                                <button onClick={() => { setGradeScore(100); setGradeFeedback('Excellent solution!'); }} className="flex-1 bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 py-2 rounded hover:bg-emerald-900/50">Pass</button>
                            </div>
                            <button 
                                onClick={handleGradeSubmit}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-bold"
                            >
                                Submit Grade
                            </button>
                        </div>
                    </div>
                </div>
                <div className="h-[600px] border border-slate-700 rounded-xl overflow-hidden">
                    <CodeEditor code={selectedSubmission.code} onChange={() => {}} readOnly={true} />
                </div>
            </div>
        </div>
    );
  }

  // Dashboard View
  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Admin Dashboard</h2>
          <p className="text-slate-400">Manage competitions and grade submissions</p>
        </div>
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
            <button 
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${activeTab === 'create' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                Competitions
            </button>
            <button 
                onClick={() => setActiveTab('grading')}
                className={`px-4 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === 'grading' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                Grading Queue
                {submissions.filter(s => s.status === 'PENDING').length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        {submissions.filter(s => s.status === 'PENDING').length}
                    </span>
                )}
            </button>
        </div>
      </header>

      {activeTab === 'grading' ? (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Pending Submissions</h3>
            {submissions.filter(s => s.status === 'PENDING').length === 0 ? (
                <div className="text-slate-500 italic text-center py-12 bg-slate-900/30 rounded border border-dashed border-slate-800">
                    All caught up! No pending submissions.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {submissions.filter(s => s.status === 'PENDING').map(sub => (
                        <div key={sub.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex justify-between items-center group hover:border-indigo-500 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                                    {sub.participantName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{sub.participantName}</h4>
                                    <p className="text-sm text-slate-400">{sub.problemTitle}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-xs text-slate-500">Submitted</div>
                                    <div className="text-sm text-slate-300">{new Date(sub.submittedAt).toLocaleTimeString()}</div>
                                </div>
                                {(sub.antiCheatMetrics.tabSwitches > 0 || sub.antiCheatMetrics.copyPasteCount > 0) && (
                                    <div className="flex items-center gap-1 text-yellow-500 bg-yellow-900/20 px-2 py-1 rounded text-xs">
                                        <ShieldAlert size={12} /> Suspicious
                                    </div>
                                )}
                                <button 
                                    onClick={() => setSelectedSubmission(sub)}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
                                >
                                    <Eye size={16} /> Review
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <h3 className="text-xl font-bold text-white mt-12 mb-4">Graded History</h3>
            <div className="opacity-60">
                {submissions.filter(s => s.status === 'GRADED').map(sub => (
                     <div key={sub.id} className="bg-slate-900 border border-slate-800 rounded p-3 mb-2 flex justify-between items-center">
                        <span className="text-slate-400">{sub.participantName} - {sub.problemTitle}</span>
                        <span className={`font-mono font-bold ${sub.score && sub.score >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {sub.score}/100
                        </span>
                     </div>
                ))}
            </div>
        </div>
      ) : (
        /* Create Tab Content */
        <div className="space-y-6">
            {!isCreating && (
                <div className="flex justify-end">
                    <button 
                        onClick={() => setIsCreating(true)} 
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg shadow-emerald-500/20"
                    >
                        <Plus size={18} /> New Competition
                    </button>
                </div>
            )}
            
            {isCreating ? (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 animate-fade-in">
                    <div className="space-y-6">
                        <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Competition Title</label>
                        <input 
                            type="text" 
                            value={newCompetition.title}
                            onChange={(e) => setNewCompetition(prev => ({...prev, title: e.target.value}))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g., Global Python Sprint 2024"
                        />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Problem Creator Card */}
                        <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
                            <div className="flex border-b border-slate-700">
                                <button 
                                    onClick={() => setCreationMode('manual')}
                                    className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${creationMode === 'manual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                >
                                    <PenTool size={16} /> Manual Builder
                                </button>
                                <button 
                                    onClick={() => setCreationMode('ai')}
                                    className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 ${creationMode === 'ai' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                >
                                    <Code2 size={16} /> AI Generator
                                </button>
                            </div>

                            <div className="p-6">
                                {creationMode === 'ai' ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-slate-400 mb-4">
                                            Describe a topic and let Gemini AI generate a complete problem with test cases, logic, and starter code.
                                        </p>
                                        <div>
                                            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Topic</label>
                                            <input 
                                            type="text" 
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-emerald-500 outline-none"
                                            placeholder="e.g. Recursion, Matrix Multiplication"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Difficulty</label>
                                            <select 
                                            value={difficulty}
                                            onChange={(e) => setDifficulty(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white outline-none"
                                            >
                                            <option>Easy</option>
                                            <option>Medium</option>
                                            <option>Hard</option>
                                            </select>
                                        </div>
                                        <button 
                                            onClick={handleGenerateProblem}
                                            disabled={loading || !topic}
                                            className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white py-2 rounded transition-all mt-4"
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={18}/> : 'Generate Problem'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-fade-in">
                                        <div>
                                            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Title</label>
                                            <input 
                                                type="text" 
                                                value={manualProblem.title}
                                                onChange={(e) => setManualProblem(p => ({...p, title: e.target.value}))}
                                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white outline-none focus:border-indigo-500"
                                                placeholder="Problem Title"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Description</label>
                                            <textarea 
                                                value={manualProblem.description}
                                                onChange={(e) => setManualProblem(p => ({...p, description: e.target.value}))}
                                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white h-24 text-sm outline-none focus:border-indigo-500"
                                                placeholder="Detailed problem description..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Difficulty</label>
                                                <select 
                                                    value={manualProblem.difficulty}
                                                    onChange={(e) => setManualProblem(p => ({...p, difficulty: e.target.value as any}))}
                                                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm outline-none"
                                                >
                                                    <option>Easy</option>
                                                    <option>Medium</option>
                                                    <option>Hard</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Time Limit (mins)</label>
                                                <input 
                                                    type="number"
                                                    min="1"
                                                    value={manualProblem.timeLimit}
                                                    onChange={(e) => setManualProblem(p => ({...p, timeLimit: parseInt(e.target.value)}))}
                                                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm outline-none"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs uppercase tracking-wide text-slate-500 mb-1">Starter Code</label>
                                            <div className="h-32 border border-slate-600 rounded overflow-hidden">
                                                <CodeEditor 
                                                    code={manualProblem.starterCode || ''}
                                                    onChange={(val) => setManualProblem(p => ({...p, starterCode: val}))}
                                                />
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-700 pt-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-xs uppercase tracking-wide text-slate-500">Test Cases</label>
                                                <button onClick={addTestCase} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-white">+ Add Case</button>
                                            </div>
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                                {manualTestCases.map((tc, idx) => (
                                                    <div key={idx} className="flex gap-2 items-start bg-slate-800 p-2 rounded">
                                                        <div className="flex-1 space-y-1">
                                                            <input 
                                                                placeholder="Input (args)" 
                                                                value={tc.input} 
                                                                onChange={(e) => updateTestCase(idx, 'input', e.target.value)}
                                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                                            />
                                                            <input 
                                                                placeholder="Expected Output" 
                                                                value={tc.expectedOutput} 
                                                                onChange={(e) => updateTestCase(idx, 'expectedOutput', e.target.value)}
                                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                                            />
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1">
                                                            <button onClick={() => removeTestCase(idx)} className="text-slate-500 hover:text-red-400 p-1">
                                                                <Trash2 size={14} />
                                                            </button>
                                                            <label className="text-[10px] text-slate-500 flex flex-col items-center cursor-pointer">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={tc.isHidden}
                                                                    onChange={(e) => updateTestCase(idx, 'isHidden', e.target.checked)}
                                                                    className="accent-indigo-500"
                                                                />
                                                                Hidden
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                                {manualTestCases.length === 0 && (
                                                    <div className="text-xs text-slate-600 text-center py-2 italic">No test cases added</div>
                                                )}
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleAddManualProblem}
                                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-semibold transition-all"
                                        >
                                            Add Problem
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Generated Problems List */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white flex items-center justify-between">
                                <span>Competition Problems</span>
                                <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded-full">{newCompetition.problems?.length} Added</span>
                            </h3>
                            
                            {newCompetition.problems?.length === 0 && (
                            <div className="text-slate-500 text-sm italic bg-slate-900/30 p-8 rounded border border-dashed border-slate-800 text-center">
                                No problems added yet.<br/>Use the builder to add challenges.
                            </div>
                            )}

                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {newCompetition.problems?.map((prob, idx) => (
                                <div key={prob.id} className="bg-slate-900 p-4 rounded border border-slate-700 relative group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-indigo-400 font-mono text-xs">Problem {idx + 1}</span>
                                        <div className="flex gap-2">
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                {prob.timeLimit}m
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${prob.difficulty === 'Hard' ? 'bg-red-900 text-red-200' : prob.difficulty === 'Medium' ? 'bg-yellow-900 text-yellow-200' : 'bg-green-900 text-green-200'}`}>
                                            {prob.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-white mb-2">{prob.title}</h4>
                                    <p className="text-slate-400 text-sm line-clamp-2">{prob.description}</p>
                                    
                                    <button 
                                        onClick={() => {
                                            setNewCompetition(prev => ({
                                                ...prev,
                                                problems: prev.problems?.filter(p => p.id !== prob.id)
                                            }));
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-slate-800 rounded text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                ))}
                            </div>
                        </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-700">
                        <button 
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSaveCompetition}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-indigo-500/20"
                        >
                            <Save size={18} />
                            Launch Competition
                        </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {competitions.map(c => (
                        <div key={c.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                            <h3 className="font-bold text-xl text-white">{c.title}</h3>
                            <p className="text-slate-400 text-sm mt-1">{c.problems.length} Problems</p>
                            <div className="mt-4 flex gap-2">
                                <span className="bg-indigo-900 text-indigo-200 text-xs px-2 py-1 rounded">Active</span>
                            </div>
                        </div>
                    ))}
                    {competitions.length === 0 && (
                        <div className="col-span-full text-center py-20 text-slate-500">
                        No active competitions. Create one to get started.
                        </div>
                    )}
                </div>
            )}
        </div>
      )}
    </div>
  );
};