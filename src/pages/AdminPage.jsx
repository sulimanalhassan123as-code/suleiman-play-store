import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { supabaseAdmin, isSupabaseReady } from '../lib/supabase';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'neverhide2024';

export default function AdminPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const [apps, setApps] = useState([]);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [posts, setPosts] = useState([]);
  const [pubRequests, setPubRequests] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeNow: 0, totalApps: 0, totalInstalls: 0, pendingRequests: 0 });
  const [loading, setLoading] = useState(false);

  const [announcement, setAnnouncement] = useState('');
  const [showAddApp, setShowAddApp] = useState(false);
  const [newApp, setNewApp] = useState({
    name: '', icon: '📱', category: 'Tools', rating: 4.5, downloads: '0',
    description: '', full_description: '', url: '', version: '1.0.0',
    size: '—', developer: 'Never Hide Tech Empire', featured: false
  });

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true); setError(''); loadAll();
    } else {
      setError('Wrong password. Access denied.');
    }
  };

  const loadAll = async () => {
    if (!isSupabaseReady || !supabaseAdmin) return;
    setLoading(true);
    try {
      const [appsRes, annoRes, postsRes, pubReqRes, sessionsRes] = await Promise.all([
        supabaseAdmin.from('apps').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('announcements').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('community_posts').select('*').order('created_at', { ascending: false }).limit(50),
        supabaseAdmin.from('publisher_requests').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('active_sessions').select('*').gte('last_ping', new Date(Date.now() - 90000).toISOString()),
      ]);

      if (appsRes.data) setApps(appsRes.data);
      if (annoRes.data) setAnnouncements(annoRes.data);
      if (postsRes.data) setPosts(postsRes.data);
      if (pubReqRes.data) setPubRequests(pubReqRes.data);
      if (sessionsRes.data) setActiveSessions(sessionsRes.data);

      // Fetch auth users
      let authUsers = [];
      try {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (usersData?.users) { authUsers = usersData.users; setUsers(authUsers); }
      } catch (e) { console.warn('Could not load auth users:', e); }

      // Total installs
      const { count: installCount } = await supabaseAdmin.from('app_installs').select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: authUsers.length,
        activeNow: sessionsRes.data?.length || 0,
        totalApps: appsRes.data?.length || 0,
        totalInstalls: installCount || 0,
        pendingRequests: pubReqRes.data?.filter(r => r.status === 'pending').length || 0
      });
    } catch (e) { console.error('Load error:', e); }
    setLoading(false);
  };

  // Refresh active sessions every 30s
  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(async () => {
      if (!supabaseAdmin) return;
      const { data } = await supabaseAdmin.from('active_sessions').select('*')
        .gte('last_ping', new Date(Date.now() - 90000).toISOString());
      if (data) { setActiveSessions(data); setStats(s => ({ ...s, activeNow: data.length })); }
    }, 30000);
    return () => clearInterval(interval);
  }, [authenticated]);

  const addApp = async () => {
    if (!newApp.name.trim() || !newApp.url.trim()) { alert('App name and URL are required!'); return; }
    const { data, error } = await supabaseAdmin.from('apps').insert([{
      ...newApp, rating: parseFloat(newApp.rating), status: 'active'
    }]).select();
    if (!error && data) {
      setApps(prev => [data[0], ...prev]);
      setShowAddApp(false);
      setNewApp({ name: '', icon: '📱', category: 'Tools', rating: 4.5, downloads: '0', description: '', full_description: '', url: '', version: '1.0.0', size: '—', developer: 'Never Hide Tech Empire', featured: false });
      alert(`✅ "${newApp.name}" added to the store!`);
    } else { alert('Error: ' + error?.message); }
  };

  const deleteApp = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from the store?`)) return;
    const { error } = await supabaseAdmin.from('apps').delete().eq('id', id);
    if (!error) setApps(prev => prev.filter(a => a.id !== id));
  };

  const toggleFeatured = async (id, current) => {
    await supabaseAdmin.from('apps').update({ featured: !current }).eq('id', id);
    setApps(prev => prev.map(a => a.id === id ? { ...a, featured: !current } : a));
  };

  const toggleAppStatus = async (id, current) => {
    const next = current === 'active' ? 'suspended' : 'active';
    await supabaseAdmin.from('apps').update({ status: next }).eq('id', id);
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: next } : a));
  };

  const postAnnouncement = async () => {
    if (!announcement.trim()) return;
    const { data, error } = await supabaseAdmin.from('announcements').insert([{ message: announcement, active: true }]).select();
    if (!error && data) { setAnnouncements(prev => [data[0], ...prev]); setAnnouncement(''); }
  };

  const deleteAnnouncement = async (id) => {
    await supabaseAdmin.from('announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const banUser = async (userId, email) => {
    if (!window.confirm(`Ban user ${email}? They will lose access.`)) return;
    await supabaseAdmin.from('banned_users').upsert([{ user_id: userId, email, reason: 'Banned by admin' }]);
    await supabaseAdmin.from('profiles').update({ banned: true }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: true } : u));
  };

  const unbanUser = async (userId) => {
    await supabaseAdmin.from('banned_users').delete().eq('user_id', userId);
    await supabaseAdmin.from('profiles').update({ banned: false }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: false } : u));
  };

  const grantPublisher = async (userId, email, limit = 5) => {
    await supabaseAdmin.from('profiles').upsert({
      id: userId, email, is_publisher: true, publisher_limit: limit
    });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_publisher: true, publisher_limit: limit } : u));
    alert(`✅ Publisher access granted to ${email} (limit: ${limit} apps)`);
  };

  const revokePublisher = async (userId) => {
    await supabaseAdmin.from('profiles').update({ is_publisher: false }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_publisher: false } : u));
  };

  const reviewPubRequest = async (req, action) => {
    const note = action === 'rejected' ? window.prompt('Reason for rejection (optional):') : null;
    const updates = {
      status: action,
      reviewed_at: new Date().toISOString(),
      ...(note ? { admin_note: note } : {})
    };
    await supabaseAdmin.from('publisher_requests').update(updates).eq('id', req.id);

    if (action === 'approved') {
      // Auto-add app to store
      await supabaseAdmin.from('apps').insert([{
        name: req.app_name,
        icon: req.app_icon || '📱',
        category: req.category || 'Tools',
        description: req.description || '',
        url: req.app_url || '#',
        rating: 4.0, downloads: '0',
        developer: req.email,
        publisher_id: req.user_id,
        status: 'active', featured: false
      }]);
      // Grant publisher role if not already
      await supabaseAdmin.from('profiles').upsert({
        id: req.user_id, email: req.email, is_publisher: true, publisher_limit: 5
      });
      alert(`✅ Approved! App "${req.app_name}" is now live.`);
    } else {
      alert(`❌ Request rejected.`);
    }

    setPubRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: action } : r));
    setStats(s => ({ ...s, pendingRequests: Math.max(0, s.pendingRequests - 1) }));
  };

  const deletePost = async (id) => {
    await supabaseAdmin.from('community_posts').delete().eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  // ---- LOGIN SCREEN ----
  if (!authenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#1a1a2e', border: '2px solid #7c3aed', borderRadius: 20, padding: 32, width: '100%', maxWidth: 360, textAlign: 'center' }}>
          <div style={{ fontSize: 60 }}>👑</div>
          <h2 style={{ color: '#fff', margin: '12px 0 4px', fontSize: 22 }}>Admin Portal</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 24 }}>Never Hide Tech Empire · Owner Only</p>
          <input
            type="password"
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #7c3aed55', borderRadius: 10, padding: '13px 14px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, outline: 'none', marginBottom: 8, fontFamily: 'inherit' }}
            placeholder="Enter admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            autoFocus
          />
          {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '4px 0 8px' }}>⚠️ {error}</p>}
          <button style={{ width: '100%', marginTop: 8, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }} onClick={login}>
            🔐 Enter Portal
          </button>
          <button style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }} onClick={() => navigate('/')}>
            ← Back to Store
          </button>
        </div>
      </div>
    );
  }

  // ---- STYLES ----
  const bg = '#0d0d1a';
  const card = '#1a1a2e';
  const accent = '#7c3aed';
  const txt = '#ffffff';
  const sub = 'rgba(255,255,255,0.55)';
  const border = 'rgba(124,58,237,0.25)';
  const inp = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`, borderRadius: 10, padding: '10px 12px', color: txt, fontSize: 13, outline: 'none', marginBottom: 8, fontFamily: 'inherit' };
  const btn = (col = accent) => ({ border: 'none', borderRadius: 9, padding: '8px 14px', background: col, color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer', minHeight: 36 });

  const tabs = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'apps', icon: '📱', label: 'Apps' },
    { id: 'users', icon: '👥', label: 'Users' },
    { id: 'publishers', icon: '🏢', label: 'Publishers' },
    { id: 'sessions', icon: '🟢', label: 'Live' },
    { id: 'announce', icon: '📢', label: 'Announce' },
    { id: 'posts', icon: '💬', label: 'Posts' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: bg, color: txt, paddingBottom: 40 }}>
      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>👑</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Admin Portal</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
              {stats.activeNow > 0 && <span style={{ color: '#4ade80' }}>● {stats.activeNow} online · </span>}
              Never Hide Tech Empire
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadAll} style={btn('rgba(255,255,255,0.2)')}>🔄</button>
          <button onClick={() => navigate('/')} style={btn('rgba(255,255,255,0.2)')}>← Store</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, padding: '10px 12px', overflowX: 'auto', scrollbarWidth: 'none', background: card, borderBottom: `1px solid ${border}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            border: 'none', borderRadius: 10, padding: '7px 12px', whiteSpace: 'nowrap', flexShrink: 0,
            background: activeTab === t.id ? accent : 'rgba(255,255,255,0.06)',
            color: activeTab === t.id ? '#fff' : sub,
            fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
          }}>
            {t.icon} {t.label}
            {t.id === 'publishers' && stats.pendingRequests > 0 && (
              <span style={{ background: '#ef4444', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{stats.pendingRequests}</span>
            )}
            {t.id === 'sessions' && stats.activeNow > 0 && (
              <span style={{ background: '#4ade80', borderRadius: '50%', width: 18, height: 18, fontSize: 10, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{stats.activeNow}</span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 20, color: sub }}>⏳ Loading data...</div>
      )}

      <div style={{ padding: '12px' }}>

        {/* ====== DASHBOARD ====== */}
        {activeTab === 'dashboard' && (
          <div>
            <h3 style={{ marginBottom: 14, fontSize: 16 }}>📊 Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { icon: '👥', val: stats.totalUsers, label: 'Total Users' },
                { icon: '🟢', val: stats.activeNow, label: 'Active Now', green: true },
                { icon: '📱', val: stats.totalApps, label: 'Published Apps' },
                { icon: '⬇️', val: stats.totalInstalls, label: 'Total Installs' },
                { icon: '🏢', val: stats.pendingRequests, label: 'Pending Requests', red: stats.pendingRequests > 0 },
                { icon: '📢', val: announcements.length, label: 'Announcements' },
              ].map(s => (
                <div key={s.label} style={{ background: card, borderRadius: 14, padding: '14px 12px', border: `1px solid ${border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: s.green ? '#4ade80' : s.red ? '#ef4444' : accent }}>{s.val}</div>
                  <div style={{ color: sub, fontSize: 11, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent Publisher Requests */}
            {pubRequests.filter(r => r.status === 'pending').length > 0 && (
              <div style={{ background: card, borderRadius: 14, padding: 14, border: `1px solid #ef444444`, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 10, color: '#fbbf24' }}>⚠️ Pending Publisher Requests</div>
                {pubRequests.filter(r => r.status === 'pending').slice(0, 3).map(r => (
                  <div key={r.id} style={{ padding: '10px 0', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.app_name}</div>
                      <div style={{ color: sub, fontSize: 11 }}>{r.email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => reviewPubRequest(r, 'approved')} style={btn('#22c55e')}>✅</button>
                      <button onClick={() => reviewPubRequest(r, 'rejected')} style={btn('#ef4444')}>❌</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Apps */}
            <div style={{ background: card, borderRadius: 14, padding: 14, border: `1px solid ${border}` }}>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>📱 Recent Apps</div>
              {apps.slice(0, 5).map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${border}` }}>
                  <span style={{ fontSize: 22 }}>{a.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div>
                    <div style={{ color: sub, fontSize: 11 }}>{a.category} · ⬇️ {a.install_count || 0}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: a.status === 'active' ? '#22c55e22' : '#ef444422', color: a.status === 'active' ? '#4ade80' : '#ef4444' }}>
                    {a.status || 'active'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====== APPS ====== */}
        {activeTab === 'apps' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16 }}>📱 Manage Apps ({apps.length})</h3>
              <button onClick={() => setShowAddApp(!showAddApp)} style={btn()}>
                {showAddApp ? '✕ Cancel' : '➕ Add App'}
              </button>
            </div>

            {showAddApp && (
              <div style={{ background: card, borderRadius: 14, padding: 16, border: `1px solid ${accent}55`, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 12, color: accent }}>➕ Add New App</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input style={{ ...inp, marginBottom: 0 }} placeholder="App name *" value={newApp.name} onChange={e => setNewApp(p => ({ ...p, name: e.target.value }))} />
                  <input style={{ ...inp, marginBottom: 0 }} placeholder="Icon emoji (📱)" value={newApp.icon} onChange={e => setNewApp(p => ({ ...p, icon: e.target.value }))} />
                </div>
                <div style={{ marginTop: 8 }}>
                  <input style={inp} placeholder="App URL * (https://...)" value={newApp.url} onChange={e => setNewApp(p => ({ ...p, url: e.target.value }))} />
                  <select style={{ ...inp }} value={newApp.category} onChange={e => setNewApp(p => ({ ...p, category: e.target.value }))}>
                    {['Islamic', 'Tools', 'AI', 'Games', 'Business', 'Education', 'Social', 'Entertainment'].map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input style={inp} placeholder="Short description *" value={newApp.description} onChange={e => setNewApp(p => ({ ...p, description: e.target.value }))} />
                  <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} placeholder="Full description (optional)" value={newApp.full_description} onChange={e => setNewApp(p => ({ ...p, full_description: e.target.value }))} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <input style={{ ...inp, marginBottom: 0 }} placeholder="Rating (4.5)" value={newApp.rating} onChange={e => setNewApp(p => ({ ...p, rating: e.target.value }))} />
                    <input style={{ ...inp, marginBottom: 0 }} placeholder="Downloads (50K+)" value={newApp.downloads} onChange={e => setNewApp(p => ({ ...p, downloads: e.target.value }))} />
                    <input style={{ ...inp, marginBottom: 0 }} placeholder="Version (1.0.0)" value={newApp.version} onChange={e => setNewApp(p => ({ ...p, version: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0' }}>
                    <input type="checkbox" id="featured" checked={newApp.featured} onChange={e => setNewApp(p => ({ ...p, featured: e.target.checked }))} />
                    <label htmlFor="featured" style={{ color: sub, fontSize: 13, cursor: 'pointer' }}>⭐ Mark as Featured</label>
                  </div>
                </div>
                <button onClick={addApp} style={{ ...btn(), width: '100%', padding: 12, fontSize: 14 }}>✅ Publish App to Store</button>
              </div>
            )}

            {apps.map(a => (
              <div key={a.id} style={{ background: card, borderRadius: 14, padding: 14, border: `1px solid ${border}`, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 30 }}>{a.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                    <div style={{ color: sub, fontSize: 12 }}>{a.category} · ★ {a.rating} · ⬇️ {a.install_count || 0} installs</div>
                    <div style={{ color: sub, fontSize: 11, marginTop: 2, wordBreak: 'break-all' }}>{a.url}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: a.status === 'active' ? '#22c55e22' : '#ef444422', color: a.status === 'active' ? '#4ade80' : '#ef4444', flexShrink: 0 }}>
                    {a.status || 'active'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => toggleFeatured(a.id, a.featured)} style={btn(a.featured ? '#f59e0b' : 'rgba(255,255,255,0.1)')}>
                    {a.featured ? '⭐ Featured' : '☆ Feature'}
                  </button>
                  <button onClick={() => toggleAppStatus(a.id, a.status || 'active')} style={btn(a.status === 'active' ? '#f59e0b' : '#22c55e')}>
                    {a.status === 'active' ? '⏸ Suspend' : '▶️ Activate'}
                  </button>
                  <button onClick={() => deleteApp(a.id, a.name)} style={btn('#ef4444')}>🗑 Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ====== USERS ====== */}
        {activeTab === 'users' && (
          <div>
            <h3 style={{ marginBottom: 14, fontSize: 16 }}>👥 Users ({users.length})</h3>
            {users.length === 0 && <p style={{ color: sub }}>No registered users yet.</p>}
            {users.map(u => {
              const profileData = u;
              const isBanned = u.banned;
              const isPub = u.is_publisher;
              const lastSeen = u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : 'Never';
              return (
                <div key={u.id} style={{ background: card, borderRadius: 14, padding: 14, border: `1px solid ${isBanned ? '#ef444433' : border}`, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 30 }}>👤</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{u.user_metadata?.full_name || 'User'}</div>
                      <div style={{ color: sub, fontSize: 11 }}>{u.email}</div>
                      <div style={{ color: sub, fontSize: 10 }}>Last seen: {lastSeen}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-end' }}>
                      {isBanned && <span style={{ fontSize: 10, background: '#ef444422', color: '#ef4444', padding: '2px 8px', borderRadius: 20 }}>BANNED</span>}
                      {isPub && <span style={{ fontSize: 10, background: accent + '22', color: accent, padding: '2px 8px', borderRadius: 20 }}>PUBLISHER</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {isBanned
                      ? <button onClick={() => unbanUser(u.id)} style={btn('#22c55e')}>✅ Unban</button>
                      : <button onClick={() => banUser(u.id, u.email)} style={btn('#ef4444')}>🚫 Ban</button>
                    }
                    {isPub
                      ? <button onClick={() => revokePublisher(u.id)} style={btn('#f59e0b')}>🔒 Revoke Publisher</button>
                      : <button onClick={() => grantPublisher(u.id, u.email)} style={btn(accent)}>🏢 Grant Publisher</button>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ====== PUBLISHERS ====== */}
        {activeTab === 'publishers' && (
          <div>
            <h3 style={{ marginBottom: 14, fontSize: 16 }}>🏢 Publisher Requests</h3>
            {pubRequests.length === 0 && <p style={{ color: sub }}>No publisher requests yet.</p>}
            {pubRequests.map(r => (
              <div key={r.id} style={{
                background: card, borderRadius: 14, padding: 14,
                border: `1px solid ${r.status === 'pending' ? '#fbbf2444' : r.status === 'approved' ? '#22c55e44' : '#ef444444'}`,
                marginBottom: 10
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.app_icon || '📱'} {r.app_name}</div>
                    <div style={{ color: sub, fontSize: 12 }}>by {r.email}</div>
                    <div style={{ color: sub, fontSize: 11, marginTop: 4 }}>{r.description}</div>
                    {r.app_url && <div style={{ color: accent, fontSize: 11, wordBreak: 'break-all', marginTop: 4 }}>{r.app_url}</div>}
                    {r.payment_ref && <div style={{ color: '#fbbf24', fontSize: 11, marginTop: 4 }}>💳 Payment: {r.payment_ref}</div>}
                    <div style={{ color: sub, fontSize: 10, marginTop: 4 }}>{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                  <span style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 20, flexShrink: 0,
                    background: r.status === 'pending' ? '#fbbf2422' : r.status === 'approved' ? '#22c55e22' : '#ef444422',
                    color: r.status === 'pending' ? '#fbbf24' : r.status === 'approved' ? '#4ade80' : '#ef4444'
                  }}>{r.status.toUpperCase()}</span>
                </div>
                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => reviewPubRequest(r, 'approved')} style={{ ...btn('#22c55e'), flex: 1 }}>✅ Approve & Publish</button>
                    <button onClick={() => reviewPubRequest(r, 'rejected')} style={{ ...btn('#ef4444'), flex: 1 }}>❌ Reject</button>
                  </div>
                )}
                {r.admin_note && <div style={{ marginTop: 8, color: sub, fontSize: 12 }}>Note: {r.admin_note}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ====== LIVE SESSIONS ====== */}
        {activeTab === 'sessions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16 }}>🟢 Active Users ({activeSessions.length})</h3>
              <button onClick={() => {
                supabaseAdmin.from('active_sessions').select('*')
                  .gte('last_ping', new Date(Date.now() - 90000).toISOString())
                  .then(({ data }) => { if (data) setActiveSessions(data); });
              }} style={btn()}>🔄 Refresh</button>
            </div>
            {activeSessions.length === 0 ? (
              <div style={{ background: card, borderRadius: 14, padding: 24, textAlign: 'center', color: sub }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>💤</div>
                <div>No active users right now</div>
              </div>
            ) : (
              activeSessions.map(s => {
                const ping = new Date(s.last_ping);
                const secsAgo = Math.floor((Date.now() - ping) / 1000);
                return (
                  <div key={s.id} style={{ background: card, borderRadius: 14, padding: 14, border: `1px solid #22c55e44`, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: secsAgo < 40 ? '#4ade80' : '#fbbf24', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.user_id ? `User ${s.user_id.slice(0,8)}...` : 'Guest'}</div>
                      <div style={{ color: sub, fontSize: 11 }}>Page: {s.page || '/'}</div>
                    </div>
                    <div style={{ color: sub, fontSize: 11, textAlign: 'right' }}>
                      {secsAgo < 60 ? `${secsAgo}s ago` : `${Math.floor(secsAgo/60)}m ago`}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ====== ANNOUNCEMENTS ====== */}
        {activeTab === 'announce' && (
          <div>
            <h3 style={{ marginBottom: 14, fontSize: 16 }}>📢 Announcements</h3>
            <div style={{ background: card, borderRadius: 14, padding: 14, border: `1px solid ${border}`, marginBottom: 14 }}>
              <textarea
                style={{ ...inp, minHeight: 80, resize: 'vertical', marginBottom: 10 }}
                placeholder="Write an announcement to all users..."
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
              />
              <button onClick={postAnnouncement} style={{ ...btn(), width: '100%', padding: 12, fontSize: 14 }}>📢 Post Announcement</button>
            </div>
            {announcements.map(a => (
              <div key={a.id} style={{ background: card, borderRadius: 12, padding: 14, border: `1px solid ${border}`, marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>{a.message}</div>
                  <div style={{ color: sub, fontSize: 11, marginTop: 4 }}>{new Date(a.created_at).toLocaleDateString()}</div>
                </div>
                <button onClick={() => deleteAnnouncement(a.id)} style={btn('#ef4444')}>🗑</button>
              </div>
            ))}
          </div>
        )}

        {/* ====== POSTS ====== */}
        {activeTab === 'posts' && (
          <div>
            <h3 style={{ marginBottom: 14, fontSize: 16 }}>💬 Community Posts ({posts.length})</h3>
            {posts.length === 0 && <p style={{ color: sub }}>No community posts yet.</p>}
            {posts.map(p => (
              <div key={p.id} style={{ background: card, borderRadius: 12, padding: 14, border: `1px solid ${border}`, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.user_name || 'Anonymous'}</div>
                    <div style={{ color: sub, fontSize: 11, marginBottom: 6 }}>{new Date(p.created_at).toLocaleDateString()}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.5 }}>{p.content || p.message}</div>
                  </div>
                  <button onClick={() => deletePost(p.id)} style={btn('#ef4444')}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
