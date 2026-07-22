import { redirect } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import config from '../../config';
import { fetchwithAuth } from '../../Utils/fetchwithAuth';

export interface Problem {
  id: string;
  title: string;
  statement: string;
  timeLimit: number;
  memoryLimit: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  verdict?: 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' |
            'MEMORY_LIMIT_EXCEEDED' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | null;
}

export interface ContestArenaLoaderData {
  problems: Problem[];
  contestId: string;
}

async function fetchArena(contestId: string): Promise<ContestArenaLoaderData> {
  const response = await fetchwithAuth(`${config.apiUrl}/api/contests/${contestId}/arena`);
  if (response.status === 401 || response.status === 403) throw redirect('/auth/login');
  if (response.status === 404) throw new Response('Contest not found', { status: 404 });
  if (!response.ok) throw new Response('Failed to load contest', { status: response.status });
  const data = await response.json();
  return { problems: data.contest.problems ?? [], contestId };
}

export function contestArenaLoader({ params }: LoaderFunctionArgs) {
  const { contestId } = params;
  if (!contestId) throw new Response('Contest ID is required', { status: 400 });
  return { arena: fetchArena(contestId) };
}
