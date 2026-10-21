import { useEffect, useState } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import config from '../config';
import { fetchwithAuth } from '../Utils/fetchwithAuth';
import { useAuth } from '../context/AuthContext';

export type ArenaProblem = {
  id: string;
  title: string;
  statement: string;
  timeLimit: number;
  memoryLimit: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  verdict?: string | null;
  submissions?: Array<{ userId?: string; status?: string | null }>;
};

export type ContestOutletContext = {
  problems: ArenaProblem[];
  loading: boolean;
  error: string | null;
};

export default function ContestLayout() {
  const { isAuthenticated } = useAuth();
  const { contestId } = useParams();
  const [problems, setProblems] = useState<ArenaProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contestId) {
      setProblems([]);
      setError('Contest ID is missing.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadArena() {
      setLoading(true);
      setError(null);
      setProblems([]);

      try {
        const response = await fetchwithAuth(
          `${config.apiUrl}/api/contests/${contestId}/arena`,
          { signal: controller.signal },
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message ?? 'Unable to load this contest.');
        }

        setProblems(payload?.contest?.problems ?? []);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : 'Unable to load this contest.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadArena();
    return () => controller.abort();
  }, [contestId]);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet context={{ problems, loading, error } satisfies ContestOutletContext} />;
}
