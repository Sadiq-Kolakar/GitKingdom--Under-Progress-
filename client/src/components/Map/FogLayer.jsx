import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { gsap } from 'gsap';
import { useStore } from '../../store/useStore';

const FogLayer = forwardRef(({ kingdoms, camera, panTo, onKingdomClick, onLiftComplete }, ref) => {
  const canvasRef = useRef(null);
  const { isCharting } = useStore();
  const [hoveredKingdom, setHoveredKingdom] = useState(null);

  // Animation timeline ref
  const liftTimelineRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let rafId;
    let time = 0;

    const render = () => {
      time += 0.05;
      const vw = canvas.width;
      const vh = canvas.height;
      
      ctx.clearRect(0, 0, vw, vh);

      const worldLeft = camera.cx - (vw / 2) / camera.zoom;
      const worldRight = camera.cx + (vw / 2) / camera.zoom;
      const worldTop = camera.cy - (vh / 2) / camera.zoom;
      const worldBottom = camera.cy + (vh / 2) / camera.zoom;

      kingdoms.forEach(k => {
        if (!k.isClaimed && !k.isNPC) {
          const padding = k.size || 50;
          if (
            k.position.x + padding >= worldLeft &&
            k.position.x - padding <= worldRight &&
            k.position.y + padding >= worldTop &&
            k.position.y - padding <= worldBottom
          ) {
            const screenX = (k.position.x - camera.cx) * camera.zoom + vw / 2;
            const screenY = (k.position.y - camera.cy) * camera.zoom + vh / 2;
            const baseRadius = ((k.size || 30) + 10) * camera.zoom;

            // Fog phase properties controlled by GSAP (if they exist on the object)
            // If k is currently being lifted, it might have k._fogOpacity, k._fogRadius, etc.
            const opacity = k._fogOpacity !== undefined ? k._fogOpacity : 1;
            const currentRadius = k._fogRadius !== undefined ? k._fogRadius : baseRadius;
            const lightAlpha = k._lightAlpha || 0;
            const lightScale = k._lightScale || 0;

            if (opacity > 0) {
              // 1. Draw faint silhouette beneath (10% opacity)
              ctx.beginPath();
              ctx.arc(screenX, screenY, currentRadius * 0.8, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(50, 50, 60, ${0.1 * opacity})`;
              ctx.fill();

              // 2. Animated dark mist overlay
              ctx.beginPath();
              // Simulating an organic jagged edge using sinusoidal offsets
              for (let i = 0; i < Math.PI * 2; i += 0.1) {
                const rOffset = Math.sin(i * 5 + time) * 3 * camera.zoom;
                const r = currentRadius + rOffset;
                const x = screenX + Math.cos(i) * r;
                const y = screenY + Math.sin(i) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.closePath();
              
              // Glow if hovered
              if (hoveredKingdom && hoveredKingdom.username === k.username) {
                ctx.shadowColor = 'gold';
                ctx.shadowBlur = 15;
                ctx.fillStyle = `rgba(30, 30, 35, ${0.85 * opacity})`;
              } else {
                ctx.shadowBlur = 0;
                ctx.fillStyle = `rgba(20, 20, 25, ${0.9 * opacity})`;
              }
              ctx.fill();
              ctx.shadowBlur = 0; // reset
            }

            // 3. Light rays break through
            if (lightAlpha > 0) {
               ctx.save();
               ctx.translate(screenX, screenY);
               ctx.scale(lightScale, lightScale);
               ctx.fillStyle = `rgba(255, 235, 180, ${lightAlpha})`;
               for(let i = 0; i < 12; i++) {
                 ctx.rotate(Math.PI / 6);
                 ctx.beginPath();
                 ctx.moveTo(0, 0);
                 ctx.lineTo(-5, baseRadius * 2);
                 ctx.lineTo(5, baseRadius * 2);
                 ctx.fill();
               }
               ctx.restore();
            }

          }
        }
      });

      rafId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, [camera, kingdoms, hoveredKingdom]);

  // Handle pointer interactions (Hover -> Tooltip & Glow, Click -> OAuth / GitHub link)
  const handlePointerMove = (e) => {
    const clickWorldX = (e.clientX - canvasRef.current.width / 2) / camera.zoom + camera.cx;
    const clickWorldY = (e.clientY - canvasRef.current.height / 2) / camera.zoom + camera.cy;

    let found = null;
    for (const k of kingdoms) {
      if (!k.isClaimed || k.isNPC) {
        const radius = k.size || 30;
        const dist = Math.hypot(k.position.x - clickWorldX, k.position.y - clickWorldY);
        if (dist <= radius) {
          found = k;
          break;
        }
      }
    }
    setHoveredKingdom(found);
    if (found) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'grab';
    }
  };

  const handlePointerClick = (e) => {
    if (hoveredKingdom) {
      if (hoveredKingdom.isNPC) {
        window.open(`https://github.com/${hoveredKingdom.username}`, '_blank');
      } else {
        onKingdomClick(hoveredKingdom);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    triggerFogLift: (kingdom) => {
      // Create the 7-Phase Fog Lift Sequence
      const tl = gsap.timeline({ onComplete: onLiftComplete });

      // Ensure kingdom has properties for canvas drawing to animate
      kingdom._fogOpacity = 1;
      kingdom._lightAlpha = 0;
      kingdom._lightScale = 0;
      kingdom._showParchment = false;
      kingdom._nameRevealLength = 0;
      kingdom._fogRadius = (kingdom.size || 30) + 10;
      kingdom._characterShow = false;

      // Phase 1 (0.0s): Camera zooms into the territory
      panTo(kingdom.position.x, kingdom.position.y, 3.5, 1.4);
      
      // Phase 2 (0.5s): Fog begins dissolving from center outward
      tl.to(kingdom, {
        _fogOpacity: 0,
        _fogRadius: 0,
        duration: 1.0,
        ease: 'power2.out'
      }, 0.5)

      // Phase 3 (0.8s): Light rays break through
      .to(kingdom, {
        _lightAlpha: 0.6,
        _lightScale: 1,
        duration: 0.8,
        ease: 'back.out(1.7)'
      }, 0.8)
      .to(kingdom, { _lightAlpha: 0, duration: 0.5 }, 1.6) // Fade out rays

      // Phase 4 (1.2s): Terrain generates live
      .add(() => {
        kingdom._terrainShow = true;
      }, 1.2)

      // Phase 5 (1.8s): Character sprite walks onto the map
      .add(() => {
        kingdom._characterShow = true;
      }, 1.8)

      // Phase 6 (2.2s): Kingdom name appears above the castle with a typewriter reveal
      .to(kingdom, {
        _nameRevealLength: kingdom.username.length,
        duration: 0.8,
        ease: 'steps(' + kingdom.username.length + ')'
      }, 2.2)

      // Phase 7 (2.5s): Parchment panel slides up from bottom
      .add(() => {
         kingdom._showParchment = true;
      }, 2.5);

      liftTimelineRef.current = tl;
    }
  }));

  return (
    <>
      <canvas 
        ref={canvasRef} 
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerClick}
        style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'auto', zIndex: 10 }}
      />
      
      {/* HTML Overlays for floating text and Tooltips */}
      {kingdoms.map(k => {
        if ((!k.isClaimed || k.isNPC) && k._fogOpacity !== 0) {
           const screenX = (k.position.x - camera.cx) * camera.zoom + window.innerWidth / 2;
           const screenY = (k.position.y - camera.cy) * camera.zoom + window.innerHeight / 2;
           const radius = ((k.size || 30) + 10) * camera.zoom;
           
           // Simple occlusion check (if way out of bounds, don't render DOM node to save performance)
           if (screenX < -100 || screenX > window.innerWidth + 100 || screenY < -100 || screenY > window.innerHeight + 100) return null;

           const isHovered = hoveredKingdom && hoveredKingdom.username === k.username;
           
           return (
             <div key={k.username} style={{
               position: 'absolute',
               left: screenX,
               top: screenY - radius - 20,
               transform: 'translate(-50%, -100%)',
               textAlign: 'center',
               pointerEvents: 'none',
               zIndex: 20,
               opacity: k._fogOpacity !== undefined ? k._fogOpacity : 1
             }}>
               <div style={{ color: isHovered ? '#D4AF37' : 'white', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                 {k.username}
               </div>
               <div style={{ color: '#aaa', fontSize: '11px', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                 {k.isNPC ? "Ancient Kingdom — Legend of the Realm" : "This land awaits its ruler"}
               </div>
               {isHovered && (
                 <div style={{ marginTop: '5px', backgroundColor: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '4px', color: '#fff', fontSize: '10px' }}>
                   Click to interact
                 </div>
               )}
             </div>
           );
        }
        return null;
      })}

      {/* Charting overlay */}
      {isCharting && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.8)', color: 'gold', padding: '10px 20px',
          borderRadius: '30px', zIndex: 100, border: '1px solid gold',
          fontFamily: 'sans-serif', fontWeight: 'bold'
        }}>
          Your kingdom is being charted...
        </div>
      )}

      {/* Lift Animation Overlays */}
      {kingdoms.map(k => {
        // Name typewriter reveal
        if (k._nameRevealLength !== undefined && k._nameRevealLength > 0 && k._fogOpacity === 0) {
           const screenX = (k.position.x - camera.cx) * camera.zoom + window.innerWidth / 2;
           const screenY = (k.position.y - camera.cy) * camera.zoom + window.innerHeight / 2;
           const radius = (k.size || 30) * camera.zoom;
           
           return (
              <div key={`reveal-${k.username}`} style={{
                position: 'absolute', left: screenX, top: screenY - radius - 30 * camera.zoom,
                transform: 'translate(-50%, -100%)', zIndex: 30, pointerEvents: 'none',
                color: '#fff', fontSize: `${Math.max(16, 20 * camera.zoom)}px`,
                fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,1)'
              }}>
                 {k.username.substring(0, Math.floor(k._nameRevealLength))}
              </div>
           );
        }
        return null;
      })}
    </>
  );
});

export default FogLayer;
