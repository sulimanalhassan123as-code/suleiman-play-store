import { useTheme, themes } from '../context/ThemeContext';
import { useState } from 'react';

export default function Header() {
  const { theme, themeName, setThemeName } = useTheme();
  const [showThemes, setShowThemes] = useState(false);

  const greetings = {
    morning: '☀️ Good Morning!',
    afternoon: '🌤️ Good Afternoon!',
    evening: '🌙 Good Evening!',
    dark: '🌑 Welcome!',
    green: '🕌 Assalamu Alaikum!'
  };

  return (
    <header className="main-header" style={{ background: theme.headerBg }}>
      <div className="header-top">
        <div className="header-brand">
          <div className="header-logo">🏪</div>
          <div className="header-titles">
            <span className="header-main-title">Suleiman Play Store</span>
            <span className="header-sub" style={{ color: 'rgba(255,255,255,0.75)' }}>Never Hide Tech Empire · All apps one place</span>
          </div>
        </div>
        <div className="header-controls">
          <div className="greeting-badge">{greetings[themeName]}</div>
          <button className="theme-toggle-btn" onClick={() => setShowThemes(!showThemes)}>
            {theme.emoji}
          </button>
        </div>
      </div>

      {showThemes && (
        <div className="theme-panel">
          {Object.entries(themes).map(([key, t]) => (
            <button
              key={key}
              className={`theme-btn ${themeName === key ? 'active-theme' : ''}`}
              onClick={() => { setThemeName(key); setShowThemes(false); }}
              style={{
                background: themeName === key ? t.accent : 'rgba(255,255,255,0.15)',
                color: '#fff'
              }}
            >
              {t.emoji} {t.name}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
