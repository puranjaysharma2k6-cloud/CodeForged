import type { Contest, Participation } from '../Contests.loader';
import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import config from '../../../config';
import { fetchwithAuth } from '../../../Utils/fetchwithAuth';
import { useAuth } from '../../../context/AuthContext';
import '../Contests.css';

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

type ContestRegistration = {
  contestId: string;
  mode: 'OFFICIAL' | 'VIRTUAL';
  registeredAt: string;
};

export function ContestCard({ contest, participation }: ContestCardProps) {
  const { isAuthenticated } = useAuth();
  
  const navigate = useNavigate();
  const participated = !!participation;
  const statusClass = contest.status.toLowerCase();
  const [registration, setRegistration] = useState<ContestRegistration | null>(null);
  const [isLoadingRegistration, setIsLoadingRegistration] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  const isRegistered = registration !== null;
  const virtualContestEndsAt =
    registration?.mode === 'VIRTUAL'
      ? new Date(registration.registeredAt).getTime() + contest.duration * 60 * 1000
      : 0;
  const isVirtualContestActive =
    contest.status === 'PAST' &&
    registration?.mode === 'VIRTUAL' &&
    virtualContestEndsAt > Date.now();
  const canEnterArena =
    (contest.status === 'ONGOING' && isRegistered) || isVirtualContestActive;

  useEffect(() => {
    let cancelled = false;

    async function loadRegistration() {
      setIsLoadingRegistration(true);
      
      try {
        const response = await fetchwithAuth(
          `${config.apiUrl}/api/contests/${contest.id}/arena`
        );
        const data = await response.json().catch(() => null);

        if (!cancelled) {
          setRegistration(response.ok ? data?.registration ?? null : null);
        }
      } catch {
        if (!cancelled) {
          setRegistration(null);
        }
        
      } finally {
        if (!cancelled) {
          setIsLoadingRegistration(false);
        }
      }
    }

    loadRegistration();

    return () => {
      cancelled = true;
    };
  }, [contest.id]);

  async function refreshRegistration() {
    const response = await fetchwithAuth(
      `${config.apiUrl}/api/contests/${contest.id}/arena`
    );
    const data = await response.json().catch(() => null);

    if (response.ok) {
      setRegistration(data?.registration ?? null); 
      return data?.registration ?? null;
    }

    return null;
  }

  async function handleRegister() {
    
    setIsRegistering(true);
    setRegistrationError(null);
    if(!isAuthenticated){
      navigate('/auth/login');
      return;
    }
  
   try {
     
      const response = await fetchwithAuth(
        `${config.apiUrl}/api/contests/${contest.id}/register`,
        { method: 'POST' }
      );
      
       
     if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            navigate('/auth/login');
            return;
          }
        }

      const data = await response.json().catch(() => null);
          
      if (!response.ok) {
        const message = data?.error ?? data?.message ?? 'Registration failed.';
        
        if (message.toLowerCase().includes('already registered')) {
          await refreshRegistration();
          return;
        }

        if (contest.status === 'PAST' && message.toLowerCase().includes('still ongoing')) {
          await refreshRegistration();
          navigate(`/contests/${contest.id}`);
          return;
        }
      
        throw new Error(message);
      }

      setRegistration(data?.registration ?? null);

      if (contest.status === 'PAST') {
        navigate(`/contests/${contest.id}`);
      }
    } catch (error) {
       //console.log(error);
      setRegistrationError(
        error instanceof Error ? error.message : 'Registration failed.'
      );
    } finally {
      setIsRegistering(false);
    }
  }
  
  return (
    <div className="contest-card">
      <div className="contest-card-header">
        <h3  className="text-[#ffffff] font-semibold text-base md:text-xl leading-snug">{contest.name}</h3>

        <span className={`contest-status-badge contest-status-badge--${statusClass}`}>
          {contest.status === 'ONGOING' && <LiveDot />}
          {contest.status}
        </span>
        {canEnterArena ? (
          <NavLink to={`/contests/${contest.id}`} className="contest-enter-button">
            Enter Contest
          </NavLink>
        ) : (
          <button
            type="button"
            className="contest-register-button"
            onClick={handleRegister}
            disabled={isLoadingRegistration || isRegistering || (isRegistered && contest.status === 'UPCOMING')}
          >
            {isLoadingRegistration
              ? 'Checking...'
              : isRegistering
              ? 'Registering...'
              : contest.status === 'PAST'
                ? 'Start Virtual'
                : isRegistered
                  ? 'Registered'
                  : 'Register'}
          </button>
        )}
      </div>

      {/* Meta row */}
      <div className="translate-x-2.5 flex flex-wrap gap-x-4 gap-y-2 text-m text-[#9ca3af]">
        <span className="flex items-center gap-2">
          <CalendarIcon />
          {formatDate(contest.startDate)}
        </span>
        <span className="flex items-center gap-2">
          <ClockIcon />
          {formatDuration(contest.duration)}
        </span>
      </div>

      {registrationError && (
        <p className="contest-registration-error">{registrationError}</p>
      )}


      {contest.status === 'PAST' && (
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
    <svg className="w-4 h-4 shrink-0 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 text-[#9ca3af]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
