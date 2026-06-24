import { useLoaderData, Link } from 'react-router-dom'
import CountdownTimer from '../../components/CountdownTimer'
import type { ContestsLoaderData, Contest, Participation } from './Contests.loader.tsx'
import './Contests.css'




function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
    hour:  '2-digit',
    minute:'2-digit',
  })
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// --------------------- Upcoming Contest Card


function UpcomingCard({
  contest,
  isAuthenticated
}: {
  contest: Contest
  isAuthenticated: boolean
}) {
  const isOngoing = contest.status === 'ongoing'

  return (
    <div className={`contest-card ${isOngoing ? 'contest-card--live' : ''}`}>

      {/* live badge — only for ongoing */}
      {isOngoing && (
        <span className="live-badge">
          <span className="live-dot" />
          Live
        </span>
      )}

      <h3 className="contest-card__name">{contest.name}</h3>

      <div className="contest-card__meta">
        <div className="meta-row">
          <span className="meta-label">Starts</span>
          <span className="meta-value">{formatDate(contest.startDate)}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Duration</span>
          <span className="meta-value mono">{formatDuration(contest.duration)}</span>
        </div>
      </div>

      {/* countdown — only for upcoming, not ongoing */}
      {contest.status === 'upcoming' && (
        <div className="contest-card__countdown">
          <span className="countdown-heading">Starts in</span>
          <CountdownTimer targetDate={contest.startDate} />
        </div>
      )}

      {/* action button */}
      <div className="contest-card__footer">
        {isAuthenticated ? (
          <Link to={`/contests/${contest.id}`} className="btn btn--primary">
            {isOngoing ? 'Enter Contest' : 'Register'}
          </Link>
        ) : (
          <Link to="/auth/login" className="btn btn--ghost">
            Login to Register
          </Link>
        )}
      </div>

    </div>
  )
}

// Past Contest Table Row

function PastContestRow({
  contest,
  participation,
  isAuthenticated,
  index
}: {
  contest: Contest
  participation: Participation | undefined
  isAuthenticated: boolean
  index: number
}) {
  const participated = !!participation

  return (
    <tr className={participated ? 'row--participated' : ''}>
      <td className="td--index mono">{index + 1}</td>

      <td className="td--name">
        <Link to={`/contests/${contest.id}`} className="contest-link">
          {contest.name}
        </Link>
      </td>

      <td className="td--date">{formatDate(contest.startDate)}</td>

      <td className="td--duration mono">{formatDuration(contest.duration)}</td>

      {/* only render participation columns if logged in */}
      {isAuthenticated && (
        <>
          <td className="td--status">
            {participated ? (
              <span className="badge badge--participated">Participated</span>
            ) : (
              <span className="badge badge--missed">Not participated</span>
            )}
          </td>

          <td className="td--solved mono">
            {participated ? participation.problemsSolved : '—'}
          </td>

          <td className="td--rank mono">
            {participated ? `#${participation.rank}` : '—'}
          </td>
        </>
      )}
    </tr>
  )
}


// Main Page


export default function ContestsPage() {
  const { contests, participations, isAuthenticated } = useLoaderData() as ContestsLoaderData

  // split into sections
  const upcomingContests = contests.filter(
    c => c.status === 'upcoming' || c.status === 'ongoing'
  )
  // sort ongoing first, then by startDate
  .sort((a, b) => {
    if (a.status === 'ongoing') return -1
    if (b.status === 'ongoing') return 1
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  })

  const pastContests = contests
    .filter(c => c.status === 'past')
    .sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()  // newest first
    )

  return (
    <div className="contests-page">

      {/* ---- UPCOMING SECTION ---- */}
      <section className="contests-section">
        <div className="section-header">
          <h2 className="section-title">Upcoming Contests</h2>
          <span className="section-count">{upcomingContests.length}</span>
        </div>

        {upcomingContests.length === 0 ? (
          <div className="empty-state">
            <p>No upcoming contests right now.</p>
            <p className="empty-sub">Check back soon — new contests are added regularly.</p>
          </div>
        ) : (
          <div className="cards-grid">
            {upcomingContests.map(contest => (
              <UpcomingCard
                key={contest.id}
                contest={contest}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}
      </section>

      {/* ---- PAST SECTION ---- */}
      <section className="contests-section">
        <div className="section-header">
          <h2 className="section-title">Past Contests</h2>
          <span className="section-count">{pastContests.length}</span>
        </div>

        {!isAuthenticated && (
          <div className="login-nudge">
            <Link to="/auth/login">Login</Link> to see your participation history
          </div>
        )}

        {pastContests.length === 0 ? (
          <div className="empty-state">
            <p>No past contests yet.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="contests-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Contest</th>
                  <th>Date</th>
                  <th>Duration</th>
                  {isAuthenticated && (
                    <>
                      <th>Status</th>
                      <th>Solved</th>
                      <th>Rank</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {pastContests.map((contest, index) => (
                  <PastContestRow
                    key={contest.id}
                    contest={contest}
                    participation={participations[contest.id]}
                    isAuthenticated={isAuthenticated}
                    index={index}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  )
}