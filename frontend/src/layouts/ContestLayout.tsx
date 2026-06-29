import { useState, useEffect } from 'react';
import { useParams, Outlet ,Navigate} from 'react-router-dom';
import config from '../config';
import { fetchwithAuth } from '../Utils/fetchwithAuth';
import { useAuth } from '../context/AuthContext';
 

export default function ContestLayout() {
     const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
    
  const { contestId } = useParams();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProblems() {
      try {
        const response = await fetchwithAuth(`${config.apiUrl}/api/contests/${contestId}/arena`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error("Failed to fetch problems");
        const data = await response.json();
        setProblems(data.contest.problems);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    getProblems();
  }, [contestId]); 

  return <Outlet context={{ problems, loading }} />;
}