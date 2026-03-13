import React from 'react';
import { useStore } from '../../store/useStore';

export default function LoginPrompt({ onClose, kingdom, onLogin }) {
  const handleLogin = () => {
    // Generate a random state string for CSRF
    const state = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('oauth_state', state); // Valid temporary storage for CSRF state match

    // Redirect to backend auth route with state
    window.location.href = `/api/auth/github?state=${state}`;
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={onClose}>×</button>
        <h2 style={styles.headline}>Claim your kingdom</h2>
        <p style={styles.body}>
          Your GitHub commits, repos, and languages become your kingdom's terrain, buildings, and character.
        </p>
        <p style={styles.finePrint}>
          We only use your public GitHub data. Nothing private is ever accessed.
        </p>
        <div style={styles.actions}>
          <button style={styles.loginBtn} onClick={handleLogin}>
            Login with GitHub
          </button>
        </div>
        
        {kingdom && kingdom.isSeeded && (
           <div style={styles.optOut}>
             <a href="#" onClick={(e) => { e.preventDefault(); alert('Opt-out implementation pending.'); }}>
               Remove me from the map
             </a>
           </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    fontFamily: 'sans-serif'
  },
  modal: {
    backgroundColor: '#1E1E1E',
    color: '#E0E0E0',
    padding: '40px',
    borderRadius: '12px',
    width: '400px',
    maxWidth: '90%',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    position: 'relative',
    border: '1px solid #333'
  },
  closeBtn: {
    position: 'absolute',
    top: '15px', right: '15px',
    background: 'none', border: 'none',
    color: '#888', fontSize: '24px',
    cursor: 'pointer'
  },
  headline: {
    marginTop: 0, color: '#D4AF37', fontSize: '28px', marginBottom: '20px'
  },
  body: {
    fontSize: '16px', lineHeight: 1.5, marginBottom: '20px'
  },
  finePrint: {
    fontSize: '12px', color: '#888', marginBottom: '30px', fontStyle: 'italic'
  },
  actions: {
    marginBottom: '20px'
  },
  loginBtn: {
    backgroundColor: '#333',
    color: '#fff',
    border: '1px solid #555',
    padding: '12px 24px',
    fontSize: '16px',
    borderRadius: '6px',
    cursor: 'pointer',
    width: '100%',
    fontWeight: 'bold',
    transition: 'background-color 0.2s'
  },
  optOut: {
    marginTop: '20px',
    fontSize: '12px'
  }
};
