import { useEffect, useReducer, useState } from 'react';
import config from '../../../config';
import { fetchwithAuth } from '../../../Utils/fetchwithAuth';
import type { Contest, Participation } from '../Contests.loader';
import { normalizeContest } from '../Contests.loader';
import { ContestCard } from './ContestCard';
import { Pagination } from './Pagination';


const PAGE_SIZE = 9;


interface FetchState {
  contests: Contest[];
  participations: Record<string, Participation>;
  totalPages: number;
  loading: boolean;
  error: string | null;
}

type FetchAction =
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; contests: Contest[]; participations: Record<string, Participation>; totalPages: number }
  | { type: 'ERROR'; message: string };

const initialState: FetchState = {
  contests: [],
  participations: {},
  totalPages: 1,
  loading: true,
  error: null,
};

function reducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'SUCCESS':
      return {
        loading: false,
        error: null,
        contests: action.contests,
        participations: action.participations,
        totalPages: action.totalPages,
      };
    case 'ERROR':
      return { ...state, loading: false, error: action.message };
  }
}


async function fetchPastContests(
  page: number
): Promise<{ contests: Contest[]; participations: Record<string, Participation>; totalPages: number }> {

  const res = await fetch(
    `${config.apiUrl}/api/contests/past?page=${page}&limit=${PAGE_SIZE}`
  );
  if (!res.ok) throw new Error('Failed to load past contests.');

  const data = await res.json();

  // API may return { contests, total } or a bare array
  const contests: Contest[] = Array.isArray(data)
    ? data.map(normalizeContest)
    : (data.data ?? data.contests ?? []).map(normalizeContest);
  const total: number        = data.total ?? contests.length;
  const totalPages           = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Fetch participation for each contest in parallel when a user is authenticated
  const token = localStorage.getItem('token');
  const participations: Record<string, Participation> = {};

  if (token && contests.length > 0) {
    const results = await Promise.allSettled(
      contests.map(async c => {
        const r = await fetchwithAuth(`${config.apiUrl}/api/contests/${c.id}/registration`);
        return r.ok ? r.json() : null;
      })
    );

    contests.forEach((c, i) => {
      const r = results[i];
      if (r.status === 'fulfilled' && r.value) {
        participations[c.id] = r.value;
      }
    });
  }

  return { contests, participations, totalPages };
}


export function PastContests({ initialData }: { initialData?: { contests: Contest[]; participations?: Record<string, Participation>; total?: number } } = {}) {
  const [page, setPage]         = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const [state, dispatch]       = useReducer(reducer, initialState);

  useEffect(() => {
    let cancelled = false;

    // If page 1 and initialData was provided by the loader, use it and skip fetching.
    if (page === 1 && initialData) {
      const contests = initialData.contests ?? [];
      const total = initialData.total ?? contests.length;
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      dispatch({ type: 'SUCCESS', contests, participations: initialData.participations ?? {}, totalPages });
      return;
    }

    dispatch({ type: 'LOADING' });

    async function loadPastContests() {
      try {
        const { contests, participations, totalPages } = await fetchPastContests(page); // send the current page youre in
        if (!cancelled) {
          dispatch({ type: 'SUCCESS', contests, participations, totalPages });
        }
      } catch (err) {
        if (!cancelled) {
          dispatch({ type: 'ERROR', message: err instanceof Error ? err.message : 'Something went wrong.' });
        }
      }
    }
      
    loadPastContests();
    
    return () => { cancelled = true; };
  }, [page, retryKey, initialData]);   

  if (state.loading) {
    return (
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] justify-center">
        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-[#451a1a] flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-[#fca5a5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-[#ffffff] font-medium text-sm">{state.error}</p>
        <button
          onClick={() => setRetryKey(k => k + 1)}
          className="mt-3 text-sm text-[#22d3ee] hover:text-[#06b6d4] hover:underline focus-visible:outline-none"
        >
          Try again
        </button>
      </div>
    );
  }


  if (state.contests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-[#9ca3af] font-medium text-sm">No past contests yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] justify-center">
        {state.contests.map(contest => (
          <ContestCard
            key={contest.id}
            contest={contest}
            participation={state.participations[contest.id]}
          />
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={state.totalPages}
        onPageChange={newPage => {
          setPage(newPage);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </>
  );
}



function SkeletonCard() {
  return (
    <div className="bg-[#262b36] rounded-xl border border-[#363c4a] p-6 animate-pulse flex flex-col gap-4 min-h-[140px]">
      <div className="flex items-start justify-between gap-4">
        <div className="h-5 bg-[#363c4a] rounded w-2/3" />
        <div className="h-6 bg-[#363c4a] rounded-full w-16 shrink-0" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-[#363c4a] rounded w-1/2" />
        <div className="h-4 bg-[#363c4a] rounded w-1/3" />
      </div>
      <div className="pt-3 border-t border-[#363c4a] grid grid-cols-3 gap-3">
        <div className="h-10 bg-[#363c4a] rounded" />
        <div className="h-10 bg-[#363c4a] rounded" />
        <div className="h-10 bg-[#363c4a] rounded" />
      </div>
    </div>
  );
}