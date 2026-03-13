import React, { useEffect, useRef, useState } from 'react';

export default function LoadingScreen({ progress = 0 }) {
  const canvasRef = useRef(null);
  const [frame, setFrame] = useState(0);

  // Raven Wing flapping animation strictly for aesthetics
  useEffect(() => {
    let raf;
    const animate = () => {
      setFrame(f => f + 1);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const vw = canvas.width;
    const vh = canvas.height;
    
    ctx.clearRect(0, 0, vw, vh);

    // Draw flying raven in the center
    const cx = vw / 2;
    const cy = vh / 2 - 40;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(2.0, 2.0); // Make it big enough to appreciate

    ctx.fillStyle = '#111';
        
    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Head / Beak
    ctx.beginPath();
    ctx.arc(12, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(15, -2); ctx.lineTo(22, 0); ctx.lineTo(15, 2);
    ctx.fill();

    // Wings (Flapping via Math.sin oscillation)
    const wingYOffset = Math.sin(frame * 0.25) * 15; // Slowed flap slightly for loading grace
    
    ctx.beginPath(); // Top Wing
    ctx.moveTo(-5, -2); ctx.lineTo(-10, -wingYOffset - 10); ctx.lineTo(5, -wingYOffset - 5); ctx.lineTo(2, -2);
    ctx.fill();
    
    ctx.beginPath(); // Bottom Wing
    ctx.moveTo(-5, 2); ctx.lineTo(-10, wingYOffset + 10); ctx.lineTo(5, wingYOffset + 5); ctx.lineTo(2, 2);
    ctx.fill();

    ctx.restore();

  }, [frame]);

  return (
    <div style={styles.container}>
      <h2 style={styles.text}>Charting the realm...</h2>
      
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={150} 
        style={{ margin: '20px 0', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }}
      />

      {/* Horizontal parchment progress bar */}
      <div style={styles.progressBarContainer}>
        <div style={{ ...styles.progressBarFill, width: `${progress}%` }} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#0D0D0E',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Super high to cover everything
  },
  text: {
    fontFamily: '"Cinzel", serif',
    color: '#d3bd9a',
    fontSize: '2rem',
    marginBottom: '20px',
    letterSpacing: '2px',
    textAlign: 'center'
  },
  progressBarContainer: {
    width: '300px',
    height: '6px',
    backgroundColor: '#1E1E1E',
    border: '1px solid #3e2e1e',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D4AF37', // Gold
    boxShadow: '0 0 10px #D4AF37',
    transition: 'width 0.2s ease-out'
  }
};
