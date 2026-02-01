import React, { useState, useEffect, useMemo } from 'react';
import { Play, CheckCircle2, AlertTriangle, ShieldAlert, Timer, ChevronLeft, Send, Activity, Terminal, Clock, ArrowLeft, FileCheck } from 'lucide-react';
import { Competition, Submission, SubmissionResult } from '../types';
import { CodeEditor } from './CodeEditor';
import { runCodeSimulation } from '../services/geminiService';

interface ArenaProps {
  competition: Competition;
  participantName: string;
  onExit: () => void;
  onSubmitSolution: (submission: Submission) => void;
  submissions: Submission[];
}

export const CompetitionArena: React.FC<ArenaProps> = ({ competition, participantName, onExit, onSubmitSolution, submissions }) => {
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<SubmissionResult | null>(null);
  
  // Anti-cheat state
  const [tabSwitches, setTabSwitches] = useState(0);
  const [copyPasteCount, setCopyPasteCount] = useState(0);
  const [trustScore, setTrustScore] = useState(100);

  // Derived state
  const problem = competition.problems[currentProblemIndex];
  const existingSubmission = useMemo(() => 
    submissions.find(s => s.problemId === problem.id && s.participantName === participantName),
    [submissions, problem.id, participantName]
  );
  
  const hasSubmitted = !!existingSubmission;

  // Timer State
  const [timeLeft, setTimeLeft] = useState(problem.timeLimit * 60);

  // Initialize Code & Timer when problem changes
  useEffect(() => {
    if (existingSubmission) {
        setCode(existingSubmission.code);
    } else {
        setCode(problem.starterCode || '# Write your solution here\n');
    }
    setRunResult(null);
    setTimeLeft(problem.timeLimit * 60);
    
    // Reset anti-cheat for new problem if not submitted
    if (!existingSubmission) {
        setTabSwitches(0);
        setCopyPasteCount(0);
        setTrustScore(100);
    }
  }, [problem.id, existingSubmission]); 

  // Timer Countdown
  useEffect(() => {
    if (hasSubmitted) return; 

    const timer = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 0) {
                clearInterval(timer);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
    return () => clearInterval(timer);
  }, [problem.id, hasSubmitted]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Anti-Cheat Listeners
  useEffect(() => {
    if (hasSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1);
        setTrustScore(prev => Math.max(0, prev - 10));
      }
    };

    const handleCopyPaste = () => {
      setCopyPasteCount(prev => prev + 1);
      setTrustScore(prev => Math.max(0, prev - 2)); 
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("copy", handleCopyPaste);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("copy", handleCopyPaste);
    };
  }, [hasSubmitted, problem.id]);

  // Just run code to see output
  const handleRunCode = async () => {
    setIsRunning(true);
    setRunResult(null);
    try {
      const res = await runCodeSimulation(code, problem);
      setRunResult(res);
    } catch (e) {
      console.error(e);
      alert("Error executing code simulation.");
    } finally {
      setIsRunning(false);
    }
  };

  // Submit to admin
  const handleSubmit = () => {
    // Check if window.confirm is available, otherwise just proceed (e.g. sometimes blocked)
    const confirmed = window.confirm("Submit your solution? You cannot edit it afterwards.");
    if (!confirmed) return;
    
    try {
        const id = (typeof crypto !== 'undefined' && crypto.randomUUID) 
            ? crypto.randomUUID() 
            : `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const submission: Submission = {
            id: id,
            problemId: problem.id,
            problemTitle: problem.title,
            participantName: participantName,
            code: code,
            status: 'PENDING',
            antiCheatMetrics: {
                tabSwitches,
                copyPasteCount,
                lastActive: Date.now()
            },
            submittedAt: new Date().toISOString()
        };
        
        console.log("Submitting solution:", submission);
        onSubmitSolution(submission);
    } catch (error) {
        console.error("Submission failed:", error);
        alert("There was an error submitting your solution. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 z-20 relative">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <ChevronLeft size={20} className="text-slate-400" />
          </button>
          <div>
            <h1 className="font-bold text-lg">{competition.title}</h1>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Problem {currentProblemIndex + 1} of {competition.problems.length}</span>
              <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
              <span className={`${problem.difficulty === 'Hard' ? 'text-red-400' : 'text-emerald-400'}`}>{problem.difficulty}</span>
            </div>
          </div>
        </div>

        {/* Anti-Cheat & Timer */}
        <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                    <ShieldAlert size={12} /> Trust Score
                </span>
                <span className={`font-mono font-bold text-xl ${trustScore > 80 ? 'text-emerald-400' : trustScore > 50 ? 'text-yellow-400' : 'text-red-500'}`}>
                    {trustScore}%
                </span>
            </div>
            <div className="h-8 w-[1px] bg-slate-700"></div>
            <div className={`flex items-center gap-2 ${timeLeft < 60 && !hasSubmitted ? 'text-red-500 animate-pulse' : 'text-indigo-400'}`}>
                <Timer size={18} />
                <span className="font-mono text-lg">{hasSubmitted ? '--:--' : formatTime(timeLeft)}</span>
            </div>
        </div>
      </div>

      {hasSubmitted ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden animate-fade-in">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>

            <div className="z-10 text-center max-w-lg w-full p-8">
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-8 rounded-full inline-block mb-8 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] animate-pulse-slow">
                    <FileCheck size={64} className="text-emerald-400" />
                </div>
                
                <h2 className="text-5xl font-black text-white mb-4 tracking-tight">Solution Submitted</h2>
                <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                    Your code has been securely transmitted to the judges.<br/>
                    Sit tight while we review your logic.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-10 text-left bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-xl">
                    <div className="space-y-1">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Status</span>
                        <div className="font-mono text-yellow-400 flex items-center gap-2">
                             <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                             PENDING REVIEW
                        </div>
                    </div>
                    <div className="space-y-1">
                         <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Trust Score</span>
                         <div className={`font-mono font-bold ${trustScore > 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                            {trustScore}%
                         </div>
                    </div>
                     <div className="col-span-2 pt-4 border-t border-slate-800 flex justify-between items-center">
                         <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Submitted At</span>
                         <div className="font-mono text-slate-300 text-sm">
                             {existingSubmission ? new Date(existingSubmission.submittedAt).toLocaleTimeString() : new Date().toLocaleTimeString()}
                         </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={onExit} 
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center justify-center gap-3 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
                        Return to Lobby
                    </button>
                    {/* If there were multiple problems, a 'Next Problem' button would go here */}
                    <p className="text-xs text-slate-500">
                        Check the main scoreboard for live rankings and feedback.
                    </p>
                </div>
            </div>
        </div>
      ) : (
        /* Main Arena */
        <div className="flex-1 flex overflow-hidden">
            {/* Left: Problem Description */}
            <div className="w-1/3 border-r border-slate-800 flex flex-col bg-slate-900/30">
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <h2 className="text-2xl font-bold mb-4 text-white">{problem.title}</h2>
                <div className="prose prose-invert prose-slate max-w-none">
                    <p className="whitespace-pre-wrap text-slate-300 leading-relaxed">{problem.description}</p>
                    
                    <h3 className="text-lg font-semibold text-white mt-8 mb-4">Examples</h3>
                    <div className="space-y-4">
                        {problem.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                            <div key={idx} className="bg-slate-900 rounded-lg p-4 border border-slate-700 font-mono text-sm">
                                <div className="mb-2">
                                    <span className="text-indigo-400">Input:</span> <span className="text-slate-200">{tc.input}</span>
                                </div>
                                <div>
                                    <span className="text-emerald-400">Output:</span> <span className="text-slate-200">{tc.expectedOutput}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Output / Console Panel */}
            <div className="h-1/3 border-t border-slate-800 bg-slate-950 p-4 overflow-y-auto">
                <div className="flex items-center gap-2 mb-2 text-slate-500 text-sm uppercase tracking-wide font-semibold">
                    <Terminal size={14} /> Console Output
                </div>
                {isRunning ? (
                    <div className="text-indigo-400 animate-pulse flex items-center gap-2">
                        <Activity size={16} className="animate-spin" /> Executing code...
                    </div>
                ) : runResult ? (
                    <div className="space-y-2">
                        <div className="font-mono text-sm bg-slate-900 p-3 rounded border border-slate-800 text-slate-300 whitespace-pre-wrap">
                            {runResult.output}
                        </div>
                        <div className="text-xs text-slate-600 mt-2">
                            Exec time: {runResult.executionTime}
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-600 italic text-sm">Run your code to see output...</div>
                )}
            </div>
            </div>

            {/* Right: Code Editor */}
            <div className="flex-1 flex flex-col bg-slate-900 relative">
            
            <div className="flex-1 relative">
                <CodeEditor 
                    code={code} 
                    onChange={(val) => !hasSubmitted && setCode(val)} 
                    readOnly={hasSubmitted || timeLeft === 0}
                />
            </div>
            <div className="h-16 border-t border-slate-800 bg-slate-900 flex items-center justify-end px-6 gap-4 z-50">
                <div className="text-xs text-slate-500">Python 3.10</div>
                
                {/* Test Run Button */}
                <button 
                    onClick={handleRunCode}
                    disabled={isRunning || hasSubmitted || timeLeft === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                    {isRunning ? <Activity className="animate-spin" size={16}/> : <Play size={16} />}
                    Test Run
                </button>

                {/* Submit Button */}
                <button 
                    onClick={handleSubmit}
                    disabled={isRunning || hasSubmitted || timeLeft === 0}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-white transition-all transform active:scale-95 shadow-lg ${
                        hasSubmitted || timeLeft === 0 ? 'bg-slate-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                    }`}
                >
                    {hasSubmitted ? <Clock size={18} /> : <Send size={18} />}
                    {hasSubmitted ? 'Submitted' : timeLeft === 0 ? 'Time Expired' : 'Submit Solution'}
                </button>
            </div>
            </div>
        </div>
      )}
    </div>
  );
};