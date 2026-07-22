import { redirect } from 'react-router';
import config from '../../config';
import { fetchwithAuth } from '../../Utils/fetchwithAuth';
import type { LeaderboardUser } from './leaderboard';

async function fetchLeaderboard(): Promise<LeaderboardUser[]> {
  const response = await fetchwithAuth(`${config.apiUrl}/api/leaderboard`);
  if (response.status === 401 || response.status === 403) throw redirect('/auth/login');
  if (!response.ok) throw new Response('Failed to load leaderboard', { status: response.status });
  return response.json();
}

export function leaderboardLoader() {
  return { users: fetchLeaderboard() };
}
