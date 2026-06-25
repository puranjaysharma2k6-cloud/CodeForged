import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import config from '../../config';
import { fetchwithAuth } from '../../Utils/fetchwithAuth';
import './Profile.css';

export interface RatingData {
  contestName: string;
  newRating: number;
  date: string;
}

export interface ProfileLoaderData {
  username: string;
  handle: string;
  avatarUrl?: string;
  currentRating: number;
  problemsSolved: number;
  globalRank: number;
  ratingHistory: RatingData[];
}

interface StatCardProps {
  value: string | number;
  label: string;
  className: string;
}

function StatCard({ value, label, className }: StatCardProps) {
  return (
    <div className={`stat-box ${className}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p style={{ margin: 0, fontWeight: 600, color: '#9ca3af', fontSize: '0.8rem' }}>
          {label}
        </p>
        <p style={{ margin: '0.25rem 0 0 0', fontWeight: 700, color: '#22d3ee' }}>
          Rating: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

function ProfileSkeleton() {
  return (
    <div className="profile-page">
      <div className="profile-card-top skeleton-card">
        <div className="profile-identity">
          <div className="skeleton-avatar" />
          <div className="skeleton-name-group">
            <div className="skeleton-text skeleton-title" />
            <div className="skeleton-text skeleton-subtitle" />
          </div>
        </div>
        <div className="profile-stats">
          <div className="stat-box skeleton-stat" />
          <div className="stat-box skeleton-stat" />
          <div className="stat-box skeleton-stat" />
        </div>
      </div>

      <div className="profile-card-bottom skeleton-card">
        <div className="graph-header">
          <div className="skeleton-text" style={{ width: '200px', height: '28px' }} />
        </div>
        <div className="skeleton-graph" />
      </div>
    </div>
  );
}

function ProfileContent({ profile }: { profile: ProfileLoaderData }) {
  const defaultAvatar =
    'https://ui-avatars.com/api/?name=' + profile.username + '&background=1f232b&color=22d3ee';

  const rank =
    profile.globalRank !== null && profile.globalRank !== undefined
      ? profile.globalRank
      : 'N/A';

  return (
    <div className="profile-page">
      <div className="profile-card-top">
        <div className="profile-identity">
          <img
            src={profile.avatarUrl || defaultAvatar}
            alt={`${profile.username}'s avatar`}
            className="profile-avatar"
          />
          <div className="profile-name-group">
            <h1 className="profile-username">{profile.username}</h1>
            <span className="profile-handle">@{profile.handle}</span>
          </div>
        </div>

        <div className="profile-stats">
          <StatCard value={profile.currentRating} label="Rating" className="stat-box--rating" />
          <StatCard value={profile.problemsSolved} label="Solved" className="stat-box--solved" />
          <StatCard value={`#${rank}`} label="Global" className="stat-box--rank" />
        </div>
      </div>

      <div className="profile-card-bottom">
        <div className="graph-header">
          <h2 className="graph-title">Rating History</h2>
        </div>

        {profile.ratingHistory.length === 0 ? (
          <div className="empty-state">
            <p>No contest history yet.</p>
            <p className="empty-sub">Participate in upcoming contests to build your rating.</p>
          </div>
        ) : (
          <div className="graph-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={profile.ratingHistory}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="contestName"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin - 50', 'dataMax + 50']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="newRating"
                  stroke="#22d3ee"
                  strokeWidth={3}
                  dot={{ fill: '#1f232b', stroke: '#22d3ee', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#22d3ee', stroke: '#ffffff' }}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileLoaderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // If no ID, fetch current user. Otherwise, fetch specific user by ID
        const endpoint = id 
          ? `${config.apiUrl}/api/users/${id}` 
          : `${config.apiUrl}/api/users/me`;
          
         // console.log(endpoint);
        const response = await fetchwithAuth(endpoint, {
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            navigate('/auth/login');
            return;
          }
          if (response.status === 404) {
            throw new Error('User not found');
          }
          throw new Error('Failed to load profile');
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [id, navigate]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button onClick={() => navigate(-1)} className="error-back-btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="error-state">
          <p className="error-message">Profile not found</p>
          <button onClick={() => navigate(-1)} className="error-back-btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <ProfileContent profile={profile} />;
}