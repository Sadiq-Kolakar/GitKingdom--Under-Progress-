import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useDebounce } from 'use-debounce';
import { gsap } from 'gsap';

export default function MapSearch({ onMatchFound }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [noMatchMsg, setNoMatchMsg] = useState('');
  const msgTimerRef = useRef(null);

  useEffect(() => {
    if (!debouncedQuery) return;

    const performSearch = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || ''}/api/users/search?q=${debouncedQuery}`);
        
        if (res.data && res.data.length > 0) {
          // Send back the first hit for the map to focus/pin
          onMatchFound(res.data[0]);
        } else {
          showNoMatch();
        }
      } catch (e) {
        showNoMatch();
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const showNoMatch = () => {
    setNoMatchMsg("This explorer has not yet been charted. Perhaps they await discovery beyond the frontier.");
    
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => {
      setNoMatchMsg('');
    }, 3000);
  };

  return (
    <div style={styles.container}>
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search the Realm..."
        style={styles.input}
      />
      {noMatchMsg && (
        <div style={styles.errorText}>
          {noMatchMsg}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 50,
    width: '300px'
  },
  input: {
    width: '100%',
    padding: '12px 20px',
    backgroundColor: '#f4ebd8', // Parchment cream
    border: '2px solid #8a6e4b',
    borderRadius: '4px',
    fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
    fontSize: '16px',
    color: '#3e2e1e',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
    outline: 'none',
    boxSizing: 'border-box'
  },
  errorText: {
    marginTop: '8px',
    backgroundColor: 'rgba(30, 30, 35, 0.9)',
    color: '#d3bd9a',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '13px',
    border: '1px solid #8a6e4b',
    fontFamily: 'sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
    animation: 'fadeIn 0.3s ease'
  }
};
