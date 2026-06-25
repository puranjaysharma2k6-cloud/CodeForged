import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import config from '../../config';
import { fetchwithAuth } from '../../Utils/fetchwithAuth';
import './Leaderboard.css';

export interface LeaderboardUser {
  id: string;
  username: string;
  handle: string;
  avatarUrl?: string;
  currentRating: number;
  globalRank: number;
}

function LeaderboardSkeleton() {
  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1 className="leaderboard-title">Leaderboard</h1>
        <p className="leaderboard-subtitle">Top competitive programmers</p>
      </div>

      <div className="leaderboard-container">
        <div className="leaderboard-list-header">
          <span className="rank-col">Rank</span>
          <span className="user-col">User</span>
          <span className="rating-col">Rating</span>
        </div>
        <ul className="leaderboard-list">
          {[...Array(10)].map((_, i) => (
            <li key={i} className="leaderboard-row skeleton-row">
              <div className="rank-col">
                <div className="skeleton-text skeleton-rank" />
              </div>
              <div className="user-col skeleton-user">
                <div className="skeleton-avatar-small" />
                <div className="skeleton-user-info">
                  <div className="skeleton-text skeleton-username" />
                  <div className="skeleton-text skeleton-handle" />
                </div>
              </div>
              <div className="rating-col">
                <div className="skeleton-text skeleton-rating" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  // Incrementing retry rerenders the page
  const handleRetry = () => {
    setError(null);
    setRetryCount((c) => c + 1);
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const response = await fetchwithAuth(`${config.apiUrl}/api/leaderboard`, {
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            navigate('/auth/login');
            return;
          }
          throw new Error('Failed to load leaderboard');
        }

        const data = await response.json();
        setUsers(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  // retryCount is  only trigger here; navigate is stable never chang
  }, [retryCount]);

  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  if (error) {
    return (
      <div className="leaderboard-page">
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button onClick={handleRetry} className="error-retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-header">
          <h1 className="leaderboard-title">Leaderboard</h1>
          <p className="leaderboard-subtitle">Top competitive programmers</p>
        </div>
        <div className="empty-state-leaderboard">
          <p>No users yet.</p>
          <p className="empty-sub">Participate in contests to appear on the leaderboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1 className="leaderboard-title">Leaderboard</h1>
        <p className="leaderboard-subtitle">Top competitive programmers</p>
      </div>

      <div className="leaderboard-container">
        {/* Column headers */}
        <div className="leaderboard-list-header">
          <span className="rank-col">Rank</span>
          <span className="user-col">User</span>
          <span className="rating-col">Rating</span>
        </div>

        {/* Each row is a Link — right-click, keyboard, and screen readers all work */}
        <ul className="leaderboard-list">
          {users.map((user, index) => (
            <li key={user.id}>
              <Link to={`/profile/${user.id}`} className="leaderboard-row">
                <div className="rank-col">
                  <span className={`rank-badge rank-${index + 1}`}>
                    #{user.globalRank || index + 1}
                  </span>
                </div>

                <div className="user-col user-info-row">
                  <img
                    src={
                      user.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${user.username}&background=1f232b&color=22d3ee`
                    }
                    alt={`${user.username}'s avatar`}
                    className="user-avatar-small"
                  />
                  <div className="user-details">
                    <p className="user-name">{user.username}</p>
                    <p className="user-handle">@{user.handle}</p>
                  </div>
                </div>

                <div className="rating-col">
                  <span className="rating-value">{user.currentRating}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}