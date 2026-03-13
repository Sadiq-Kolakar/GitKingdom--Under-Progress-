import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useStore } from '../../store/useStore';

export default function ParchmentPanel({ kingdom, onClose, onCapture }) {
  const panelRef = useRef(null);
  const [toastMessage, setToastMessage] = useState('');
  
  useEffect(() => {
    // Slide up from bottom
    gsap.fromTo(panelRef.current, 
      { y: '100%' }, 
      { y: '0%', duration: 0.5, ease: 'power2.out' }
    );
  }, [kingdom]);

  const handleClose = () => {
    gsap.to(panelRef.current, {
      y: '100%',
      duration: 0.4,
      ease: 'power2.in',
      onComplete: onClose
    });
  };

  // Touch swipe to dismiss logic
  let touchStartX = 0;
  let touchStartY = 0;
  
  const handleTouchStart = (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  };
  
  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].screenY;
    if (touchEndY - touchStartY > 50) {
      handleClose(); // Swiped down
    }
  };

  const timeDiff = kingdom ? Date.now() - new Date(kingdom.githubData?.lastRefreshed || Date.now()).getTime() : 0;
  const hoursSinceRefresh = Math.floor(timeDiff / (1000 * 60 * 60));
  const isRefreshCooldown = hoursSinceRefresh < 24;
  const refreshRemaining = 24 - hoursSinceRefresh;

  const handleShare = () => {
    const url = `https://realmofcode.dev/kingdom/${kingdom.username}`;
    navigator.clipboard.writeText(url).then(() => {
      setToastMessage('Kingdom link copied to the royal scroll');
      setTimeout(() => setToastMessage(''), 3000);
    });
  };

  if (!kingdom) return null;

  return (
    <div 
      ref={panelRef}
      style={styles.panel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button style={styles.closeBtn} onClick={handleClose}>×</button>

      <div style={styles.contentScroll}>
        {/* 1. CHARACTER HEADER */}
        <div style={styles.header}>
          <div style={styles.portraitPlaceholder}>
             {/* Character SVG placeholder */}
             <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#6b4c2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
               <circle cx="12" cy="7" r="4"></circle>
             </svg>
          </div>
          <div style={styles.headerText}>
            <h1 style={styles.username}>{kingdom.username}</h1>
            <div style={styles.badges}>
              <span style={styles.levelBadge}>Level {kingdom.level}</span>
              <span style={styles.classBadge}>{kingdom.characterClass}</span>
            </div>
          </div>
        </div>

        {/* 2. STATS ROW */}
        <div style={styles.statsRow}>
          <StatBox label="Primary Arcane Art" value={kingdom.githubData?.primaryLanguage || 'Unknown'} />
          <StatBox label="Year Founded" value={new Date(kingdom.githubData?.accountCreatedAt).getFullYear() || 'Unknown'} />
          <StatBox label="Chronicles" value={kingdom.githubData?.repoCount || 0} />
          <StatBox label="Battles Fought" value={kingdom.githubData?.totalCommits || 0} />
        </div>

        <hr style={styles.divider} />

        {/* 3. CHRONICLES SECTION */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Chronicles (Top Repos)</h3>
          <div style={styles.grid}>
            {(kingdom.githubData?.topRepos || []).slice(0, 6).map(repo => {
              const inactiveDays = (Date.now() - new Date(repo.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
              const isRuin = inactiveDays >= 365;
              
              return (
                <div key={repo.name} style={{...styles.card, opacity: isRuin ? 0.7 : 1}}>
                  <div style={styles.cardHeader}>
                    <span style={styles.repoName}>
                      {isRuin && <span title="Ruins (Inactive 1y+)" style={{marginRight: 4}}>🏚️</span>}
                      {repo.name}
                    </span>
                    <span style={styles.stars}>★ {repo.stars}</span>
                  </div>
                  <div style={styles.cardMeta}>
                    {repo.language && <span style={styles.langDot} />} 
                    <span style={{flex: 1}}>{repo.language || 'Unknown'}</span>
                    <span>{repo.commits || 0} battles fought</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <hr style={styles.divider} />

        {/* 4. ROYAL DECREES */}
        {kingdom.githubData?.pinnedRepos && kingdom.githubData.pinnedRepos.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Royal Decrees (Pinned)</h3>
            <div style={styles.grid}>
              {kingdom.githubData.pinnedRepos.map(repo => (
                <div key={repo.name} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.repoName}>{repo.name}</span>
                    <span style={styles.stars}>★ {repo.stars}</span>
                  </div>
                  <div style={{fontSize: '12px', marginTop: '4px', color: '#5a4f43'}}>
                    {repo.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <hr style={styles.divider} />

        {/* 5. KINGDOM LORE */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Kingdom Lore</h3>
          <p style={styles.loreText}>{kingdom.lore}</p>
        </div>

        {/* 6. METADATA FOOTER */}
        <div style={styles.footer}>
          <div style={styles.refreshInfo}>
            Kingdom last surveyed: {hoursSinceRefresh === 0 ? 'just now' : `${hoursSinceRefresh} hours ago`}
          </div>
          <div style={styles.actions}>
            <button 
              style={{...styles.btn, opacity: isRefreshCooldown ? 0.5 : 1}} 
              disabled={isRefreshCooldown}
              title={isRefreshCooldown ? `Ravens need rest. Available in ${refreshRemaining}h.` : 'Survey Kingdom'}
            >
              Refresh Kingdom
            </button>
            <button style={styles.btn} onClick={handleShare}>Share Kingdom</button>
            <button style={styles.btnPrimary} onClick={() => onCapture(kingdom)}>Capture Kingdom</button>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div style={styles.toast}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

const StatBox = ({ label, value }) => (
  <div style={styles.statBox}>
    <div style={styles.statVal}>{value}</div>
    <div style={styles.statLabel}>{label}</div>
  </div>
);

const styles = {
  panel: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '800px',
    height: '45vh',
    minHeight: '400px',
    backgroundColor: '#f4ebd8', // Cream/tan aged parchment color
    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.08%22/%3E%3C/svg%3E")', // Subtle SVG noise texture
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
    zIndex: 100,
    color: '#3e2e1e', // Dark brown ink text
    fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif',
    border: '2px solid #d3bd9a',
    borderBottom: 'none',
    display: 'flex',
    flexDirection: 'column'
  },
  contentScroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '30px 40px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#c4a97f transparent'
  },
  closeBtn: {
    position: 'absolute',
    top: '15px', right: '20px',
    background: 'none', border: 'none',
    fontSize: '28px', color: '#8a6e4b',
    cursor: 'pointer', zIndex: 10
  },
  header: {
    display: 'flex', alignItems: 'center', marginBottom: '25px'
  },
  portraitPlaceholder: {
    width: '70px', height: '70px',
    borderRadius: '50%', border: '2px solid #8a6e4b',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#e6d5b8', marginRight: '20px'
  },
  headerText: {
    display: 'flex', flexDirection: 'column'
  },
  username: {
    margin: 0, fontSize: '32px', color: '#1a120b', letterSpacing: '1px'
  },
  badges: {
    display: 'flex', gap: '10px', marginTop: '5px'
  },
  levelBadge: {
    background: '#8a6e4b', color: '#f4ebd8',
    padding: '2px 8px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold'
  },
  classBadge: {
    background: '#3e2e1e', color: '#d4af37',
    padding: '2px 8px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold'
  },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px'
  },
  statBox: {
    textAlign: 'center', background: 'rgba(138, 110, 75, 0.1)',
    padding: '10px', borderRadius: '8px', border: '1px solid rgba(138, 110, 75, 0.2)'
  },
  statVal: {
    fontSize: '20px', fontWeight: 'bold', color: '#1a120b'
  },
  statLabel: {
    fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b4c2a', marginTop: '4px'
  },
  divider: {
    border: '0', height: '1px', background: 'linear-gradient(to right, transparent, #c4a97f, transparent)', margin: '25px 0'
  },
  section: {
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '18px', color: '#5a4f43', borderBottom: '1px solid #d3bd9a', paddingBottom: '5px', marginBottom: '15px', marginTop: 0
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px'
  },
  card: {
    background: '#ebddc0', padding: '12px', borderRadius: '6px', border: '1px solid #d3bd9a'
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', marginBottom: '6px'
  },
  repoName: {
    color: '#1a120b', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  },
  stars: {
    color: '#b8860b', fontSize: '13px'
  },
  cardMeta: {
    display: 'flex', alignItems: 'center', fontSize: '12px', color: '#6b4c2a'
  },
  langDot: {
    width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8a6e4b', marginRight: '6px'
  },
  loreText: {
    fontStyle: 'italic', lineHeight: 1.6, fontSize: '16px', color: '#2a1f14', padding: '0 10px'
  },
  footer: {
    marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  refreshInfo: {
    fontSize: '13px', color: '#8a6e4b', fontStyle: 'italic'
  },
  actions: {
    display: 'flex', gap: '10px'
  },
  btn: {
    background: 'transparent', border: '1px solid #8a6e4b', color: '#3e2e1e',
    padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', transition: 'background 0.2s'
  },
  btnPrimary: {
    background: '#3e2e1e', border: '1px solid #1a120b', color: '#f4ebd8',
    padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold'
  },
  toast: {
    position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)',
    background: '#8a6e4b', color: '#f4ebd8', padding: '10px 20px', borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', pointerEvents: 'none', zIndex: 200, fontWeight: 'bold'
  }
};
