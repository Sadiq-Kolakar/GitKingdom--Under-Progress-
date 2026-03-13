import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';

export default function LandingPage() {
  const containerRef = useRef(null);
  const fogRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Subtle fog drift animation
    gsap.to(fogRef.current, {
      x: '-5%',
      y: '-2%',
      scale: 1.1,
      duration: 20,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }, []);

  const handleEnter = () => {
    // Cinematic fade out transition to /map
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 1.0,
      ease: 'power2.inOut',
      onComplete: () => {
        navigate('/map');
      }
    });
  };

  return (
    <div ref={containerRef} style={styles.container}>
      {/* Dynamic Fog Background Overlay */}
      <div style={styles.fogOverlay} ref={fogRef} />
      
      <div style={styles.content}>
        <h1 style={styles.tagline}>
          Every developer has a kingdom.
          <br />
          <span style={styles.taglineSub}>What does yours look like?</span>
        </h1>
        
        <p style={styles.subtext}>
          Realm of Code — an ancient world built from GitHub data
        </p>

        <button 
          onClick={handleEnter} 
          style={styles.ctaButton}
          onMouseEnter={(e) => gsap.to(e.target, { scale: 1.05, boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)', duration: 0.3 })}
          onMouseLeave={(e) => gsap.to(e.target, { scale: 1.0, boxShadow: '0 4px 15px rgba(0, 0, 0, 0.8)', duration: 0.3 })}
        >
          Enter the Realm
        </button>
      </div>

      <div style={styles.footer}>
        Built by Sadiq Kolakar | SIT Tumakuru
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#0D0D0E',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#d3bd9a'
  },
  fogOverlay: {
    position: 'absolute',
    top: '-10%', left: '-10%', width: '120%', height: '120%', // Oversized for drift panning
    background: 'radial-gradient(circle at center, transparent 0%, rgba(13, 13, 14, 0.8) 70%), url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.005\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.1\'/%3E%3C/svg%3E")',
    opacity: 0.3,
    pointerEvents: 'none',
    zIndex: 1
  },
  content: {
    position: 'relative',
    zIndex: 10,
    textAlign: 'center',
    maxWidth: '800px',
    padding: '0 20px'
  },
  tagline: {
    fontFamily: '"Cinzel", serif',
    fontSize: 'clamp(3rem, 5vw, 4.5rem)',
    fontWeight: 700,
    lineHeight: 1.2,
    margin: '0 0 30px 0',
    color: '#E8DCC2',
    textShadow: '0 4px 20px rgba(0,0,0,0.8)'
  },
  taglineSub: {
    fontSize: 'clamp(2rem, 3vw, 3rem)',
    color: '#A89269'
  },
  subtext: {
    fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
    fontSize: '1.2rem',
    color: '#8a6e4b',
    letterSpacing: '2px',
    marginBottom: '60px',
    fontStyle: 'italic'
  },
  ctaButton: {
    fontFamily: '"Cinzel", serif',
    fontSize: '1.4rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '3px',
    color: '#1E1E1E',
    background: 'linear-gradient(135deg, #d3bd9a 0%, #a08455 100%)',
    border: '2px solid #5a4630',
    padding: '18px 45px',
    cursor: 'pointer',
    borderRadius: '4px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.8), inset 0 2px 5px rgba(255, 255, 255, 0.3)',
    textShadow: '0 1px 2px rgba(255,255,255,0.4)',
    transition: 'all 0.1s ease', // basic properties, scale/shadow handled by GSAP
    outline: 'none'
  },
  footer: {
    position: 'absolute',
    bottom: '20px',
    fontFamily: '"Palatino Linotype", serif',
    fontSize: '0.85rem',
    color: '#5a4630',
    zIndex: 10,
    letterSpacing: '1px'
  }
};
