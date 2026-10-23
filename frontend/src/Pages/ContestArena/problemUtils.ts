import type { ArenaProblem } from '../../layouts/ContestLayout';

// ─── Verdict display map ──────────────────────────────────────────────────────

export const VERDICT_MAP: Record<string, { label: string; styles: string }> = {
  ACCEPTED:              { label: 'Accepted',         styles: 'bg-green-500/10  text-green-400  border-green-500/30'  },
  WRONG_ANSWER:          { label: 'Wrong Answer',     styles: 'bg-rose-500/10   text-rose-400   border-rose-500/30'   },
  TIME_LIMIT_EXCEEDED:   { label: 'TLE (Time Limit)', styles: 'bg-amber-500/10  text-amber-400  border-amber-500/30'  },
  MEMORY_LIMIT_EXCEEDED: { label: 'MLE (Memory)',     styles: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  COMPILATION_ERROR:     { label: 'Compile Error',    styles: 'bg-zinc-500/10   text-zinc-400   border-zinc-500/30'   },
  RUNTIME_ERROR:         { label: 'Runtime Error',    styles: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
};


export function getSubmissionState(problem: ArenaProblem) {
  const hasAttempt =
    Boolean(problem.verdict) ||
    problem.submissions?.some(s => s.status && s.status !== 'PENDING');

  if (problem.verdict === 'ACCEPTED') {
    return {
      label:  'Solved',
      styles: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
      accent: 'border-l-emerald-500',
    };
  }

  if (hasAttempt) {
    return {
      label:  'Attempted',
      styles: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
      accent: 'border-l-amber-500',
    };
  }

  return {
    label:  'Unsolved',
    styles: 'border-slate-600/40 bg-slate-500/5 text-slate-400',
    accent: 'border-l-slate-600',
  };
}


export function getSolvedByCount(problem: ArenaProblem): number {
  const seen = new Set<string>();
  problem.submissions?.forEach(s => {
    if (s.status === 'ACCEPTED' && s.userId) seen.add(s.userId);
  });
  return seen.size;
}


export function problemLetter(index: number): string {
  return String.fromCharCode(65 + index);
}
