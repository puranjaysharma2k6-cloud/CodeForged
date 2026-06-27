import type { Contest, Participation } from '../Contests.loader';



function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const STATUS_CONFIG = {
  upcoming: {
    label: 'Upcoming',
    badge: 'bg-[#1f5a3b] text-[#4ade80] border border-[#2d6a48]',
  },
  ongoing: {
    label: 'Live',
    badge: 'bg-[#5a3a1f] text-[#fbbf24] border border-[#6a4a2d]',
  },
  past: {
    label: 'Ended',
    badge: 'bg-[#3a3a3a] text-[#9ca3af] border border-[#363c4a]',
  },
} as const;



function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-[#9ca3af] mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-[#22d3ee]">{value}</p>
    </div>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2 mr-1">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
    </span>
  );
}


export type ContestCardProps = {
  contest: Contest;
  participation?: Participation;
};

export function ContestCard({ contest, participation }: ContestCardProps) {
  const { label, badge } = STATUS_CONFIG[contest.status];
  const participated = !!participation;

  return (
    <div className="bg-[#262b36] rounded-xl border border-[#363c4a] shadow-sm hover:shadow-lg transition-shadow duration-200 p-5 flex flex-col gap-3">

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[#ffffff] font-semibold text-sm leading-snug">{contest.name}</h3>

        <span className={`shrink-0 flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${badge}`}>
          {contest.status === 'ongoing' && <LiveDot />}
          {label}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#9ca3af]">
        <span className="flex items-center gap-1.5">
          <CalendarIcon />
          {formatDate(contest.startDate)}
        </span>
        <span className="flex items-center gap-1.5">
          <ClockIcon />
          {formatDuration(contest.duration)}
        </span>
      </div>

      {/* Participation stats — past contests only */}
      {contest.status === 'past' && (
        <div className="pt-3 border-t border-[#363c4a]">
          {participated ? (
            <div className="grid grid-cols-3 gap-3">
              <StatBlock label="Rank"   value={`#${participation!.rank}`} />
              <StatBlock label="Score"  value={participation!.score} />
              <StatBlock label="Solved" value={`${participation!.problemsSolved}p`} />
            </div>
          ) : (
            <p className="text-xs text-[#9ca3af] italic">You didn't participate.</p>
          )}
        </div>
      )}
    </div>
  );
}


function CalendarIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}