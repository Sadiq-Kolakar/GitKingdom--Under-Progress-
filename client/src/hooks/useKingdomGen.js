import { useState } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';

export function useKingdomGen() {
  const [loading, setLoading] = useState(false);
  const [error, setErrorLocal] = useState(null);
  
  const claimKingdom = async () => {
    setLoading(true);
    setErrorLocal(null);
    useStore.setState({ isCharting: true, error: null });
    
    try {
      const jwt = useStore.getState().jwt;
      const headers = jwt ? { Authorization: `Bearer ${jwt}` } : {};
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/kingdoms/claim`, {}, { headers });
      
      const newKingdom = response.data;
      const currentKingdoms = useStore.getState().kingdoms;
      
      const existingIndex = currentKingdoms.findIndex(k => k.username === newKingdom.username);
      let updatedKingdoms;
      
      if (existingIndex >= 0) {
        updatedKingdoms = [...currentKingdoms];
        updatedKingdoms[existingIndex] = newKingdom;
      } else {
        updatedKingdoms = [...currentKingdoms, newKingdom];
      }
      
      useStore.setState({ kingdoms: updatedKingdoms });
      return newKingdom;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to claim kingdom';
      setErrorLocal(errorMsg);
      useStore.setState({ error: errorMsg });
      throw err;
    } finally {
      setLoading(false);
      useStore.setState({ isCharting: false });
    }
  };

  return { claimKingdom, loading, error };
}

export default useKingdomGen;
