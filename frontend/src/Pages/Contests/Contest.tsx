import { useState } from 'react'
import { useLoaderData, Link } from 'react-router-dom'
import CountdownTimer from '../../components/CountdownTimer'
import type { ContestsLoaderData, Contest, Participation } from './Contests.loader.tsx'
import './Contests.css'
// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day:     '2-digit',
    month:   'short',
    hour:    '2-digit',
    minute:  '2-digit',
    timeZoneName: 'short',
  })
}

// ─── upcoming card ───────────────────────────────────────────────────────────

function UpcomingCard({
  contest,
  isAuthenticated,
  accent,
}: {
  contest: Contest
  isAuthenticated: boolean
  accent: 'orange' | 'purple'
}) {
  const isOngoing = contest.status === 'ongoing'

  return (
    <div className={`card card--${accent} ${isOngoing ? 'card--live' : ''}`}>

      {/* banner — drop your SVG inside .card-banner */}
      <div className="card-banner">
        {/* SVG placeholder */}
        {isOngoing && (
          <span className="live-pill">
            <span className="live-dot" /> LIVE
          </span>
        )}
        <span className="countdown-pill">
          <span className="countdown-icon">⏳</span>
          <CountdownTimer targetDate={contest.startDate} />
        </span>
      </div>

      <div className="card-footer">
        <div className="card-meta">
          <h3 className="card-title">{contest.name}</h3>
          <p className="card-date">{formatDate(contest.startDate)}</p>
        </div>
        <div className="card-cta">
          {isAuthenticated ? (
            <Link to={`/contests/${contest.id}`} className="btn-register">
              {isOngoing ? 'Enter' : 'Register'}
            </Link>
          ) : (
            <Link to="/auth/login" className="btn-ghost">Login</Link>
          )}
          <button className="btn-bell" title="Set reminder">🔔</button>
        </div>
      </div>

    </div>
  )
}

// ─── past contest row ────────────────────────────────────────────────────────

const PROBLEMS_PER_CONTEST = 4   // adjust or derive from API if available

function PastRow({
  contest,
  participation,
  isAuthenticated,
  accent,
}: {
  contest: Contest
  participation: Participation | undefined
  isAuthenticated: boolean
  accent: 'orange' | 'purple'
}) {
  const participated = !!participation

  return (
    <div className={`past-row ${participated ? 'past-row--done' : ''}`}>

      {/* thumbnail — drop your SVG inside .past-thumb */}
      <div className={`past-thumb past-thumb--${accent}`} />

      <div className="past-info">
        <Link to={`/contests/${contest.id}`} className="past-name">
          {contest.name}
        </Link>
        <span className="past-date">{formatDate(contest.startDate)}</span>
      </div>

      {isAuthenticated && (
        <span className={`score-badge ${participated ? 'score-badge--done' : 'score-badge--miss'}`}>
          {participated ? participation.problemsSolved : '—'} / {PROBLEMS_PER_CONTEST}
        </span>
      )}

      <Link to={`/contests/${contest.id}`} className="btn-virtual">
        Virtual
      </Link>

    </div>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

type PastTab = 'all' | 'mine'

export default function ContestsPage() {
  const { contests, participations, isAuthenticated } = useLoaderData() as ContestsLoaderData
  const [tab, setTab] = useState<PastTab>('all')

  const upcoming = contests
    .filter(c => c.status === 'upcoming' || c.status === 'ongoing')
    .sort((a, b) => {
      if (a.status === 'ongoing') return -1
      if (b.status === 'ongoing') return  1
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    })

  const past = contests
    .filter(c => c.status === 'past')
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())

  const displayed = tab === 'mine'
    ? past.filter(c => !!participations[c.id])
    : past

  const accents: Array<'orange' | 'purple'> = ['orange', 'purple']

  return (
    <div className="contests-page">

      {/* ── upcoming ── */}
      <section className="upcoming-section">
        <h2 className="section-heading">Upcoming Contests</h2>
        {upcoming.length === 0 ? (
          <div className="empty-state">
            <p>No upcoming contests.</p>
            <p className="empty-sub">Check back soon — new contests are added regularly.</p>
          </div>
        ) : (
          <div className="cards-grid">
            {upcoming.map((c, i) => (
              <UpcomingCard
                key={c.id}
                contest={c}
                isAuthenticated={isAuthenticated}
                accent={accents[i % 2]}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── past contests panel ── */}
      <section className="past-section">
        <h2 className="section-heading">Past Contests</h2>
        <div className="panel">

          <div className="tab-bar">
            <button
              className={`tab ${tab === 'all' ? 'tab--active' : ''}`}
              onClick={() => setTab('all')}
            >
              Past Contests
            </button>
            {isAuthenticated && (
              <button
                className={`tab ${tab === 'mine' ? 'tab--active' : ''}`}
                onClick={() => setTab('mine')}
              >
                My Contests
              </button>
            )}
          </div>

          {!isAuthenticated && (
            <div className="login-nudge">
              <Link to="/auth/login">Login</Link> to track your participation history
            </div>
          )}

          <div className="past-list-wrapper">
            <div className="past-list">
              {displayed.length === 0 ? (
                <div className="empty-state">
                  <p>{tab === 'mine' ? "You haven't participated in any contests yet." : 'No past contests.'}</p>
                </div>
              ) : (
                displayed.map((c, i) => (
                  <PastRow
                    key={c.id}
                    contest={c}
                    participation={participations[c.id]}
                    isAuthenticated={isAuthenticated}
                    accent={accents[i % 2]}
                  />
                ))
              )}
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}