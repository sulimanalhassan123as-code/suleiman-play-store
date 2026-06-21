import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { theme } = useTheme();
  const { installedApps, apps } = useAppContext();
  const { user, signOut, isSupabaseReady } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(null);
  const installed = apps.filter(a => installedApps.includes(a.id));

  const handleSignOut = async () => { await signOut(); };

  const menuItems = [
    {
      icon: '⚙️', label: 'Settings',
      action: () => setActiveSection(activeSection === 'settings' ? null : 'settings')
    },
    {
      icon: '🔔', label: 'Notifications',
      action: () => setActiveSection(activeSection === 'notif' ? null : 'notif')
    },
    {
      icon: '👑', label: 'Admin Panel',
      action: () => navigate('/admin')
    },
    {
      icon: '❓', label: 'Help & Support',
      action: () => setActiveSection(activeSection === 'support' ? null : 'support')
    },
    {
      icon: '📜', label: 'Privacy Policy',
      action: () => setActiveSection(activeSection === 'privacy' ? null : 'privacy')
    },
  ];

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
            Sign In
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

        {installed.length > 0 && (
          <div className="installed-section">
            <h3 style={{ color: theme.text }}>📱 Installed Apps</h3>
            {installed.map(app => (
              <div key={app.id} className="installed-item" style={{ background: theme.cardBg }}>
                <span style={{ fontSize: 24 }}>{app.emoji || app.icon}</span>
                <span style={{ color: theme.text, flex: 1 }}>{app.name}</span>
                <span className="installed-badge" style={{ background: (app.color || '#3498db') + '22', color: app.color || '#3498db' }}>Installed</span>
              </div>
            ))}
          </div>
        )}

        <div className="profile-menu">
          {menuItems.map(item => (
            <div key={item.label}>
              <div
                className="menu-item"
                style={{ borderBottom: `1px solid ${theme.accent}22`, cursor: 'pointer', background: activeSection && item.label.toLowerCase().includes(activeSection) ? theme.accent + '11' : 'transparent' }}
                onClick={item.action}
              >
                <span>{item.icon}</span>
                <span style={{ color: theme.text, flex: 1 }}>{item.label}</span>
                <span style={{ color: theme.subtext }}>›</span>
              </div>

              {/* Settings panel */}
              {activeSection === 'settings' && item.label === 'Settings' && (
                <div style={{ background: theme.cardBg, padding: 16, borderRadius: 12, margin: '4px 0 8px', border: `1px solid ${theme.accent}33` }}>
                  <p style={{ color: theme.text, margin: '0 0 8px', fontWeight: 600 }}>⚙️ Settings</p>
                  <div style={{ color: theme.subtext, fontSize: 13 }}>
                    <div style={{ padding: '8px 0', borderBottom: `1px solid ${theme.accent}22` }}>🌙 Dark Mode — <b style={{color: theme.text}}>Auto (by time)</b></div>
                    <div style={{ padding: '8px 0', borderBottom: `1px solid ${theme.accent}22` }}>🌐 Language — <b style={{color: theme.text}}>English</b></div>
                    <div style={{ padding: '8px 0' }}>📦 App Version — <b style={{color: theme.text}}>v2.0.0</b></div>
                  </div>
                </div>
              )}

              {/* Notifications panel */}
              {activeSection === 'notif' && item.label === 'Notifications' && (
                <div style={{ background: theme.cardBg, padding: 16, borderRadius: 12, margin: '4px 0 8px', border: `1px solid ${theme.accent}33` }}>
                  <p style={{ color: theme.text, margin: '0 0 8px', fontWeight: 600 }}>🔔 Notifications</p>
                  <p style={{ color: theme.subtext, fontSize: 13, margin: 0 }}>Push notifications coming soon in next update! Stay tuned. 🚀</p>
                </div>
              )}

              {/* Support panel */}
              {activeSection === 'support' && item.label === 'Help & Support' && (
                <div style={{ background: theme.cardBg, padding: 16, borderRadius: 12, margin: '4px 0 8px', border: `1px solid ${theme.accent}33` }}>
                  <p style={{ color: theme.text, margin: '0 0 12px', fontWeight: 600 }}>❓ Help & Support</p>
                  <div style={{ color: theme.subtext, fontSize: 13 }}>
                    <p style={{ margin: '0 0 8px' }}>📧 Email: <b style={{color: theme.accent}}>developer123as@gmail.com</b></p>
                    <p style={{ margin: '0 0 8px' }}>🌐 Website: <b style={{color: theme.accent}}>suleiman-play-store.vercel.app</b></p>
                    <p style={{ margin: 0 }}>💬 Community: Use the Community tab to ask questions. Clock AI answers in 8 seconds! 🤖</p>
                  </div>
                </div>
              )}

              {/* Privacy panel */}
              {activeSection === 'privacy' && item.label === 'Privacy Policy' && (
                <div style={{ background: theme.cardBg, padding: 16, borderRadius: 12, margin: '4px 0 8px', border: `1px solid ${theme.accent}33` }}>
                  <p style={{ color: theme.text, margin: '0 0 8px', fontWeight: 600 }}>📜 Privacy Policy</p>
                  <p style={{ color: theme.subtext, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                    Never Hide Tech Empire respects your privacy. We collect only email for authentication. 
                    Your data is stored securely via Supabase. We do not sell or share your personal information. 
                    Community posts are public. You can delete your account by contacting support. 
                    Built with ❤️ for the Ummah.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', padding: '20px 0', color: theme.subtext, fontSize: 12 }}>
          Built by <b style={{color: theme.accent}}>Never Hide Tech Empire</b> 🚀<br />
          Suleiman Play Store v2.0.0
        </div>
      </div>
    </div>
  );
}
