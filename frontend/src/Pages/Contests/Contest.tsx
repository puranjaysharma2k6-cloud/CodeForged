import { Suspense, useState } from 'react';
import { Await, useLoaderData } from 'react-router-dom';
import type { Contest } from './Contests.loader';
import  ContestsTabs  from './components/ToggleBar/ToggleBar';
import { UpcomingContests } from './components/UpcomingContests';
import { PastContests } from './components/PastContests';

type ContestTab = 'upcoming' | 'past';


function UpcomingSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-[#262b36] rounded-xl border border-[#363c4a] p-6 animate-pulse flex flex-col gap-4 min-h-[140px]"
        >
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
      ))}
    </div>
  );
}

export default function ContestsPage() {
   
  const { upcomingContests, initialPast } = useLoaderData() as {
    upcomingContests: Promise<Contest[]>;
    initialPast: Promise<{ contests: Contest[]; total?: number }>;
  };
  
  const [activeTab, setActiveTab] = useState<ContestTab>('upcoming');

  return (
<div className="w-screen min-h-screen flex items-center justify-center">
  <div className="supreme-layout w-full max-w-[50vw] h-[95vh] bg-transparent">
    <div className="w-full h-full bg-[#0f1117] overflow-y-auto flex flex-col">
      <div className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-10 md:py-12 flex flex-col gap-6">
        
        <div className="mb-8 sm:mb-10 md:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#ffffff] tracking-tight mb-2 sm:mb-3">
            Contests
          </h1>
        
        </div>

        <div className="mb-6 py-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-4">
          <ContestsTabs activeTab={activeTab} onChange={setActiveTab} />

          {/* Count badge is isolated in its own Suspense so it resolves
              independently without blocking the tabs themselves */}
          {/* {activeTab === 'upcoming' && (
            <Suspense fallback={null}>
              <Await resolve={upcomingContests} />
               
            </Suspense>
          )} */}
        </div>

    
        <div className="flex-1 rounded-lg sm:rounded-xl border border-[#363c4a] bg-[#1a1d24] p-4 sm:p-6 md:p-8 overflow-y-auto flex flex-col space-y-6">

          {/* Upcoming tab, streams in via Suspense once the deferred
              Promise resolves,, skeleton takes lead till then */}
          <div className={activeTab === 'upcoming' ? '' : 'hidden'}>
            <Suspense fallback={<UpcomingSkeleton />}>
              <Await resolve={upcomingContests}>
                {(contests: Contest[]) => <UpcomingContests contests={contests} />}
              </Await>
            </Suspense>
          </div>

          {/* the past contest logic is complex as also pagination is involve so the state management is done in that moddle speretly */}
          <div className={activeTab === 'past' ? '' : 'hidden'}>
            <Suspense fallback={<div />}>
              <Await resolve={initialPast}>
                {(data: { contests: Contest[]; total?: number }) => (
                  <PastContests initialData={data} />
                )}
              </Await>
            </Suspense>
          </div>

        </div>
        </div>
      </div>
    </div>
    </div>
  );
}