import { useEffect, useState, useRef } from "react";
import { Trophy, HelpCircle, User } from "lucide-react";
import config from "../../config";
import { fetchwithAuth } from "../../Utils/fetchwithAuth";
import ToggleBar from "../ToggleBar/ToggleBar";

interface ProblemStat {
  problemId: string;
  solved: boolean;
  attempts: number;
  solvedAt?: number; // Minutes into the contest
}

interface LeaderboardEntry {
  userId: string;
  username: string;
  name?: string;
  rank: number;
  score: number; // Total solved problems
  penalty: number; // Total penalty minutes
  problemStats: Record<string, ProblemStat>; // Keyed by problemId
}

interface RealtimeLeaderboardProps {
  contestId: string;
  problems: { id: string; title: string }[];
}

export default function RealtimeLeaderboard({ contestId, problems }: RealtimeLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  // WebSocket Connection Setup (Direct stream from Redis Backend)
  useEffect(() => {
    let wsUrl = `${config.apiUrl.replace(/^http/, "wss")}/api/contests/${contestId}/leaderboard/ws`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      console.log("Leaderboard WebSocket connected.");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "LEADERBOARD_UPDATE" && data.entries) {
          setEntries(data.entries);
        }
      } catch (err) {
        console.error("Failed to parse realtime leaderboard packet:", err);
      }
    };

    socket.onerror = (err) => {
      console.error("Leaderboard WebSocket error:", err);
      setIsConnected(false);
    };

    socket.onclose = () => {
      setIsConnected(false);
      console.log("Leaderboard WebSocket disconnected. Attempting restful polling fallback...");
    };

    //  Restful Fallback Standings Fetch
    async function fetchLeaderboardFallback() {
      try {
        const response = await fetchwithAuth(`${config.apiUrl}/api/contests/${contestId}/leaderboard`);
        if (response.ok) {
          const data = await response.json();
          setEntries(data.leaderboard);
        }
      } catch (err) {
        console.error("Leaderboard fallback polling failed:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboardFallback();

    // Poll every 10 seconds only if WebSocket connection is offline
    const pollInterval = setInterval(() => {
      if (socketRef.current?.readyState !== WebSocket.OPEN) {
        fetchLeaderboardFallback();
      }
    }, 10000);

    return () => {
      socket.close();
      clearInterval(pollInterval);
    };
  }, [contestId]);

  return (
    <div className="flex flex-col h-full w-full bg-[#13161c] rounded-2xl border border-[#2e3440] p-6 text-white overflow-hidden shadow-2xl">
      
      {/*  TOP CONTROL BAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5 shrink-0">
        
        {/* Status indicator & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[#22d3ee]">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-wide">Live Standings</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {/* Pulsing neon indicator mapping WS connection */}
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isConnected ? "bg-emerald-400" : "bg-amber-400"
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  isConnected ? "bg-emerald-500" : "bg-amber-500"
                }`}></span>
              </span>
              <p className="text-xs text-zinc-400 font-medium">
                {isConnected ? "Live Stream Connected" : "Connecting stand-by stream..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/*  STANDINGS GRID*/}
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-12 text-zinc-500">
          <HelpCircle size={36} className="mb-2 text-zinc-600" />
          <p className="text-sm">No standings entries detected yet.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto arena-scroll">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-[#2d323f] text-zinc-400 text-xs uppercase tracking-wider font-bold">
                <th className="py-4 px-3 text-center w-12">Rank</th>
                <th className="py-4 px-4 min-w-[150px]">Participant</th>
                <th className="py-4 px-3 text-center w-20">Solved</th>
                <th className="py-4 px-3 text-center w-24">Penalty</th>
                {/* Dynamically build custom Problem header column indexes */}
                {problems.map((prob, idx) => (
                  <th key={prob.id} className="py-4 px-1.5 text-center w-14 font-extrabold text-[#22d3ee]">
                    {String.fromCharCode(65 + idx)}
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-[#1e222b]">
              {entries.map((entry) => {
                const rankColor =
                  entry.rank === 1 ? "text-yellow-400" :
                  entry.rank === 2 ? "text-zinc-300" :
                  entry.rank === 3 ? "text-amber-600" : "text-zinc-400";

                return (
                  <tr
                    key={entry.userId}
                    className="transition-colors duration-150 hover:bg-[#1a1d24]/60"
                  >
                    {/* Rank Badge */}
                    <td className="py-3 px-3 text-center">
                      <span className={`text-sm font-black ${rankColor}`}>
                        #{entry.rank}
                      </span>
                    </td>

                    {/* Participant User Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700/50">
                          <User size={14} className="text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white leading-tight">
                            {entry.name || entry.username}
                          </p>
                          {entry.name && (
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                              @{entry.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Total Solved Count */}
                    <td className="py-3 px-3 text-center font-bold text-emerald-400">
                      {entry.score}
                    </td>

                    {/* Penalty Points (Minutes) */}
                    <td className="py-3 px-3 text-center text-xs font-mono text-zinc-400">
                      {entry.penalty} m
                    </td>

                    {problems.map((prob) => {
                      const stat = entry.problemStats[prob.id];
                      
                      if (!stat) {
                        return <td key={prob.id} className="py-3 px-1.5 text-center text-zinc-700 font-mono text-xs">-</td>;
                      }

                      return (
                        <td key={prob.id} className="py-3 px-1.5 text-center">
                          {stat.solved ? (
                            <div className="flex flex-col items-center justify-center p-1 rounded-md bg-green-500/10 border border-green-500/30 text-green-400">
                              <span className="text-xs font-black">
                                +{stat.attempts}
                              </span>
                              {stat.solvedAt !== undefined && (
                                <span className="text-[9px] text-green-500/60 font-mono">
                                  {stat.solvedAt}m
                                </span>
                              )}
                            </div>
                          ) : stat.attempts > 0 ? (
                            <div className="flex flex-col items-center justify-center p-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400">
                              <span className="text-xs font-bold">
                                -{stat.attempts}
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-700 font-mono text-xs">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}