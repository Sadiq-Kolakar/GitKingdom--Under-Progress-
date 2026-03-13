import React, { useState, useRef, useEffect } from 'react';
import MapCanvas from './MapCanvas';
import FogLayer from './FogLayer';
import LoginPrompt from '../Auth/LoginPrompt';
import ParchmentPanel from '../Kingdom/ParchmentPanel';
import MapSearch from './MapSearch';
import RavenTravel from './RavenTravel';
import { useMapCamera } from '../../hooks/useMapCamera';
import { useStore } from '../../store/useStore';

export default function AppMapContainer() {
  const { camera, panTo, setRedrawCallback } = useMapCamera(2000, 2000, 1);
  const { kingdoms, token, isCharting, setCharting, addToVisitHistory } = useStore();
  const fogLayerRef = useRef();
  const ravenRef = useRef();

  const [authPromptKingdom, setAuthPromptKingdom] = useState(null);
  const [activeKingdomNode, setActiveKingdomNode] = useState(null); // The kingdom details to show in ParchmentPanel
  const [isCapturing, setIsCapturing] = useState(false);
  
  // A pseudo URL handler to look for ?token= or ?claim= 
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const claimParam = urlParams.get('claim');
    
    if (tokenParam) {
      useStore.getState().setJwt(tokenParam); // Update from setToken -> setJwt per store update
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (claimParam && !token) {
      // Find kingdom info from context if any, or just passing a mock node 
      // where `username` satisfies the login prompt expectations
      setAuthPromptKingdom({ username: claimParam });
    }
  }, [token]);

  // Handle precise URL routing for /kingdom/:username
  const [toastMsg, setToastMsg] = useState('');
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 'kingdom' && pathParts[2]) {
      const targetUser = pathParts[2];
      const found = kingdoms.find(k => k.username === targetUser);

      if (found) {
        // Pan and open panel (or just show github tooltip if fogged)
        panTo(found.position.x, found.position.y, 2.5, 1.4);
        if (found.isClaimed || found.isNPC) {
           setTimeout(() => setActiveKingdomNode(found), 1400); // open panel after pan
        }
      } else if (kingdoms.length > 0) { // ensure we actually loaded data first
        setToastMsg('This kingdom has not yet been discovered');
        setTimeout(() => setToastMsg(''), 4000);
      }
    }
  }, [kingdoms]);

  const handleKingdomClick = (kingdom) => {
    if (!token) {
      setAuthPromptKingdom(kingdom);
    } else {
      // Find starting point (user's kingdom)
      const myKingdom = kingdoms.find(k => k.username === useStore.getState().user?.username);
      const startPos = myKingdom ? myKingdom.position : { x: 2000, y: 2000 };
      
      if (ravenRef.current) {
        ravenRef.current.sendRaven(startPos, kingdom);
      }
    }
  };

  const handleSearchMatch = (kingdomMatch) => {
    // Find full kingdom obj matching the search payload
    const fullKingdom = kingdoms.find(k => k.username === kingdomMatch.username);
    if (!fullKingdom) return;
    
    // Search is an instant pan mapping to UI, not a raven trip typically, but let's 
    // force it to just pan there per the requirements: "NO raven for search — direct pan"
    panTo(fullKingdom.position.x, fullKingdom.position.y, 2.5, 1.4);
    
    // Add golden ring highlighter flag
    fullKingdom._isSearchResult = true; 
    setTimeout(() => { fullKingdom._isSearchResult = false; }, 3000);
    
    // Open panel logic
    if (token) {
      setActiveKingdomNode(fullKingdom);
      addToVisitHistory(fullKingdom.username);
    }
  };

  const handleCaptureKingdom = async (kingdom) => {
    setIsCapturing(true);
    // Hide UI
    await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))); // Wait for frameworks to hide UI elements
    
    try {
      // Assuming FogLayer + MapCanvas drawn to same screen space, simplest capture:
      // html2canvas wrapper around the whole root div, targeting the canvas layers
      const html2canvas = (await import('html2canvas')).default;
      const canvasElt = document.getElementById('map-container-root');
      
      if (canvasElt) {
        const renderedCanvas = await html2canvas(canvasElt, {
          backgroundColor: '#1E1E1E'
        });

        // Add the pseudo-parchment frame via 2d context
        const ctx = renderedCanvas.getContext('2d');
        ctx.strokeStyle = '#d3bd9a';
        ctx.lineWidth = 20;
        ctx.strokeRect(10, 10, renderedCanvas.width - 20, renderedCanvas.height - 20);

        // Add small label at bottom
        ctx.fillStyle = '#1E1E1E';
        ctx.fillRect(renderedCanvas.width / 2 - 150, renderedCanvas.height - 70, 300, 40);
        ctx.fillStyle = '#d3bd9a';
        ctx.font = 'bold 20px "Palatino Linotype", serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${kingdom.username} — ${kingdom.characterClass}`, renderedCanvas.width / 2, renderedCanvas.height - 42);

        const dataUrl = renderedCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `kingdom-${kingdom.username}.png`;
        a.click();
      }
    } catch (e) {
      console.error('Capture failed', e);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleReturnHome = () => {
    panTo(2000, 2000, 1.0, 1.5); // Smooth pan back to the heartland center
  };

  // Preloading simulation logic before Fog Lift phase begins
  const startFogLiftSequence = async (kingdom) => {
    setCharting(true);
    
    // Simulating preloading assets (images, sprites needed for Terrain & Character)
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    // Actual implementation would Promise.all() image.onload events
    
    setCharting(false);
    
    if (fogLayerRef.current) {
      fogLayerRef.current.triggerFogLift(kingdom);
    }
  };

  return (
    <div id="map-container-root" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#1E1E1E' }}>
      
      <MapCanvas 
        kingdoms={kingdoms} 
        camera={camera} 
        panTo={panTo}
        setRedrawCallback={setRedrawCallback} 
      />
      
      <FogLayer 
        ref={fogLayerRef}
        kingdoms={kingdoms} 
        camera={camera} 
        panTo={panTo}
        onKingdomClick={handleKingdomClick} 
        onLiftComplete={() => { 
           // When animation is completely done, trigger parchment panel for current user
           // We assume we know who they are, but for generic logic:
           // setActiveKingdomNode(newlyChartedKingdom)
        }}
      />
      
      <RavenTravel 
        ref={ravenRef} 
        camera={camera} 
        panTo={panTo} 
        onArrival={(kingdom) => setActiveKingdomNode(kingdom)} 
      />

      {/* ALWAYS VISIBLE HUD (Unless capturing) */}
      {!isCapturing && (
        <>
          <MapSearch onMatchFound={handleSearchMatch} />
          
          {toastMsg && (
            <div style={{ position: 'absolute', top: 80, left: 20, zIndex: 100, backgroundColor: 'rgba(30, 30, 35, 0.9)', padding: '10px 15px', color: '#d3bd9a', border: '1px solid #8a6e4b', borderRadius: '4px', fontFamily: '"Palatino Linotype", serif', animation: 'fadeIn 0.3s' }}>
              {toastMsg}
            </div>
          )}

          <button onClick={handleReturnHome} style={{
           position: 'absolute', top: '20px', right: '20px', zIndex: 50,
           backgroundColor: 'rgba(30, 30, 35, 0.8)', color: '#d3bd9a', border: '1px solid #d3bd9a',
           padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', fontFamily: '"Palatino Linotype", serif',
           boxShadow: '0 4px 6px rgba(0,0,0,0.3)', fontWeight: 'bold'
         }}>
           Return Home
         </button>
        </>
      )}

      {/* PARCHMENT PANEL (Hidden if capturing) */}
      {!isCapturing && activeKingdomNode && (
         <ParchmentPanel
           kingdom={activeKingdomNode}
           onClose={() => setActiveKingdomNode(null)}
           onCapture={handleKingdomClick} 
         />
      )}

      {/* OAUTH MODAL (Hidden if capturing) */}
      {!isCapturing && authPromptKingdom && (
        <LoginPrompt 
          kingdom={authPromptKingdom} 
          onClose={() => setAuthPromptKingdom(null)} 
        />
      )}
      
    </div>
  );
}
