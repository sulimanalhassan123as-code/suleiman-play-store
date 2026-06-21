import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  const tabs = [
    { path: '/', icon: '🏪', label: 'Store' },
    { path: '/community', icon: '💬', label: 'Community' },
    { path: '/profile', icon: '👤', label: 'Profile' }
  ];

  return (
    <nav className="bottom-nav" style={{ background: theme.navBg, borderTop: `1px solid ${theme.accent}33` }}>
      {tabs.map(tab => {
        const active = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            className={`nav-tab ${active ? 'nav-tab-active' : ''}`}
            onClick={() => navigate(tab.path)}
            style={{ color: active ? theme.accent : theme.subtext }}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label" style={{ color: active ? theme.accent : theme.subtext }}>{tab.label}</span>
            {active && <div className="nav-indicator" style={{ background: theme.accent }} />}
          </button>
        );
      })}
    </nav>
  );
}
