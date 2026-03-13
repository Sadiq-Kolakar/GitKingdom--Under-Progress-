import React, { useState } from 'react';

export default function MobileGate() {
  const [dismissed, setDismissed] = useState(false);

  // Check window width explicitly
  const isMobile = window.innerWidth < 768;

  if (dismissed || !isMobile) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h3 style={styles.title}>Traveler Beware</h3>
        <p style={styles.text}>
          Realm of Code is best explored on a larger screen. Mobile support coming soon.
        </p>
        <button style={styles.btn} onClick={() => setDismissed(true)}>
          Enter Anyway
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(13, 13, 14, 0.95)',
    zIndex: 100000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  },
  card: {
    backgroundColor: '#f4ebd8',
    border: '2px solid #8a6e4b',
    borderRadius: '4px',
    padding: '30px',
    textAlign: 'center',
    maxWidth: '400px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
  },
  title: {
    fontFamily: '"Cinzel", serif',
    color: '#3e2e1e',
    margin: '0 0 15px 0',
    fontSize: '1.5rem'
  },
  text: {
    fontFamily: '"Palatino Linotype", serif',
    color: '#5a4630',
    marginBottom: '20px',
    lineHeight: 1.5
  },
  btn: {
    backgroundColor: '#8a6e4b',
    color: '#f4ebd8',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    fontFamily: '"Cinzel", serif',
    cursor: 'pointer',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  }
};
