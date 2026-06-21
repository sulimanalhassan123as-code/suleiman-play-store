import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { theme } = useTheme();
  const { installedApps, apps } = useAppContext();
  const { user, signOut, isSupabaseReady } = useAuth();
  const navigate = useNavigate();
  const installed = apps.filter(a => installedApps.includes(a.id));

  const handleSignOut = async () => { await signOut(); };

  return (
    <div className="profile-page">
      <div className="profile-hero" style={{ background: theme.headerBg }}>
        <div className="profile-avatar">{user ? '😊' : '👤'}</div>
        <div className="profile-info">
          <h2 style={{ color: '#fff', margin: 0 }}>{user?.user_metadata?.full_name || 'Guest User'}</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0 }}>{user?.email || 'Never Hide Tech Empire'}</p>
        </div>
        {user ? (
          <button className="sign-in-btn" style={{ background: 'rgba(255,0,0,0.3)', color: '#fff' }} onClick={handleSignOut}>
            Sign Out
          </button>
        ) : (
          <button className="sign-in-btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }} onClick={() => navigate('/auth')}>
            Sign In / Register
          </button>
        )}
      </div>

      <div className="profile-body">
        <div className="profile-stat-row">
          <div className="stat-card" style={{ background: theme.cardBg }}>
            <div className="stat-num" style={{ color: theme.accent }}>{installed.length}</div>
            <div className="stat-label" style={{ color: theme.subtext }}>Installed</div>
          </div>
          <div className="stat-card" style={{ background: theme.cardBg }}>
            <div className="stat-num" style={{ color: theme.accent }}>0</div>
            <div className="stat-label" style={{ color: theme.subtext }}>Reviews</div>
          </div>
          <div className="stat-card" style={{ background: theme.cardBg }}>
            <div className="stat-num" style={{ color: theme.accent }}>0</div>
            <div className="stat-label" style={{ color: theme.subtext }}>Posts</div>
          </div>
        </div>

        {!isSupabaseReady && (
          <div style={{ background: theme.accent + '22', border: `1px solid ${theme.accent}`, borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 13, color: theme.text }}>
            🔧 <b>Auth coming soon!</b> Add Supabase keys to Vercel to enable Sign In/Register.
          </div>
        )}

        {installed.length > 0 && (
          <div className="installed-section">
            <h3 style={{ color: theme.text }}>📱 Installed Apps</h3>
            {installed.map(app => (
              <div key={app.id} className="installed-item" style={{ background: theme.cardBg }}>
                <span style={{ fontSize: 24 }}>{app.emoji}</span>
                <span style={{ color: theme.text, flex: 1 }}>{app.name}</span>
                <span className="installed-badge" style={{ background: app.color + '22', color: app.color }}>Installed</span>
              </div>
            ))}
          </div>
        )}

        <div className="profile-menu">
          {[
            { icon: '⚙️', label: 'Settings' },
            { icon: '🔔', label: 'Notifications' },
            { icon: '👑', label: 'Admin Panel', action: () => navigate('/admin') },
            { icon: '❓', label: 'Help & Support' },
            { icon: '📜', label: 'Privacy Policy' },
          ].map(item => (
            <div key={item.label} className="menu-item" style={{ borderBottom: `1px solid ${theme.accent}22`, cursor: item.action ? 'pointer' : 'default' }} onClick={item.action}>
              <span>{item.icon}</span>
              <span style={{ color: theme.text }}>{item.label}</span>
              <span style={{ color: theme.subtext }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
