import type { Contest } from '../Contests.loader';
import { ContestCard } from './ContestCard';

interface UpcomingContestsProps {
  /* contests from the loader, filtered here to upcoming + ongoing */
  contests: Contest[];
}

export function UpcomingContests({ contests }: UpcomingContestsProps) {
  const visible = contests.filter(
    c => c.status === 'upcoming' || c.status === 'ongoing'
  );

 
  const sorted = [...visible].sort((a, b) => {
    if (a.status === 'ongoing' && b.status !== 'ongoing') return -1;
    if (b.status === 'ongoing' && a.status !== 'ongoing') return 1;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  if (sorted.length === 0) {
    return (
      <UpcomingContest
        title="No upcoming contests"
        subtitle="Check back soon — new contests are added regularly."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map(contest => (
        <ContestCard key={contest.id} contest={contest} />
      ))}
    </div>
  );
}

function UpcomingContest({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center justify-center py-20 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-[#262b36] flex items-center justify-center ">
          <svg
            className="w-6 h-6 text-[#9ca3af] "
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

        <p className="text-[#ffffff] font-medium text-sm">
          {title}
        </p>

        <p className="text-[#9ca3af] text-sm">
          {subtitle}
        </p>
      </div>
    </div>

  );
}