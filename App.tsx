import React, { useState } from 'react';
import { UserRole, Competition, CompetitionStatus, Submission } from './types';
import { AdminPanel } from './components/AdminPanel';
import { CompetitionArena } from './components/CompetitionArena';
import { Scoreboard } from './components/Scoreboard';
import { Shield, Trophy, Code, ArrowRight, User, Lock, X } from 'lucide-react';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.GUEST);
  const [activeCompetition, setActiveCompetition] = useState<Competition | null>(null);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  
  // User State
  const [username, setUsername] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  // Admin Login State
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setRole(UserRole.ADMIN);
      setShowAdminLogin(false);
      setPassword('');
      setLoginError('');
    } else {
      setLoginError('Invalid password');
    }
  };

  const enterParticipantMode = () => {
    if (username) {
        setRole(UserRole.PARTICIPANT);
    } else {
        setShowNamePrompt(true);
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (username.trim()) {
          setShowNamePrompt(false);
          setRole(UserRole.PARTICIPANT);
      }
  };

  const handleSubmission = (sub: Submission) => {
      setSubmissions(prev => [...prev, sub]);
  };

  const handleGradeSubmission = (id: string, score: number, feedback: string) => {
      setSubmissions(prev => prev.map(s => 
          s.id === id ? { ...s, status: 'GRADED', score, feedback } : s
      ));
  };

  // Landing Page
  if (role === UserRole.GUEST) {
    return (
      <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 text-white flex flex-col items-center justify-center p-4 relative">
        
        {/* Name Prompt Modal */}
        {showNamePrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-sm shadow-2xl relative">
                <button onClick={() => setShowNamePrompt(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
                <h2 className="text-2xl font-bold mb-4 text-center">Enter Your Name</h2>
                <form onSubmit={handleNameSubmit}>
                    <input 
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white mb-4 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        placeholder="e.g. Alex Coder"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg">Join</button>
                </form>
             </div>
          </div>
        )}

        {/* Admin Login Modal */}
        {showAdminLogin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
                <button 
                  onClick={() => setShowAdminLogin(false)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-white"
                >
                  <X size={20} />
                </button>
                <div className="flex flex-col items-center mb-6">
                   <div className="bg-slate-800 p-3 rounded-full mb-4">
                     <Lock size={24} className="text-emerald-400" />
                   </div>
                   <h2 className="text-2xl font-bold">Admin Access</h2>
                   <p className="text-slate-400 text-sm">Enter password to manage competitions</p>
                </div>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                   <div>
                     <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-600"
                        placeholder="Enter password (try: admin123)"
                        autoFocus
                     />
                     {loginError && <p className="text-red-400 text-xs mt-2">{loginError}</p>}
                   </div>
                   <button 
                     type="submit"
                     className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors"
                   >
                     Unlock Dashboard
                   </button>
                </form>
             </div>
          </div>
        )}

        <div className="max-w-4xl w-full text-center space-y-8 animate-fade-in-up">
          <div className="flex justify-center mb-6">
             <div className="bg-indigo-500/10 p-4 rounded-full border border-indigo-500/30">
                <Code size={48} className="text-indigo-400" />
             </div>
          </div>
          <h1 className="text-6xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white to-indigo-300">
            PyCompete
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The professional platform for global Python competitions. 
            Features manual expert judging, real-time anti-cheat monitoring, and a sleek coding environment.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto mt-12">
            <button 
              onClick={enterParticipantMode}
              className="group relative p-8 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-2xl transition-all hover:shadow-2xl hover:shadow-indigo-500/10 text-left"
            >
              <div className="absolute top-4 right-4 bg-indigo-500/20 p-2 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors text-indigo-400">
                <Trophy size={20} />
              </div>
              <h3 className="text-xl font-bold mb-2">Participant</h3>
              <p className="text-slate-400 text-sm">Join competitions, submit solutions, and climb the leaderboard.</p>
              <div className="mt-6 flex items-center text-indigo-400 font-semibold text-sm group-hover:gap-2 transition-all">
                Enter Arena <ArrowRight size={16} className="ml-1"/>
              </div>
            </button>

            <button 
              onClick={() => setShowAdminLogin(true)}
              className="group relative p-8 bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-2xl transition-all hover:shadow-2xl hover:shadow-emerald-500/10 text-left"
            >
              <div className="absolute top-4 right-4 bg-emerald-500/20 p-2 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors text-emerald-400">
                <Shield size={20} />
              </div>
              <h3 className="text-xl font-bold mb-2">Admin</h3>
              <p className="text-slate-400 text-sm">Create quizzes, grade submissions, and monitor events.</p>
               <div className="mt-6 flex items-center text-emerald-400 font-semibold text-sm group-hover:gap-2 transition-all">
                Manage Platform <ArrowRight size={16} className="ml-1"/>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin View
  if (role === UserRole.ADMIN) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <nav className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur fixed w-full top-0 z-50 flex items-center justify-between px-6">
           <div className="font-bold text-xl flex items-center gap-2">
             <Code className="text-indigo-500" /> PyCompete <span className="bg-indigo-600 text-xs px-2 py-0.5 rounded text-white ml-2">ADMIN</span>
           </div>
           <button onClick={() => setRole(UserRole.GUEST)} className="text-sm text-slate-400 hover:text-white">Sign Out</button>
        </nav>
        <div className="pt-20">
          <AdminPanel 
            competitions={competitions} 
            setCompetitions={setCompetitions} 
            submissions={submissions}
            onGradeSubmission={handleGradeSubmission}
          />
        </div>
      </div>
    );
  }

  // Active Competition (Taking the quiz)
  if (role === UserRole.PARTICIPANT && activeCompetition) {
    return (
      <CompetitionArena 
        competition={activeCompetition} 
        participantName={username}
        onExit={() => setActiveCompetition(null)}
        onSubmitSolution={handleSubmission}
        submissions={submissions}
      />
    );
  }

  // Participant Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur fixed w-full top-0 z-50 flex items-center justify-between px-6">
          <div className="font-bold text-xl flex items-center gap-2">
            <Code className="text-indigo-500" /> PyCompete
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800 px-3 py-1.5 rounded-full">
                <User size={14} /> {username || 'Guest'}
             </div>
             <button onClick={() => setRole(UserRole.GUEST)} className="text-sm text-slate-400 hover:text-white">Sign Out</button>
          </div>
      </nav>

      <div className="pt-24 max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <header>
                <h1 className="text-4xl font-bold mb-4">Live Competitions</h1>
                <p className="text-slate-400">Join a room to start coding. Solutions are graded manually by admins.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {competitions.filter(c => c.status === CompetitionStatus.ACTIVE).map(comp => (
                <div key={comp.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group">
                    <div className="flex justify-between mb-6">
                        <span className="bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded text-xs font-bold border border-emerald-900">LIVE</span>
                        <span className="text-slate-500 text-xs font-mono">ID: {comp.id.slice(0,6)}</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">{comp.title}</h3>
                    <div className="space-y-2 mb-8">
                        <div className="flex justify-between text-sm text-slate-400 border-b border-slate-800 pb-2">
                            <span>Problems</span>
                            <span className="text-white font-mono">{comp.problems.length}</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setActiveCompetition(comp)}
                        className="w-full bg-white text-slate-900 font-bold py-3 rounded-lg hover:bg-indigo-50 transition-colors flex justify-center items-center gap-2"
                    >
                        Enter Arena <ArrowRight size={18} />
                    </button>
                </div>
                ))}
                
                {competitions.length === 0 && (
                <div className="col-span-full bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-12 text-center">
                    <Trophy size={48} className="mx-auto text-slate-700 mb-4" />
                    <h3 className="text-xl font-bold text-slate-300">No Active Competitions</h3>
                    <p className="text-slate-500 mt-2">Wait for an admin to launch a competition.</p>
                </div>
                )}
            </div>
         </div>

         <div className="lg:col-span-1">
            <Scoreboard submissions={submissions} />
         </div>
      </div>
    </div>
  );
};

export default App;