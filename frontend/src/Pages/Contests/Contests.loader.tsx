import config from '../../config';

export interface Contest {
  id: string
  name: string
  startDate: string
  duration: number
  status: 'upcoming' | 'ongoing' | 'past'
}

export interface Participation {
  contestId: string
  problemsSolved: number
  rank: number
  score: number
}




// <PastContests> manages its own paginated data independently.
async function loadUpcomingContests(): Promise<Contest[]> {
  try {
    const res = await fetch(`${config.apiUrl}/api/contests/upcoming`);
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : json.data ?? [];
  } catch {
    return [];
  }
}

async function loadInitialPast() {
  try {
    const res = await fetch(`${config.apiUrl}/api/contests?status=past&page=1&limit=9`);
    if (!res.ok) return { contests: [], total: 0 };
    const json = await res.json();
    if (Array.isArray(json)) {
      return { contests: json, total: json.length };
    }
    return {
      contests: json.data ?? json.contests ?? [],
      total: json.meta?.totalContests ?? json.total ?? (json.data ?? json.contests ?? []).length,
    };
  } catch {
    return { contests: [], total: 0 };
  }
}

export function contestsLoader() {
  const upcomingContests = loadUpcomingContests();
  const initialPast = loadInitialPast();

  return { upcomingContests, initialPast };
}