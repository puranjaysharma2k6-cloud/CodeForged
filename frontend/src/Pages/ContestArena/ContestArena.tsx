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
                  const hasFailedAttempt = problem.verdict && problem.verdict !== 'ACCEPTED';
                  const activeVerdict = problem.verdict ? VERDICT_MAP[problem.verdict] : null;

                  return (
                    <NavLink
                      key={problem.id}
                      to={`/contests/${contestId}/${problem.id}`}
                      state={{ problemData: problem }}
                      className={`arena-card-padding group flex items-center justify-between rounded-2xl border transition-all duration-200 ${
                        isAccepted
                          ? 'border-green-500/30 bg-[#1a1d24] hover:border-green-400 hover:bg-green-500/5'
                          : hasFailedAttempt
                            ? 'border-rose-500/30 bg-[#1a1d24] hover:border-rose-400 hover:bg-rose-500/5'
                            : 'border-[#363c4a] bg-[#1a1d24] hover:border-[#22d3ee] hover:bg-[#20242d]'
                      }`}
                    >
                      {/* Left Side Info */}
                      <div className="flex items-center gap-6">
                        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-bold transition-colors ${
                          isAccepted 
                            ? 'bg-green-500/10 text-green-500 group-hover:bg-green-500/20' 
                            : hasFailedAttempt
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-[#22d3ee]/10 text-[#22d3ee] group-hover:bg-[#22d3ee]/20'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </span>

                        <div className="flex items-center gap-3">
                          <span className="text-xl font-semibold leading-loose text-white">
                            {problem.title}
                          </span>
                          
                          {isAccepted && (
                            <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Right Side Status Badges */}
                      <div className="flex items-center gap-3 pr-2">
                        {/* Difficulty Badge */}
                        <span className={`rounded-lg border px-3 py-1 text-xs font-semibold tracking-wide capitalize ${DIFFICULTY_MAP[problem.difficulty] || ''}`}>
                          {problem.difficulty}
                        </span>

                        {/* Verdict Status Badge */}
                        {activeVerdict && (
                          <span className={`rounded-lg border px-3 py-1 text-xs font-bold uppercase tracking-wider ${activeVerdict.styles}`}>
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
            <div className="w-full h-full animate-fade-in">
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