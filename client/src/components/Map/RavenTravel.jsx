import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { gsap } from 'gsap';
import { useStore } from '../../store/useStore';

const RavenTravel = forwardRef(({ camera, panTo, onArrival }, ref) => {
  const canvasRef = useRef(null);
  
  // Expose sendRaven to the parent
  useImperativeHandle(ref, () => ({
    sendRaven: (fromPos, toKingdom) => {
      const { visitHistory, addToVisitHistory } = useStore.getState();
      const isFirstVisit = !visitHistory.includes(toKingdom.username);

      if (!isFirstVisit) {
        // Return visit — no raven, just smooth pan
        panTo(toKingdom.position.x, toKingdom.position.y, 2.5, 1.4);
        onArrival(toKingdom);
        return;
      }

      // We are flying!
      setIsFlying(true);
      
      const timeline = gsap.timeline({
        onComplete: () => {
          setIsFlying(false);
          addToVisitHistory(toKingdom.username);
          onArrival(toKingdom);
        }
      });

      // Phase 1: camera pulls back to see the whole map
      timeline.to(camera, { zoom: 0.35, duration: 1.0, ease: 'power2.inOut' });

      // Setup Raven Initial State
      ravenSprite.current = {
        worldX: fromPos.x, worldY: fromPos.y,
        opacity: 0, scale: 0.5, flightFrame: 0,
        rotation: 0
      };

      // Phase 2: raven lifts from fromPos tower
      timeline.to(ravenSprite.current, { opacity: 1, scale: 1, duration: 0.3 }, '+=0.2');

      // Phase 3: raven flies arc path across the map
      const midX = (fromPos.x + toKingdom.position.x) / 2;
      const midY = (fromPos.y + toKingdom.position.y) / 2 - 400; // arc above
      const distance = Math.hypot(toKingdom.position.x - fromPos.x, toKingdom.position.y - fromPos.y);
      const flightDuration = Math.min(0.8 + distance / 3000, 3.0);

      const ravenProgress = { value: 0 };
      
      // Calculate rotation angle of the arc dynamically
      timeline.to(ravenProgress, { 
        value: 1, duration: flightDuration, ease: 'none',
        onUpdate: () => {
          const t = ravenProgress.value;
          // Quadratic bezier interpolation
          const lastX = ravenSprite.current.worldX;
          const lastY = ravenSprite.current.worldY;
          
          const nextX = (1-t)*(1-t)*fromPos.x + 2*(1-t)*t*midX + t*t*toKingdom.position.x;
          const nextY = (1-t)*(1-t)*fromPos.y + 2*(1-t)*t*midY + t*t*toKingdom.position.y;
          
          ravenSprite.current.worldX = nextX;
          ravenSprite.current.worldY = nextY;
          ravenSprite.current.rotation = Math.atan2(nextY - lastY, nextX - lastX);
          
          // Camera slowly follows the raven
          camera.cx = nextX;
          camera.cy = nextY;
        }
      });

      // Phase 4: camera zooms in on arrival
      timeline.to(camera, {
        cx: toKingdom.position.x, cy: toKingdom.position.y,
        zoom: 2.5, duration: 1.2, ease: 'power2.inOut'
      }, `-=${0.5}`); // overlap with end of flight

      // Phase 5: raven lands, fades out
      timeline.to(ravenSprite.current, { opacity: 0, scale: 0.5, duration: 0.3 });
    }
  }));

  const ravenSprite = useRef(null);
  const [isFlying, setIsFlying] = useState(false);

  // Render Loop for Raven Graphics
  useEffect(() => {
    if (!isFlying) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let rafId;

    const render = () => {
      const vw = canvas.width;
      const vh = canvas.height;
      ctx.clearRect(0, 0, vw, vh);

      if (ravenSprite.current && ravenSprite.current.opacity > 0) {
        const { worldX, worldY, opacity, scale, rotation } = ravenSprite.current;
        ravenSprite.current.flightFrame += 1;
        
        const screenX = (worldX - camera.cx) * camera.zoom + vw / 2;
        const screenY = (worldY - camera.cy) * camera.zoom + vh / 2;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(rotation);
        ctx.scale(scale * camera.zoom, scale * camera.zoom);
        ctx.globalAlpha = opacity;

        // Draw bird
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
        const wingYOffset = Math.sin(ravenSprite.current.flightFrame * 0.4) * 15;
        
        ctx.beginPath(); // Top Wing
        ctx.moveTo(-5, -2); ctx.lineTo(-10, -wingYOffset - 10); ctx.lineTo(5, -wingYOffset - 5); ctx.lineTo(2, -2);
        ctx.fill();
        
        ctx.beginPath(); // Bottom Wing
        ctx.moveTo(-5, 2); ctx.lineTo(-10, wingYOffset + 10); ctx.lineTo(5, wingYOffset + 5); ctx.lineTo(2, 2);
        ctx.fill();

        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
    };
  }, [isFlying, camera]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 15 }}
    />
  );
});

export default RavenTravel;
