import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useStore } from './store/useStore';
import { quadtree } from 'd3-quadtree';

import LandingPage from './components/Landing/LandingPage';
import AppMapContainer from './components/Map/AppMapContainer';
import LoadingScreen from './components/UI/LoadingScreen';
import MobileGate from './components/UI/MobileGate';

// Extract the inner logic that needs hooks (like useLocation, useNavigate)
function AppContent() {
  const { setKingdoms, setHallOfLegends, setJwt, setCamera } = useStore();
  const [initialLoading, setInitialLoading] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check JWT from URL on OAuth callback
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setJwt(tokenParam);
      // Clean URL silently
      navigate(location.pathname, { replace: true });
    }
  }, [searchParams, navigate, location.pathname, setJwt]);

  useEffect(() => {
    const fetchKingdoms = async () => {
      const startTime = Date.now();
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/kingdoms`);
        
        // Populate store
        setKingdoms(res.data);
        
        // Identify Hall of Legends from payload flag
        const legends = res.data.filter(k => k.isHallOfLegends).map(k => k.username);
        setHallOfLegends(legends);

        // Pre-build quadtree (optional here, MapCanvas also builds one, but keeping it central is good)
        // ... handled in components
        
        // Handle Direct Routing for /kingdom/:username
        if (location.pathname.startsWith('/kingdom/')) {
           const targetUsername = location.pathname.split('/')[2];
           const target = res.data.find(k => k.username === targetUsername);
           
           if (target) {
              setCamera({ cx: target.position.x, cy: target.position.y, zoom: 2.5 });
              // The AppMapContainer logic will open the panel on mount if auth logic applies
              // but we'll let AppMapContainer handle the activeKingdom setting
           } else {
             console.warn(`Kingdom ${targetUsername} not yet charted.`);
             // Handled by UI toast soon
           }
        }

      } catch (e) {
        console.error("Failed to load map data.", e);
      } finally {
        // Enforce Minimum Loading Time (1.2s minimum)
        const elapsed = Date.now() - startTime;
        const minWait = 1200;
        if (elapsed < minWait) {
          setTimeout(() => setInitialLoading(false), minWait - elapsed);
        } else {
          setInitialLoading(false);
        }
      }
    };

    fetchKingdoms();
  }, []); // Run once on mount

  // Progress logic for the loading screen (simulated 0-100% since it's a single fetch)
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (initialLoading) {
      const interval = setInterval(() => {
        setProgress(p => Math.min(p + 15, 95)); // cap at 95% until done
      }, 100);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [initialLoading]);

  if (initialLoading) {
    return <LoadingScreen progress={progress} />;
  }

  return (
    <>
      <MobileGate />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/map" element={<AppMapContainer />} />
        <Route path="/kingdom/:username" element={<AppMapContainer />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
