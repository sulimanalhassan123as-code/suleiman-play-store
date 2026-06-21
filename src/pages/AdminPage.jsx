import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { supabaseAdmin, isSupabaseReady } from '../lib/supabase';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "neverhide2024";

export default function AdminPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Data states
  const [apps, setApps] = useState([]);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeToday: 0, totalApps: 0, totalPosts: 0 });
  const [loading, setLoading] = useState(false);

  // Form states
  const [announcement, setAnnouncement] = useState('');
  const [showAddApp, setShowAddApp] = useState(false);
  const [newApp, setNewApp] = useState({
    name: '', icon: '📱', category: 'Tools',
    rating: 4.5, downloads: '0', description: '', url: '#', featured: false
  });

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError('');
      loadAll();
    } else {
      setError('Wrong password. Try again.');
    }
  };

  const loadAll = async () => {
    if (!isSupabaseReady || !supabaseAdmin) return;
    setLoading(true);
    try {
      // Fetch apps, announcements, posts in parallel
      const [appsRes, annoRes, postsRes] = await Promise.all([
        supabaseAdmin.from('apps').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('announcements').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('community_posts').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      const appsData = appsRes.data || [];
      const postsData = postsRes.data || [];

      if (appsData.length > 0) setApps(appsData);
      if (annoRes.data) setAnnouncements(annoRes.data);
      if (postsData.length > 0) setPosts(postsData);

      // Fetch auth users via admin API
      let authUsers = [];
      try {
        const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
        if (!usersErr && usersData?.users) {
          authUsers = usersData.users;
          setUsers(authUsers);
        }
      } catch (e) {
        console.warn('Could not load auth users:', e);
      }

      const today = new Date().toDateString();
      const activeToday = authUsers.filter(u =>
        u.last_sign_in_at && new Date(u.last_sign_in_at).toDateString() === today
      ).length;

      setStats({
        totalUsers: authUsers.length,
        activeToday,
        totalApps: appsData.length,
        totalPosts: postsData.length
      });

    } catch (e) {
      console.error('Load error:', e);
    }
    setLoading(false);
  };

  const addApp = async () => {
    if (!newApp.name.trim()) return;
    const { data, error } = await supabaseAdmin.from('apps').insert([{
      ...newApp,
      rating: parseFloat(newApp.rating)
    }]).select();
    if (!error && data) {
      setApps(prev => [data[0], ...prev]);
      setShowAddApp(false);
      setNewApp({ name: '', icon: '📱', category: 'Tools', rating: 4.5, downloads: '0', description: '', url: '#', featured: false });
      alert(`✅ App "${newApp.name}" added!`);
    } else {
      alert('Error: ' + error?.message);
    }
  };

  const deleteApp = async (id, name) => {
    if (!window.confirm(`Remove "${name}"?`)) return;
    const { error } = await supabaseAdmin.from('apps').delete().eq('id', id);
    if (!error) setApps(prev => prev.filter(a => a.id !== id));
  };

  const toggleFeatured = async (id, current) => {
    const { error } = await supabaseAdmin.from('apps').update({ featured: !current }).eq('id', id);
    if (!error) setApps(prev => prev.map(a => a.id === id ? { ...a, featured: !current } : a));
  };

  const postAnnouncement = async () => {
    if (!announcement.trim()) return;
    const { data, error } = await supabaseAdmin.from('announcements').insert([{
      message: announcement, active: true
    }]).select();
    if (!error && data) {
      setAnnouncements(prev => [data[0], ...prev]);
      setAnnouncement('');
      alert('📢 Announcement posted!');
    }
  };

  const deleteAnnouncement = async (id) => {
    const { error } = await supabaseAdmin.from('announcements').delete().eq('id', id);
    if (!error) setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const banUser = async (userId, email) => {
    if (!window.confirm(`Ban user ${email}?`)) return;
    const { error } = await supabaseAdmin.from('banned_users').upsert([{
      user_id: userId, email, reason: 'Banned by admin'
    }]);
    if (!error) {
      await supabaseAdmin.from('profiles').update({ banned: true }).eq('id', userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: true } : u));
      alert('User banned.');
    }
  };

  const unbanUser = async (userId) => {
    const { error } = await supabaseAdmin.from('banned_users').delete().eq('user_id', userId);
    if (!error) {
      await supabaseAdmin.from('profiles').update({ banned: false }).eq('id', userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: false } : u));
      alert('User unbanned.');
    }
  };

  const deletePost = async (id) => {
    const { error } = await supabaseAdmin.from('community_posts').delete().eq('id', id);
    if (!error) setPosts(prev => prev.filter(p => p.id !== id));
  };

  // --- LOGIN SCREEN ---
  if (!authenticated) {
    return (
      <div style={{ background: theme.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: theme.cardBg, border: `2px solid ${theme.accent}`, borderRadius: 20, padding: 32, width: '100%', maxWidth: 360, textAlign: 'center' }}>
          <div style={{ fontSize: 56 }}>👑</div>
          <h2 style={{ color: theme.text, margin: '12px 0 4px' }}>Admin Portal</h2>
          <p style={{ color: theme.subtext, fontSize: 13, marginBottom: 20 }}>Never Hide Tech Empire</p>
          <input
            type="password"
            style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${theme.accent}55`, borderRadius: 10, padding: '12px 14px', background: theme.searchBg, color: theme.text, fontSize: 14, outline: 'none', marginBottom: 8, fontFamily: 'inherit' }}
            placeholder="Enter admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
          />
          {error && <p style={{ color: '#e74c3c', fontSize: 13, margin: '4px 0' }}>⚠️ {error}</p>}
          <button
            style={{ width: '100%', marginTop: 12, background: theme.accent, color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            onClick={login}
          >
            🔐 Login
          </button>
          <button
            style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: theme.subtext, fontSize: 13, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            ← Back to Store
          </button>
        </div>
      </div>
    );
  }

  const tabStyle = (tab) => ({
    flex: 1, border: 'none', borderRadius: 8, padding: '9px 4px',
    background: activeTab === tab ? theme.accent : 'transparent',
    color: activeTab === tab ? '#fff' : theme.subtext,
    fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s'
  });

  const cardStyle = { background: theme.cardBg, borderRadius: 14, padding: 16, border: `1px solid ${theme.accent}22`, marginBottom: 12 };
  const inputStyle = { width: '100%', boxSizing: 'border-box', border: `1px solid ${theme.accent}44`, borderRadius: 10, padding: '10px 12px', background: theme.searchBg, color: theme.text, fontSize: 13, outline: 'none', marginBottom: 8, fontFamily: 'inherit' };

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, paddingBottom: 80 }}>

      {/* HEADER */}
      <div style={{ background: theme.accent, padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>👑</span>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Admin Portal</div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>Never Hide Tech Empire</div>
          </div>
        </div>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>
          ← Store
        </button>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', background: theme.searchBg, padding: 4, margin: '12px 12px 0', borderRadius: 12, gap: 4 }}>
        {[['dashboard','📊'], ['apps','📱'], ['users','👥'], ['announce','📢'], ['posts','💬']].map(([tab, icon]) => (
          <button key={tab} style={tabStyle(tab)} onClick={() => setActiveTab(tab)}>
            {icon}<br/><span style={{ fontSize: 10 }}>{tab}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: '12px 12px' }}>
        {loading && <p style={{ color: theme.subtext, textAlign: 'center' }}>⏳ Loading...</p>}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div>
            <h3 style={{ color: theme.text, marginBottom: 12 }}>📊 Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#3498db' },
                { label: 'Active Today', value: stats.activeToday, icon: '🟢', color: '#27ae60' },
                { label: 'Total Apps', value: stats.totalApps, icon: '📱', color: '#9b59b6' },
                { label: 'Community Posts', value: stats.totalPosts, icon: '💬', color: '#e67e22' },
              ].map(s => (
                <div key={s.label} style={{ background: s.color + '22', border: `1px solid ${s.color}44`, borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28 }}>{s.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: theme.subtext }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <h4 style={{ color: theme.text, margin: '0 0 8px' }}>🕒 Recent Users</h4>
              {users.slice(0, 5).map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${theme.accent}11` }}>
                  <span style={{ fontSize: 20 }}>👤</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: theme.text, fontSize: 13, fontWeight: 600 }}>{u.user_metadata?.full_name || u.email?.split('@')[0] || 'User'}</div>
                    <div style={{ color: theme.subtext, fontSize: 11 }}>{u.email}</div>
                  </div>
                  <div style={{ fontSize: 10, color: u.last_sign_in_at && new Date(u.last_sign_in_at).toDateString() === new Date().toDateString() ? '#27ae60' : theme.subtext }}>
                    {u.last_sign_in_at && new Date(u.last_sign_in_at).toDateString() === new Date().toDateString() ? '🟢 Today' : '⚪ Offline'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* APPS TAB */}
        {activeTab === 'apps' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ color: theme.text, margin: 0 }}>📱 Apps ({apps.length})</h3>
              <button style={{ background: theme.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}
                onClick={() => setShowAddApp(!showAddApp)}>+ Add App</button>
            </div>

            {showAddApp && (
              <div style={{ ...cardStyle, border: `1px solid ${theme.accent}66` }}>
                <h4 style={{ color: theme.text, margin: '0 0 12px' }}>➕ New App</h4>
                {[['name','App Name'],['icon','Emoji Icon'],['category','Category'],['url','App URL'],['downloads','Downloads (e.g. 10K+)'],['description','Short Description']].map(([key, label]) => (
                  <div key={key}>
                    <label style={{ color: theme.subtext, fontSize: 12 }}>{label}</label>
                    <input style={inputStyle} value={newApp[key]} onChange={e => setNewApp(p => ({ ...p, [key]: e.target.value }))} placeholder={label} />
                  </div>
                ))}
                <label style={{ color: theme.subtext, fontSize: 12 }}>Rating (0-5)</label>
                <input style={inputStyle} type="number" min="0" max="5" step="0.1" value={newApp.rating} onChange={e => setNewApp(p => ({ ...p, rating: e.target.value }))} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.subtext, fontSize: 13, marginBottom: 12 }}>
                  <input type="checkbox" checked={newApp.featured} onChange={e => setNewApp(p => ({ ...p, featured: e.target.checked }))} />
                  Featured App
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, background: theme.accent, color: '#fff', border: 'none', borderRadius: 10, padding: 12, cursor: 'pointer', fontWeight: 700 }} onClick={addApp}>✅ Add</button>
                  <button style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 16px', cursor: 'pointer' }} onClick={() => setShowAddApp(false)}>Cancel</button>
                </div>
              </div>
            )}

            {apps.map(app => (
              <div key={app.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{app.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.text, fontWeight: 600, fontSize: 14 }}>{app.name}</div>
                  <div style={{ color: theme.subtext, fontSize: 11 }}>{app.category} · ★{app.rating} · {app.downloads}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
                  <button style={{ background: app.featured ? '#f39c12' : '#555', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}
                    onClick={() => toggleFeatured(app.id, app.featured)}>
                    {app.featured ? '⭐ Featured' : 'Feature'}
                  </button>
                  <button style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: 11 }}
                    onClick={() => deleteApp(app.id, app.name)}>🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <h3 style={{ color: theme.text, marginBottom: 4 }}>👥 Users ({users.length})</h3>
            <p style={{ color: theme.subtext, fontSize: 12, marginBottom: 12 }}>🟢 {stats.activeToday} active today</p>
            {users.length === 0 && <p style={{ color: theme.subtext, textAlign: 'center' }}>No users yet. Share your store!</p>}
            {users.map(u => (
              <div key={u.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>👤</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.text, fontWeight: 600, fontSize: 13 }}>{u.full_name || 'Unknown'}</div>
                  <div style={{ color: theme.subtext, fontSize: 11 }}>{u.email}</div>
                  <div style={{ fontSize: 10, color: theme.subtext, marginTop: 2 }}>
                    Joined: {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    {' · '}Last seen: {u.last_seen ? new Date(u.last_seen).toLocaleDateString() : 'Never'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 10, color: u.last_seen && new Date(u.last_seen).toDateString() === new Date().toDateString() ? '#27ae60' : '#888', fontWeight: 700 }}>
                    {u.last_seen && new Date(u.last_seen).toDateString() === new Date().toDateString() ? '🟢 Online' : '⚫ Offline'}
                  </span>
                  {u.banned ? (
                    <button style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}
                      onClick={() => unbanUser(u.id)}>Unban</button>
                  ) : (
                    <button style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}
                      onClick={() => banUser(u.id, u.email)}>Ban</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'announce' && (
          <div>
            <h3 style={{ color: theme.text, marginBottom: 12 }}>📢 Announcements</h3>
            <div style={cardStyle}>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                placeholder="Type your announcement to all users..."
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
              />
              <button style={{ width: '100%', background: theme.accent, color: '#fff', border: 'none', borderRadius: 10, padding: 12, cursor: 'pointer', fontWeight: 700 }}
                onClick={postAnnouncement}>📢 Post Announcement</button>
            </div>
            {announcements.map(a => (
              <div key={a.id} style={{ ...cardStyle, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20 }}>📢</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.text, fontSize: 13 }}>{a.message}</div>
                  <div style={{ color: theme.subtext, fontSize: 11, marginTop: 4 }}>{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</div>
                </div>
                <button style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}
                  onClick={() => deleteAnnouncement(a.id)}>🗑️</button>
              </div>
            ))}
          </div>
        )}

        {/* POSTS TAB */}
        {activeTab === 'posts' && (
          <div>
            <h3 style={{ color: theme.text, marginBottom: 12 }}>💬 Community Posts ({posts.length})</h3>
            {posts.map(p => (
              <div key={p.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ color: theme.accent, fontWeight: 700, fontSize: 13 }}>{p.user_name}</span>
                    <span style={{ color: theme.subtext, fontSize: 11, marginLeft: 8 }}>{p.created_at ? new Date(p.created_at).toLocaleString() : ''}</span>
                  </div>
                  <button style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer' }}
                    onClick={() => deletePost(p.id)}>🗑️</button>
                </div>
                <p style={{ color: theme.text, margin: '6px 0 0', fontSize: 13 }}>{p.message}</p>
                {p.ai_reply && <p style={{ color: '#27ae60', margin: '6px 0 0', fontSize: 12 }}>🤖 AI: {p.ai_reply}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
