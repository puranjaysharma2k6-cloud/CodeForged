import config from '../../config';
import { getAccessToken } from '../../context/AuthContext';  // ← single source

// --------------------------------------------------
// Types
// --------------------------------------------------

export interface Contest {
  id: string
  name: string
  startDate: string    // ISO string e.g. "2024-03-15T10:00:00Z"
  duration: number     // in minutes
  status: 'upcoming' | 'ongoing' | 'past'
}

export interface Participation {
  contestId: string
  problemsSolved: number
  rank: number
  score: number
}

export interface ContestsLoaderData {
  contests: Contest[]
  participations: Record<string, Participation>   // contestId -> participation
  isAuthenticated: boolean
}

// --------------------------------------------------
// Loader
// --------------------------------------------------

export async function contestsLoader(): Promise<ContestsLoaderData> {

  // public endpoint — no token needed
  const contestsRes = await fetch(`${config.apiUrl}/api/contests`);
  if (!contestsRes.ok) throw new Error('Failed to fetch contests');
  const contests: Contest[] = await contestsRes.json();

  // Loaders run outside the React tree so they can't call useAuth().
  // getAccessToken() is a module-level accessor exported by AuthContext that
  // reads from the same localStorage that AuthContext writes to — one source
  // of truth, just accessed without a hook.
  const token = getAccessToken();

  if (!token) {
    return { contests, participations: {}, isAuthenticated: false };
  }

  // Logged in — fetch participation for all past contests in parallel.
  // Promise.allSettled means one failure doesn't crash the whole page.
  const pastContests = contests.filter(c => c.status === 'past');

  const participationResults = await Promise.allSettled(
    pastContests.map(contest =>
      fetch(`${config.apiUrl}/api/contests/${contest.id}/participation`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => res.ok ? res.json() : null)  // null = didn't participate
    )
  );

  const participations: Record<string, Participation> = {};
  pastContests.forEach((contest, index) => {
    const result = participationResults[index];
    if (result.status === 'fulfilled' && result.value) {
      participations[contest.id] = result.value;
    }
  });

  return { contests, participations, isAuthenticated: true };
}