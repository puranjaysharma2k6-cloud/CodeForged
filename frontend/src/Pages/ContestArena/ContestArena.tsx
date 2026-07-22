import { NavLink, useParams, useOutletContext } from 'react-router-dom';
import { useState } from 'react';
import RealtimeLeaderboard from '../../components/RealTimeLeaderboard/realtimeleaderboard'; // 🟢 Live Standings component
import './ContestArena.css';
import ToggleBar from '../../components/ToggleBar/ToggleBar';
type Problem = {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  verdict?: 'ACCEPTED' | 'WRONG_ANSWER' |
  'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' |
  'COMPILATION_ERROR' | 'RUNTIME_ERROR' | null;
  submissions?: Array<{ userId?: string; status?: string | null }>;
};

type ArenaTab = 'problems' | 'standings';

const VERDICT_MAP: Record<string, { label: string; styles: string }> = {
  ACCEPTED: { 
    label: "Accepted", 
    styles: "bg-green-500/10 text-green-400 border-green-500/30" 
  },
  WRONG_ANSWER: { 
    label: "Wrong Answer", 
    styles: "bg-rose-500/10 text-rose-400 border-rose-500/30" 
  },
  TIME_LIMIT_EXCEEDED: { 
    label: "TLE (Time Limit)", 
    styles: "bg-amber-500/10 text-amber-400 border-amber-500/30" 
  },
  MEMORY_LIMIT_EXCEEDED: { 
    label: "MLE (Memory Limit)", 
    styles: "bg-orange-500/10 text-orange-400 border-orange-500/30" 
  },
  COMPILATION_ERROR: { 
    label: "Compile Error", 
    styles: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30" 
  },
  RUNTIME_ERROR: { 
    label: "Runtime Error", 
    styles: "bg-purple-500/10 text-purple-400 border-purple-500/30" 
  }
};

const DIFFICULTY_MAP = {
  Easy: "text-emerald-400 bg-emerald-500/5 border-emerald-500/20",
  Medium: "text-amber-400 bg-amber-500/5 border-amber-500/20",
  Hard: "text-rose-400 bg-rose-500/5 border-rose-500/20",
};

function getSolvedByCount(problem: Problem) {
  const uniqueAcceptedUsers = new Set<string>();

  problem.submissions?.forEach((submission) => {
    if (submission.status === 'ACCEPTED' && submission.userId) {
      uniqueAcceptedUsers.add(submission.userId);
    }
  });

  return uniqueAcceptedUsers.size;
}

function getSubmissionState(problem: Problem) {
  const hasAttempt = Boolean(problem.verdict) || problem.submissions?.some((submission) => submission.status && submission.status !== 'PENDING');

  if (problem.verdict === 'ACCEPTED') {
    return {
      label: 'Solved',
      styles: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
      accent: 'border-l-emerald-500',
    };
  }

  if (hasAttempt) {
    return {
      label: 'Attempted',
      styles: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
      accent: 'border-l-amber-500',
    };
  }

  return {
    label: 'Unsolved',
    styles: 'border-slate-600/40 bg-slate-500/5 text-slate-400',
    accent: 'border-l-slate-600',
  };
}

export default function ContestArena() {
  const [activeTab, setActiveTab] = useState<ArenaTab>('problems');
  const { contestId } = useParams();

  const { problems, loading } = useOutletContext<{ problems: Problem[]; loading: boolean }>();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f1117] p-4 text-white sm:p-8">
      
      <div className={`flex h-[95vh] w-full flex-col transition-all duration-300 ${
        activeTab === 'standings' ? 'max-w-7xl' : 'max-w-5xl lg:w-[55%]'
      }`}>
        
        
        <section className="flex shrink-0 flex-col items-start justify-between gap-8  p-8 sm:flex-row sm:items-center sm:p-10">
          <div className="flex flex-col justify-center gap-3">
            <h2 className="text-3xl font-extrabold leading-none tracking-widest text-[#22d3ee] sm:text-4xl">
              Contest Arena
            </h2>
            

           </div>
           
          <NavLink
            to="/contests"
            className="inline-flex items-center justify-center rounded-xl border border-[#363c4a] px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-white/5"
          >
            Back to contests
          </NavLink>
        </section>
        <div className="h-8 w-full shrink-0"></div>   
       <div className="flex w-full justify-center">
        <ToggleBar<ArenaTab>
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={['problems', 'standings']}
          labels={{
            problems: 'Problems',
            standings: 'Live Standings'
          }}
        />
      </div>
 
        <div className="h-8 w-full shrink-0"></div>
         
        {/*  (PROBLEMS v REALTIME lbord switch) */}
        <div className="flex-1 min-h-0 overflow-hidden flex">
          
          {activeTab === 'problems' ? (
            /* PROBLEMS STREAM COLUMN */
            <div className="arena-scroll w-full flex flex-col gap-6 overflow-y-auto px-1">
              {loading ? (
                <p className="text-center text-[#22d3ee] py-12">Loading problems...</p>
              ) : problems.length === 0 ? (
                <p className="text-center text-gray-400 py-12">No problems found.</p>
              ) : (
                problems.map((problem, index) => {
                  const isAccepted = problem.verdict === 'ACCEPTED';
                  const activeVerdict = problem.verdict ? VERDICT_MAP[problem.verdict] : null;
                  const solvedByCount = getSolvedByCount(problem);
                  const submissionState = getSubmissionState(problem);

                  return (
                    <NavLink
                      key={problem.id}
                      to={`/contests/${contestId}/${problem.id}`}
                      state={{ problemData: problem }}
                      className={`arena-card-padding flex flex-col gap-4 rounded-2xl border border-[#363c4a] bg-[#141821] px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${submissionState.accent}`}
                    >
                      <div className="flex items-start gap-4">
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                          isAccepted
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-[#22d3ee]/10 text-[#22d3ee]'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </span>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-lg font-semibold leading-none text-white">
                              {problem.title}
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${submissionState.styles}`}>
                              {submissionState.label}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-400">
                            {solvedByCount} participant{solvedByCount === 1 ? '' : 's'} solved
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold tracking-wide capitalize ${DIFFICULTY_MAP[problem.difficulty] || ''}`}>
                          {problem.difficulty}
                        </span>

                        {activeVerdict && (
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${activeVerdict.styles}`}>
                            {activeVerdict.label}
                          </span>
                        )}
                      </div>
                    </NavLink>
                  );
                })
              )}
              <div className="h-8 w-full shrink-0"></div>
            </div>
          ) : (
            /* REALTIME LEADERBOARD VIEW */
            <div className="h-full w-full">
              <RealtimeLeaderboard 
                contestId={contestId || ""} 
                problems={problems.map(p => ({ id: p.id, title: p.title }))} 
              />
            </div>
          )}
        </div>
        
      </div>
    </main>
  );
}