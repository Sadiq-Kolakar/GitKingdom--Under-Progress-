import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useMapCamera } from '../../hooks/useMapCamera';
import { quadtree } from 'd3-quadtree';

export default function MapCanvas({ kingdoms = [] }) {
  const canvasRef = useRef(null);
  const { camera, panTo, setRedrawCallback } = useMapCamera(2000, 2000, 1);
  const [selectedKingdom, setSelectedKingdom] = useState(null);
  
  const qt = useMemo(() => {
    return quadtree()
      .x(d => d.position.x)
      .y(d => d.position.y)
      .addAll(kingdoms);
  }, [kingdoms]);

  const drawKingdom = (ctx, kingdom, cam, vWidth, vHeight) => {
    // Coordinate transform: screenX = (worldX - cx) * zoom + viewportWidth/2
    const screenX = (kingdom.position.x - cam.cx) * cam.zoom + vWidth / 2;
    const screenY = (kingdom.position.y - cam.cy) * cam.zoom + vHeight / 2;
    
    // Size scales with zoom
    const radius = Math.max(5, (kingdom.size || 20)) * cam.zoom;
    
    ctx.beginPath();
    ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
    
    if (kingdom.activityState === 'active') ctx.fillStyle = '#D4AF37'; // warm gold
    else if (kingdom.activityState === 'idle') ctx.fillStyle = '#d2b48c'; // tan
    else if (kingdom.activityState === 'quiet') ctx.fillStyle = '#7a9e7e'; // grey-green
    else ctx.fillStyle = '#4a4a4a'; // dormant
    
    ctx.fill();
    ctx.lineWidth = 2 * cam.zoom;
    ctx.strokeStyle = '#222';
    ctx.stroke();

    if (kingdom._isSearchResult) {
      ctx.beginPath();
      ctx.arc(screenX, screenY, radius + 15 * cam.zoom, 0, Math.PI * 2);
      ctx.strokeStyle = 'gold';
      ctx.lineWidth = 4 * cam.zoom;
      ctx.stroke();
      
      // Gentle pulsing effect for search ring using Date.now()
      ctx.beginPath();
      ctx.arc(screenX, screenY, radius + 15 * cam.zoom + (Math.sin(Date.now() / 200) * 5 * cam.zoom), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.lineWidth = 2 * cam.zoom;
      ctx.stroke();
    }

    // Text
    ctx.fillStyle = 'white';
    ctx.font = `${Math.max(10, 14 * cam.zoom)}px "Palatino Linotype", serif`;
    ctx.textAlign = 'center';
    ctx.fillText(kingdom.username, screenX, screenY - radius - 5);
    
    // Hall of Legends visual treatments
    if (kingdom.isHallOfLegends) {
      // Crown icon
      ctx.font = `${Math.max(14, 18 * cam.zoom)}px Arial`;
      ctx.fillText('👑', screenX, screenY - radius - 20 * cam.zoom);
      
      // Stone Obelisk base drawing at the coordinates
      ctx.fillStyle = '#6b6e70';
      ctx.beginPath();
      ctx.moveTo(screenX - 8 * cam.zoom, screenY);
      ctx.lineTo(screenX + 8 * cam.zoom, screenY);
      ctx.lineTo(screenX + 4 * cam.zoom, screenY - 20 * cam.zoom);
      ctx.lineTo(screenX - 4 * cam.zoom, screenY - 20 * cam.zoom);
      ctx.fill();
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const vw = canvas.width;
    const vh = canvas.height;
    
    // 1. Clear canvas
    ctx.clearRect(0, 0, vw, vh);
    
    // 2. Draw background tiles 
    ctx.fillStyle = '#1a2332'; // dark blue water/sky theme
    ctx.fillRect(0, 0, vw, vh);

    const worldLeft = camera.cx - (vw / 2) / camera.zoom;
    const worldRight = camera.cx + (vw / 2) / camera.zoom;
    const worldTop = camera.cy - (vh / 2) / camera.zoom;
    const worldBottom = camera.cy + (vh / 2) / camera.zoom;

    kingdoms.forEach(k => {
      // 3. Get visible kingdoms (CULL OFF-SCREEN)
      const padding = k.size || 50;
      if (
        k.position.x + padding >= worldLeft &&
        k.position.x - padding <= worldRight &&
        k.position.y + padding >= worldTop &&
        k.position.y - padding <= worldBottom
      ) {
         // 4. Draw kingdom
         drawKingdom(ctx, k, camera, vw, vh);
         
         // 5. Draw fog layer over unclaimed kingdoms
         if (!k.isClaimed && k.isNPC === false) {
           const screenX = (k.position.x - camera.cx) * camera.zoom + vw / 2;
           const screenY = (k.position.y - camera.cy) * camera.zoom + vh / 2;
           ctx.beginPath();
           ctx.arc(screenX, screenY, (k.size||20)*camera.zoom + 5, 0, Math.PI*2);
           ctx.fillStyle = 'rgba(200, 200, 200, 0.4)'; // fog
           ctx.fill();
         }
         
         // Top 3 Hall Of Legends World-Zoom Glow
         if (k.isHallOfLegends) {
           const screenX = (k.position.x - camera.cx) * camera.zoom + vw / 2;
           const screenY = (k.position.y - camera.cy) * camera.zoom + vh / 2;
           
           ctx.beginPath();
           ctx.arc(screenX, screenY, ((k.size || 20) + 40 + (Math.sin(Date.now()/500) * 10)) * camera.zoom, 0, Math.PI*2);
           ctx.fillStyle = 'rgba(255, 215, 0, 0.05)'; // Very faint gold
           ctx.fill();
         }
      }
    });

  };

  useEffect(() => {
    setRedrawCallback(draw);
    
    const handleResize = () => {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      draw();
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial sizing and draw
    
    // Kickstart animation loop for GSAP tweens and manual redraws
    let raf;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(raf);
    };
  }, [camera, kingdoms]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickScreenX = e.clientX - rect.left;
    const clickScreenY = e.clientY - rect.top;
    
    const clickWorldX = (clickScreenX - canvasRef.current.width / 2) / camera.zoom + camera.cx;
    const clickWorldY = (clickScreenY - canvasRef.current.height / 2) / camera.zoom + camera.cy;
    
    // Search within 50 world units
    const found = qt.find(clickWorldX, clickWorldY, 50);
    if (found) {
      const dist = Math.hypot(found.position.x - clickWorldX, found.position.y - clickWorldY);
      if (dist <= (found.size || 20)) {
        setSelectedKingdom(found);
        panTo(found.position.x, found.position.y, Math.max(camera.zoom, 1.5));
      } else {
        setSelectedKingdom(null);
      }
    } else {
      setSelectedKingdom(null);
    }
  };

  return (
    <canvas 
      ref={canvasRef} 
      onClick={handleCanvasClick}
      style={{ display: 'block', width: '100vw', height: '100vh', cursor: 'grab' }}
    />
  );
}
