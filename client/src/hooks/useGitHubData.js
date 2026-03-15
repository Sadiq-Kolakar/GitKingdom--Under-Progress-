import { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';

export function useGitHubData(username) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const jwt = useStore(state => state.jwt);

  useEffect(() => {
    if (!username) return;

    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const headers = jwt ? { Authorization: `Bearer ${jwt}` } : {};
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/kingdoms/${username}`, {
          headers
        });
        
        if (isMounted) setData(response.data);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.error || err.message || 'Failed to fetch GitHub data');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [username, jwt]);

  return { data, loading, error };
}

export default useGitHubData;
