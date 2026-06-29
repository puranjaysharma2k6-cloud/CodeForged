import type { Contest } from '../Contests.loader';
import { ContestCard } from './ContestCard';

interface UpcomingContestsProps {
  /* contests from the loader, filtered here to upcoming + ongoing */
  contests: Contest[];
}

export function UpcomingContests({ contests }: UpcomingContestsProps) {
  const visible = contests.filter(
    c => c.status === 'UPCOMING' || c.status === 'ONGOING'
  );

 
  const sorted = [...visible].sort((a, b) => {
    if (a.status === 'ONGOING' && b.status !== 'ONGOING') return -1;
    if (b.status === 'ONGOING' && a.status !== 'ONGOING') return 1;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  if (sorted.length === 0) {
    return (
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] justify-center">
        <UpcomingContest
          title="No upcoming contests"
          subtitle="Check back soon — new contests are added regularly."
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] justify-center">
      {sorted.map(contest => (
        <ContestCard key={contest.id} contest={contest} />
      ))}
    </div>
  );
}

function UpcomingContest({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="bg-[#262b36] rounded-xl border border-[#363c4a] shadow-sm p-6 flex items-center justify-center text-center min-h-[160px]">
      <div className="flex flex-col items-center gap-4 max-w-xs px-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#262b36] sm:h-16 sm:w-16">
      <svg
            className="h-7 w-7 text-[#9ca3af] sm:h-8 sm:w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
        />
      </svg>
    </div>

    <p className="text-base font-semibold text-white sm:text-lg">
      {title}
    </p>
    <p className="text-sm text-[#9ca3af] sm:text-base max-w-[220px]">
      {subtitle}
    </p>
  </div>
</div>

  );
}