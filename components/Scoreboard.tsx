import React from 'react';
import { Trophy, Medal, ShieldAlert } from 'lucide-react';
import { Submission } from '../types';

interface ScoreboardProps {
  submissions: Submission[];
}

interface UserStats {
  score: number;
  solved: number;
  warnings: number;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ submissions }) => {
  // Aggregate scores by user
  const userScores = submissions.reduce((acc, sub) => {
    if (sub.status !== 'GRADED') return acc;
    if (!acc[sub.participantName]) {
      acc[sub.participantName] = { score: 0, solved: 0, warnings: 0 };
    }
    acc[sub.participantName].score += (sub.score || 0);
    acc[sub.participantName].solved += 1;
    if (sub.antiCheatMetrics.tabSwitches > 0 || sub.antiCheatMetrics.copyPasteCount > 0) {
        acc[sub.participantName].warnings += 1;
    }
    return acc;
  }, {} as Record<string, UserStats>);

  const sortedUsers = (Object.entries(userScores) as [string, UserStats][])
    .sort(([, a], [, b]) => b.score - a.score);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex items-center gap-2">
        <Trophy className="text-yellow-500" size={20} />
        <h3 className="font-bold text-white">Live Rankings</h3>
      </div>
      <div className="p-4">
        {sortedUsers.length === 0 ? (
          <div className="text-center text-slate-500 py-8 italic">
            No graded submissions yet.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-slate-500 uppercase border-b border-slate-800">
                <th className="pb-3 pl-2">Rank</th>
                <th className="pb-3">Participant</th>
                <th className="pb-3 text-right">Solved</th>
                <th className="pb-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {sortedUsers.map(([name, stats], idx) => (
                <tr key={name} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 pl-2 font-mono text-slate-400">
                    {idx === 0 ? <Medal size={18} className="text-yellow-400" /> : 
                     idx === 1 ? <Medal size={18} className="text-slate-300" /> :
                     idx === 2 ? <Medal size={18} className="text-amber-700" /> : `#${idx + 1}`}
                  </td>
                  <td className="py-3 font-semibold text-white flex items-center gap-2">
                    {name}
                    {stats.warnings > 0 && (
                        <span className="text-red-500" title="Anti-cheat warnings detected"><ShieldAlert size={12}/></span>
                    )}
                  </td>
                  <td className="py-3 text-right text-slate-400">{stats.solved}</td>
                  <td className="py-3 text-right font-mono font-bold text-indigo-400">{stats.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};