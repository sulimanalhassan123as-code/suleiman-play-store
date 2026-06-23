import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { theme } = useTheme();
  const { installedApps, apps } = useAppContext();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(null);
  const installed = apps.filter(a => installedApps.includes(a.id));

  const menuItems = [
    { icon: '⚙️', label: 'Settings', key: 'settings' },
    { icon: '🔔', label: 'Notifications', key: 'notif' },
    { icon: '👑', label: 'Admin Panel', key: null, action: () => navigate('/admin') },
    { icon: '❓', label: 'Help & Support', key: 'support' },
    { icon: '📜', label: 'Privacy Policy', key: 'privacy' },
  ];

  return (
    <div style={{ paddingBottom: 30 }}>

      {/* ---- HERO ---- */}
      <div style={{
        background: theme.headerBg,
        padding: '28px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, marginBottom: 12,
          border: '3px solid rgba(255,255,255,0.4)',
        }}>
          {user ? '😊' : '👤'}
        </div>

        <h2 style={{ color: '#fff', margin: '0 0 4px', fontSize: 20, fontWeight: 800 }}>
          {user?.user_metadata?.full_name || 'Guest User'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', margin: '0 0 16px', fontSize: 13 }}>
          {user?.email || 'Never Hide Tech Empire'}
        </p>

        {/* Sign In / Sign Out button */}
        <button
          onClick={user ? async () => await signOut() : () => navigate('/auth')}
          style={{
            background: user ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.25)',
            color: '#fff',
            border: '1.5px solid rgba(255,255,255,0.5)',
            borderRadius: 20,
            padding: '8px 24px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {user ? 'Sign Out' : 'Sign In'}
        </button>
      </div>

      {/* ---- STATS ROW ---- */}
      <div style={{
        display: 'flex',
        gap: 10,
        padding: '14px 14px 0',
      }}>
        {[
          { num: installed.length, label: 'Installed' },
          { num: 0, label: 'Reviews' },
          { num: 0, label: 'Posts' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1,
            background: theme.cardBg,
            borderRadius: 16,
            padding: '14px 8px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: theme.accent }}>{s.num}</div>
            <div style={{ fontSize: 11, color: theme.subtext, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ---- INSTALLED APPS ---- */}
      {installed.length > 0 && (
        <div style={{ margin: '14px 14px 0', background: theme.cardBg, borderRadius: 16, padding: 14 }}>
          <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>📱 Installed Apps</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {installed.map(app => (
              <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 26 }}>{app.emoji || app.icon}</span>
                <span style={{ color: theme.text, flex: 1, fontSize: 14, fontWeight: 500 }}>{app.name}</span>
                <span style={{
                  background: `${theme.accent}22`, color: theme.accent,
                  borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600
                }}>Installed</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- MENU ---- */}
      <div style={{ margin: '14px 14px 0', background: theme.cardBg, borderRadius: 16, overflow: 'hidden' }}>
        {menuItems.map((item, i) => (
          <div key={item.label}>
            <div
              onClick={item.action || (() => setActiveSection(activeSection === item.key ? null : item.key))}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '15px 16px',
                borderBottom: i < menuItems.length - 1 ? `1px solid ${theme.accent}18` : 'none',
                cursor: 'pointer',
                background: activeSection === item.key ? `${theme.accent}10` : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ color: theme.text, flex: 1, fontSize: 15, fontWeight: 500 }}>{item.label}</span>
              <span style={{ color: theme.subtext, fontSize: 18 }}>{activeSection === item.key ? '↓' : '›'}</span>
            </div>

            {/* Settings */}
            {activeSection === 'settings' && item.key === 'settings' && (
              <div style={{ background: `${theme.accent}08`, padding: '14px 16px', borderBottom: `1px solid ${theme.accent}18` }}>
                {[
                  { label: '🌙 Dark Mode', val: 'Auto (by time)' },
                  { label: '🌐 Language', val: 'English' },
                  { label: '📦 Version', val: 'v2.0.0' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${theme.accent}12` }}>
                    <span style={{ color: theme.subtext, fontSize: 13 }}>{row.label}</span>
                    <span style={{ color: theme.text, fontSize: 13, fontWeight: 600 }}>{row.val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notif' && item.key === 'notif' && (
              <div style={{ background: `${theme.accent}08`, padding: '14px 16px', borderBottom: `1px solid ${theme.accent}18` }}>
                <p style={{ color: theme.subtext, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                  🔔 Push notifications coming soon! Stay tuned 🚀
                </p>
              </div>
            )}

            {/* Support */}
            {activeSection === 'support' && item.key === 'support' && (
              <div style={{ background: `${theme.accent}08`, padding: '14px 16px', borderBottom: `1px solid ${theme.accent}18` }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 13, color: theme.subtext }}>📧 <b style={{ color: theme.text }}>developer123as@gmail.com</b></div>
                  <div style={{ fontSize: 13, color: theme.subtext }}>🌐 <b style={{ color: theme.accent }}>suleiman-play-store.vercel.app</b></div>
                  <div style={{ fontSize: 13, color: theme.subtext }}>💬 Use the Community tab — Clock AI answers in 8s! 🤖</div>
                </div>
              </div>
            )}

            {/* Privacy */}
            {activeSection === 'privacy' && item.key === 'privacy' && (
              <div style={{ background: `${theme.accent}08`, padding: '14px 16px', borderBottom: `1px solid ${theme.accent}18` }}>
                <p style={{ color: theme.subtext, fontSize: 13, lineHeight: 1.7, margin: 0 }}>
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

      {/* ---- FOOTER ---- */}
      <div style={{ textAlign: 'center', padding: '24px 0 10px', color: theme.subtext, fontSize: 12 }}>
        Built by <b style={{ color: theme.accent }}>Never Hide Tech Empire</b> 🚀<br />
        Suleiman Play Store v2.0.0
      </div>
    </div>
  );
}
