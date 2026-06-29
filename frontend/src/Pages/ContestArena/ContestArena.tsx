import { NavLink, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './ContestArena.css';

type Problem = {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isSolved?: boolean; 
};

export default function ContestArena() {
  const { contestId } = useParams();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProblems() {
      setLoading(true);
      
      // Placeholder
      setProblems([
        { id: '1', title: 'Two Sum', difficulty: 'Easy' },
        { id: '2', title: 'Shortest Paths', difficulty: 'Medium' },
        { id: '3', title: 'Tree Queries', difficulty: 'Hard' },
      ]);

      setLoading(false);
    }

    getProblems();
  }, [contestId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f1117] p-4 text-white sm:p-8">
      
      <div className="flex h-[95vh] w-full max-w-5xl flex-col lg:w-[55%] ">
        
        {/* Header section */}
        <section className="flex shrink-0 flex-col items-start justify-between gap-8 rounded-2xl border border-[#363c4a] bg-[#1a1d24] p-10 sm:flex-row sm:items-center sm:p-12 ">
          
          {/* Expanded Header Text Wrapper */}
          <div className="flex flex-col justify-center gap-4 py-2">
            <p className="text-sm font-bold uppercase tracking-widest text-[#22d3ee]">
             
            </p>
            <h2 className="text-4xl font-extrabold leading-tight tracking-widest text-[#22d3ee] sm:text-5xl sm:leading-snug">
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

        {/* Problems Section */}
         <div className="h-8 w-full shrink-0"></div>
        <div className="arena-scroll flex flex-col gap-6 overflow-y-auto px-3">
            {problems.map((problem, index) => {
              const solved = problem.isSolved;

              return (
                <NavLink
                  key={problem.id}
                  to={`/contests/${contestId}/problems/${problem.id}`}
                  className={`arena-card-padding group flex items-center justify-between rounded-2xl border transition-all duration-200 ${
                    solved
                      ? 'border-green-500/30 bg-[#1a1d24] hover:border-green-400 hover:bg-green-500/5'
                      : 'border-[#363c4a] bg-[#1a1d24] hover:border-[#22d3ee] hover:bg-[#20242d]'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    {/* Letter Box (Changes to green if solved) */}
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-bold transition-colors ${
                      solved 
                        ? 'bg-green-500/10 text-green-500 group-hover:bg-green-500/20' 
                        : 'bg-[#22d3ee]/10 text-[#22d3ee] group-hover:bg-[#22d3ee]/20'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </span>

                    {/* Title & Checkmark Wrapper */}
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-semibold leading-loose text-white">
                        {problem.title}
                      </span>
                      
                     
                      {solved && (
                        <svg  className="h-6 w-6 text-green-500" 
                         fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"                            
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  
                </NavLink>
              );
            })}

            {/* THE GHOST DIV */}
            <div className="h-8 w-full shrink-0"></div>
          </div>
        
      </div>
    </main>
  );
}