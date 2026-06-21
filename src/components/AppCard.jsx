import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function AppCard({ app }) {
  const { theme } = useTheme();
  const { installedApps, installApp, uninstallApp } = useAppContext();
  const [flipped, setFlipped] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const isInstalled = installedApps.includes(app.id);

  const handleInstall = (e) => {
    e.stopPropagation();
    if (isInstalled) {
      uninstallApp(app.id);
      return;
    }
    setInstalling(true);
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => {
          setInstalling(false);
          installApp(app.id);
        }, 500);
      }
      setProgress(Math.min(p, 100));
    }, 200);
  };

  const handleOpen = (e) => {
    e.stopPropagation();
    navigate(`/app/${app.id}`);
  };

  return (
    <div
      className={`app-card-wrapper ${flipped ? 'flipped' : ''}`}
      onClick={() => setFlipped(!flipped)}
    >
      <div className="app-card-inner">
        {/* FRONT */}
        <div className="app-card-front" style={{ background: theme.cardBg, borderColor: theme.accent + '22' }}>
          <div className="app-icon-wrap" style={{ background: app.color + '22', border: `2px solid ${app.color}33` }}>
            <span className="app-icon">{app.emoji}</span>
          </div>
          <div className="app-info">
            <h3 className="app-name" style={{ color: theme.text }}>{app.name}</h3>
            <div className="app-meta">
              <span className="app-rating">★ {app.rating}</span>
              <span className="app-downloads" style={{ color: theme.subtext }}>{app.downloads}</span>
            </div>
            <p className="app-desc" style={{ color: theme.subtext }}>{app.description}</p>
          </div>
          <div className="app-actions">
            {installing ? (
              <div className="install-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%`, background: app.color }} />
                </div>
                <span style={{ color: theme.subtext, fontSize: 11 }}>{Math.round(progress)}%</span>
              </div>
            ) : (
              <button
                className="btn-install"
                style={{ background: isInstalled ? '#888' : app.color }}
                onClick={handleInstall}
              >
                {isInstalled ? 'Uninstall' : 'Install'}
              </button>
            )}
            <button className="btn-open" style={{ borderColor: app.color, color: app.color }} onClick={handleOpen}>
              Open
            </button>
          </div>
          <div className="flip-hint" style={{ color: theme.subtext }}>Tap card to flip ↩</div>
        </div>

        {/* BACK */}
        <div className="app-card-back" style={{ background: app.color, color: '#fff' }}>
          <div className="back-icon">{app.emoji}</div>
          <h3 className="back-title">{app.name}</h3>
          <p className="back-desc">{app.fullDescription}</p>
          <div className="back-features">
            {app.features?.map((f, i) => (
              <span key={i} className="feature-badge">✓ {f}</span>
            ))}
          </div>
          <div className="back-actions">
            <button className="btn-back-share" onClick={(e) => { e.stopPropagation(); navigator.share?.({ title: app.name, text: app.description }); }}>
              📤 Share
            </button>
            <button className="btn-back-open" onClick={handleOpen}>
              🔗 Details
            </button>
          </div>
          <div className="flip-hint-back">Tap to flip back ↩</div>
        </div>
      </div>
    </div>
  );
}
