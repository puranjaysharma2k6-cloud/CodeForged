import config from '../../config';

export interface Contest {
  id: string
  name: string
  startDate: string
  duration: number
  status: 'UPCOMING' | 'ONGOING' | 'PAST'
}

interface RawContest {
  id: string
  title: string
  startTime: string
  duration: number
  status: 'UPCOMING' | 'ONGOING' | 'PAST'
}

export function normalizeContest(contest: RawContest): Contest {
  return {
    id: contest.id,
    name: contest.title,
    startDate: contest.startTime,
    duration: contest.duration,
    status: contest.status,
  };
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
    //console.log(json);
    return (Array.isArray(json) ? json : json.data ?? []).map(normalizeContest);
  } catch {
    return [];
  }
}

async function loadInitialPast() {
  try {
    const res = await fetch(`${config.apiUrl}/api/contests/past?page=1&limit=9`);
    if (!res.ok) return { contests: [], total: 0 };
    const json = await res.json();
  
    if (Array.isArray(json)) {
      return { contests: json.map(normalizeContest), total: json.length };
    }
    return {
      contests: (json.data ?? json.contests ?? []).map(normalizeContest),
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