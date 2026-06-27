export type ContestTab = 'upcoming' | 'past';

type ContestsTabsProps = {
  active: ContestTab;
  onChange: (tab: ContestTab) => void;
};

const TABS: { id: ContestTab; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past',     label: 'Past Contests' },
];

export function ContestsTabs({ active, onChange }: ContestsTabsProps) {
  return (
    <div
  role="tablist"
  aria-label="Contest type"
  className="
    mx-auto
    flex items-center justify-center
    h-12
    w-full max-w-md
    rounded-2xl
    p-1.5
    gap-1.5

    bg-white/5
    backdrop-blur-xl
    border border-white/10
    shadow-[0_8px_32px_rgba(0,0,0,0.35)]
  "
>
  {TABS.map(({ id, label }) => (
    <button
      key={id}
      role="tab"
      aria-selected={active === id}
      onClick={() => onChange(id)}
      className={`
        flex-1
        h-full
        rounded-xl
        px-7
        text-base
        font-semibold
        transition-all
        duration-300

        ${
          active === id
            ? `
              bg-white/20
              backdrop-blur-2xl
              border border-white/20
              text-white
              shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_4px_18px_rgba(255,255,255,0.08)]
            `
            : `
              text-gray-400
              hover:text-white
              hover:bg-white/5
            `
        }
      `}
    >
      {label}
    </button>
  ))}
</div>
  );
}