import { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';

export function useMapCamera(initialCx = 2000, initialCy = 2000, initialZoom = 1) {
  const [camera, setCamera] = useState({ cx: initialCx, cy: initialCy, zoom: initialZoom });
  const cameraRef = useRef({ cx: initialCx, cy: initialCy, zoom: initialZoom });
  const redrawRef = useRef(() => {});

  const updateCamera = (updates) => {
    Object.assign(cameraRef.current, updates);
    setCamera({ ...cameraRef.current });
  };

  const panTo = useCallback((x, y, zoomLevel, duration = 1.4) => {
    gsap.to(cameraRef.current, {
      cx: x, cy: y, zoom: zoomLevel,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => redrawRef.current(),
      onComplete: () => setCamera({ ...cameraRef.current })
    });
  }, []);

  useEffect(() => {
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let velocity = { x: 0, y: 0 };
    let lastTime = 0;
    let panTween = null;
    let activeKeys = new Set();
    let animationFrameId;

    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        activeKeys.add(e.key);
      }
    };
    const handleKeyUp = (e) => activeKeys.delete(e.key);

    const keyLoop = () => {
      if (activeKeys.size > 0) {
        const speed = 10 / cameraRef.current.zoom;
        let dx = 0, dy = 0;
        if (activeKeys.has('ArrowUp')) dy -= speed;
        if (activeKeys.has('ArrowDown')) dy += speed;
        if (activeKeys.has('ArrowLeft')) dx -= speed;
        if (activeKeys.has('ArrowRight')) dx += speed;
        
        cameraRef.current.cx += dx;
        cameraRef.current.cy += dy;
        redrawRef.current();
      }
      animationFrameId = requestAnimationFrame(keyLoop);
    };
    animationFrameId = requestAnimationFrame(keyLoop);

    const handlePointerDown = (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = performance.now();
      if (panTween) panTween.kill();
    };

    const handlePointerMove = (e) => {
      if (!isDragging) return;
      const dx = (lastX - e.clientX) / cameraRef.current.zoom;
      const dy = (lastY - e.clientY) / cameraRef.current.zoom;
      
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      velocity = { x: dx / dt, y: dy / dt };
      
      cameraRef.current.cx += dx;
      cameraRef.current.cy += dy;
      
      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = now;
      redrawRef.current();
    };

    const handlePointerUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      if (speed > 0.1) { 
        panTween = gsap.to(cameraRef.current, {
          cx: cameraRef.current.cx + velocity.x * 200,
          cy: cameraRef.current.cy + velocity.y * 200,
          duration: 1,
          ease: 'power3.out',
          onUpdate: () => redrawRef.current(),
          onComplete: () => setCamera({ ...cameraRef.current })
        });
      } else {
        setCamera({ ...cameraRef.current });
      }
    };

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = 1.05;
      let newZoom = cameraRef.current.zoom;
      
      if (e.ctrlKey) {
        newZoom = newZoom * (e.deltaY < 0 ? zoomFactor : 1/zoomFactor);
      } else {
        newZoom = newZoom * (e.deltaY < 0 ? zoomFactor : 1/zoomFactor);
      }
      
      cameraRef.current.zoom = Math.max(0.15, Math.min(5.0, newZoom));
      redrawRef.current();
      
      clearTimeout(window.zoomEndTimeout);
      window.zoomEndTimeout = setTimeout(() => {
        setCamera({ ...cameraRef.current });
      }, 100);
    };

    let initialPinchDistance = null;
    let initialZoomOnPinch = null;

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (initialPinchDistance === null) {
          initialPinchDistance = dist;
          initialZoomOnPinch = cameraRef.current.zoom;
        } else {
          const scale = dist / initialPinchDistance;
          cameraRef.current.zoom = Math.max(0.15, Math.min(5.0, initialZoomOnPinch * scale));
          redrawRef.current();
        }
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        initialPinchDistance = null;
        initialZoomOnPinch = null;
        setCamera({ ...cameraRef.current });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    
    // Non-passive event listeners needed to preventDefault for wheel/touch zoom
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const setRedrawCallback = useCallback((cb) => {
    redrawRef.current = cb;
  }, []);

  return { camera: cameraRef.current, stateCamera: camera, updateCamera, panTo, setRedrawCallback };
}
