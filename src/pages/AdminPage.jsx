import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { supabaseAdmin, isSupabaseReady } from '../lib/supabase';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'neverhide2024';

// ---- STYLE CONSTANTS ----
const BG = '#0d0d1a';
const CARD = '#161625';
const ACCENT = '#7c3aed';
const TXT = '#ffffff';
const SUB = 'rgba(255,255,255,0.5)';
const BORDER = 'rgba(124,58,237,0.2)';

const inp = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${BORDER}`,
  borderRadius: 10,
  padding: '11px 13px',
  color: TXT,
  fontSize: 13,
  outline: 'none',
  marginBottom: 8,
  fontFamily: 'inherit',
  display: 'block',
};

const pill = (bg = ACCENT, color = '#fff') => ({
  border: 'none',
  borderRadius: 20,
  padding: '7px 14px',
  background: bg,
  color,
  fontWeight: 600,
  fontSize: 12,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
  minHeight: 34,
  lineHeight: 1,
});

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
  const [loginLogs, setLoginLogs] = useState([]);
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
    if (password === ADMIN_PASSWORD) { setAuthenticated(true); setError(''); loadAll(); }
    else setError('Wrong password. Access denied.');
  };

  const loadAll = async () => {
    if (!isSupabaseReady || !supabaseAdmin) return;
    setLoading(true);
    try {
      const [appsRes, annoRes, postsRes, pubReqRes, sessionsRes, logsRes] = await Promise.all([
        supabaseAdmin.from('apps').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('announcements').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('community_posts').select('*').order('created_at', { ascending: false }).limit(50),
        supabaseAdmin.from('publisher_requests').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('active_sessions').select('*').gte('last_ping', new Date(Date.now() - 90000).toISOString()),
        supabaseAdmin.from('login_logs').select('*').order('logged_in_at', { ascending: false }).limit(100),
      ]);
      if (appsRes.data) setApps(appsRes.data);
      if (annoRes.data) setAnnouncements(annoRes.data);
      if (postsRes.data) setPosts(postsRes.data);
      if (pubReqRes.data) setPubRequests(pubReqRes.data);
      if (sessionsRes.data) setActiveSessions(sessionsRes.data);
      if (logsRes.data) setLoginLogs(logsRes.data);
      let authUsers = [];
      try {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (usersData?.users) {
          authUsers = usersData.users;
          // Merge phone numbers from profiles table
          const { data: profiles } = await supabaseAdmin.from('profiles').select('id, phone, banned, is_publisher');
          if (profiles) {
            const profileMap = {};
            profiles.forEach(p => { profileMap[p.id] = p; });
            authUsers = authUsers.map(u => ({ ...u, phone: profileMap[u.id]?.phone || null, banned: profileMap[u.id]?.banned || false, is_publisher: profileMap[u.id]?.is_publisher || false }));
          }
          setUsers(authUsers);
        }
      } catch (e) { console.warn('Could not load auth users:', e); }
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

  useEffect(() => {
    if (!authenticated) return;
    const iv = setInterval(async () => {
      if (!supabaseAdmin) return;
      const { data } = await supabaseAdmin.from('active_sessions').select('*').gte('last_ping', new Date(Date.now() - 90000).toISOString());
      if (data) { setActiveSessions(data); setStats(s => ({ ...s, activeNow: data.length })); }
    }, 30000);
    return () => clearInterval(iv);
  }, [authenticated]);

  const addApp = async () => {
    if (!newApp.name.trim() || !newApp.url.trim()) { alert('App name and URL are required!'); return; }
    const { data, error } = await supabaseAdmin.from('apps').insert([{ ...newApp, rating: parseFloat(newApp.rating), status: 'active' }]).select();
    if (!error && data) {
      setApps(prev => [data[0], ...prev]);
      setShowAddApp(false);
      setNewApp({ name: '', icon: '📱', category: 'Tools', rating: 4.5, downloads: '0', description: '', full_description: '', url: '', version: '1.0.0', size: '—', developer: 'Never Hide Tech Empire', featured: false });
      alert(`✅ "${newApp.name}" added successfully!`);
    } else alert('Error: ' + error?.message);
  };

  const deleteApp = async (id, name) => {
    if (!window.confirm(`Remove "${name}"?`)) return;
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
    if (!window.confirm(`Ban user ${email}?`)) return;
    await supabaseAdmin.from('banned_users').upsert([{ user_id: userId, email, reason: 'Banned by admin' }]);
    await supabaseAdmin.from('profiles').update({ banned: true }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: true } : u));
  };

  const unbanUser = async (userId) => {
    await supabaseAdmin.from('banned_users').delete().eq('user_id', userId);
    await supabaseAdmin.from('profiles').update({ banned: false }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: false } : u));
  };

  const grantPublisher = async (userId, email) => {
    await supabaseAdmin.from('profiles').upsert({ id: userId, email, is_publisher: true, publisher_limit: 5 });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_publisher: true } : u));
    alert(`✅ Publisher access granted to ${email}`);
  };

  const revokePublisher = async (userId) => {
    await supabaseAdmin.from('profiles').update({ is_publisher: false }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_publisher: false } : u));
  };

  const reviewPubRequest = async (req, action) => {
    const note = action === 'rejected' ? window.prompt('Reason (optional):') : null;
    await supabaseAdmin.from('publisher_requests').update({ status: action, reviewed_at: new Date().toISOString(), ...(note ? { admin_note: note } : {}) }).eq('id', req.id);
    if (action === 'approved') {
      await supabaseAdmin.from('apps').insert([{ name: req.app_name, icon: req.app_icon || '📱', category: req.category || 'Tools', description: req.description || '', url: req.app_url || '#', rating: 4.0, downloads: '0', developer: req.email, publisher_id: req.user_id, status: 'active', featured: false }]);
      await supabaseAdmin.from('profiles').upsert({ id: req.user_id, email: req.email, is_publisher: true, publisher_limit: 5 });
      alert(`✅ Approved! "${req.app_name}" is now live.`);
    } else alert('❌ Request rejected.');
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
      <div style={{
        position: 'fixed', inset: 0, background: BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, overflowY: 'auto',
      }}>
        <div style={{ background: CARD, border: `2px solid ${ACCENT}55`, borderRadius: 24, padding: 32, width: '100%', maxWidth: 340, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>👑</div>
          <h2 style={{ color: TXT, fontSize: 22, margin: '0 0 4px' }}>Admin Portal</h2>
          <p style={{ color: SUB, fontSize: 13, margin: '0 0 24px' }}>Never Hide Tech Empire · Owner Only</p>
          <input
            type="password"
            style={{ ...inp, marginBottom: 6, fontSize: 15, padding: '13px 14px' }}
            placeholder="Enter admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            autoFocus
          />
          {error && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 8px' }}>⚠️ {error}</p>}
          <button style={{ ...pill(ACCENT), width: '100%', padding: '13px 0', fontSize: 15, borderRadius: 12, marginTop: 8 }} onClick={login}>
            🔐 Enter Portal
          </button>
          <button style={{ background: 'none', border: 'none', color: SUB, fontSize: 13, cursor: 'pointer', marginTop: 12, padding: 8, fontFamily: 'inherit' }} onClick={() => navigate('/')}>
            ← Back to Store
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'apps', icon: '📱', label: 'Apps' },
    { id: 'users', icon: '👥', label: 'Users' },
    { id: 'publishers', icon: '🏢', label: 'Publishers' },
    { id: 'logins', icon: '🔐', label: 'Logins' },
    { id: 'sessions', icon: '🟢', label: 'Live' },
    { id: 'announce', icon: '📢', label: 'Announce' },
    { id: 'posts', icon: '💬', label: 'Posts' },
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: BG,
      color: TXT,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* ---- STICKY HEADER ---- */}
      <div style={{
        background: `linear-gradient(135deg, #7c3aed, #4f46e5)`,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        zIndex: 200,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>👑</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Admin Portal</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10 }}>
              {stats.activeNow > 0 && <span style={{ color: '#4ade80' }}>● {stats.activeNow} online · </span>}
              Never Hide Tech Empire
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={loadAll} style={pill('rgba(255,255,255,0.2)')}>🔄</button>
          <button onClick={() => navigate('/')} style={pill('rgba(255,255,255,0.15)')}>← Store</button>
        </div>
      </div>

      {/* ---- SCROLLABLE TAB BAR ---- */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '10px 12px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        background: CARD,
        borderBottom: `1px solid ${BORDER}`,
        flexShrink: 0,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            ...pill(activeTab === t.id ? ACCENT : 'rgba(255,255,255,0.07)', activeTab === t.id ? '#fff' : SUB),
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            borderRadius: 20,
          }}>
            {t.icon} {t.label}
            {t.id === 'publishers' && stats.pendingRequests > 0 && (
              <span style={{ background: '#ef4444', borderRadius: '50%', width: 17, height: 17, fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{stats.pendingRequests}</span>
            )}
            {t.id === 'sessions' && stats.activeNow > 0 && (
              <span style={{ background: '#4ade80', borderRadius: '50%', width: 17, height: 17, fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>{stats.activeNow}</span>
            )}
            {t.id === 'logins' && loginLogs.length > 0 && (
              <span style={{ background: '#7c3aed', borderRadius: '50%', width: 17, height: 17, fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{Math.min(loginLogs.length, 99)}</span>
            )}
          </button>
        ))}
      </div>

      {/* ---- MAIN SCROLLABLE CONTENT ---- */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        padding: '14px 14px 40px',
      }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 30, color: SUB }}>⏳ Loading data...</div>
        )}

        {/* ======= DASHBOARD ======= */}
        {activeTab === 'dashboard' && (
          <div>
            <p style={{ color: SUB, fontSize: 13, marginBottom: 14 }}>Overview of your store</p>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              {[
                { icon: '👥', val: stats.totalUsers, label: 'Total Users' },
                { icon: '🟢', val: stats.activeNow, label: 'Active Now', green: true },
                { icon: '📱', val: stats.totalApps, label: 'Published Apps' },
                { icon: '⬇️', val: stats.totalInstalls, label: 'Total Installs' },
                { icon: '🏢', val: stats.pendingRequests, label: 'Pending', red: stats.pendingRequests > 0 },
                { icon: '🔐', val: loginLogs.length, label: 'Login Records' },
              ].map(s => (
                <div key={s.label} style={{ background: CARD, borderRadius: 16, padding: '16px 12px', border: `1px solid ${BORDER}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.green ? '#4ade80' : s.red ? '#ef4444' : ACCENT }}>{s.val}</div>
                  <div style={{ color: SUB, fontSize: 11, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Pending requests alert */}
            {pubRequests.filter(r => r.status === 'pending').length > 0 && (
              <div style={{ background: '#fbbf2408', border: '1px solid #fbbf2444', borderRadius: 16, padding: 14, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: 10, fontSize: 14 }}>⚠️ Pending Publisher Requests</div>
                {pubRequests.filter(r => r.status === 'pending').slice(0, 3).map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${BORDER}`, gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.app_name}</div>
                      <div style={{ color: SUB, fontSize: 11 }}>{r.email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => reviewPubRequest(r, 'approved')} style={pill('#22c55e')}>✅</button>
                      <button onClick={() => reviewPubRequest(r, 'rejected')} style={pill('#ef4444')}>❌</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent login activity */}
            {loginLogs.length > 0 && (
              <div style={{ background: CARD, borderRadius: 16, padding: 14, border: `1px solid ${BORDER}`, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>🔐 Recent Sign-Ins</div>
                {loginLogs.slice(0, 5).map((log, i) => (
                  <div key={log.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>👤</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.email}</div>
                      <div style={{ color: SUB, fontSize: 11 }}>{log.city || '?'}, {log.country || '?'} · {log.device_type || '?'}</div>
                    </div>
                    <div style={{ color: SUB, fontSize: 10, flexShrink: 0 }}>{new Date(log.logged_in_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Apps */}
            <div style={{ background: CARD, borderRadius: 16, padding: 14, border: `1px solid ${BORDER}` }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>📱 Recent Apps</div>
              {apps.slice(0, 6).map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{a.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                    <div style={{ color: SUB, fontSize: 11 }}>{a.category} · ⬇️ {a.install_count || 0}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: a.status === 'active' ? '#22c55e22' : '#ef444422', color: a.status === 'active' ? '#4ade80' : '#ef4444', flexShrink: 0 }}>
                    {a.status || 'active'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======= APPS ======= */}
        {activeTab === 'apps' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ color: SUB, fontSize: 13 }}>{apps.length} apps in store</p>
              <button onClick={() => setShowAddApp(!showAddApp)} style={pill(showAddApp ? '#ef4444' : ACCENT)}>
                {showAddApp ? '✕ Cancel' : '➕ Add App'}
              </button>
            </div>

            {showAddApp && (
              <div style={{ background: CARD, borderRadius: 16, padding: 16, border: `1px solid ${ACCENT}55`, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: ACCENT, marginBottom: 12, fontSize: 14 }}>➕ Add New App</div>
                <input style={inp} placeholder="App name *" value={newApp.name} onChange={e => setNewApp(p => ({ ...p, name: e.target.value }))} />
                <input style={inp} placeholder="App URL (https://...) *" value={newApp.url} onChange={e => setNewApp(p => ({ ...p, url: e.target.value }))} />
                <input style={inp} placeholder="Icon emoji (e.g. 🎮)" value={newApp.icon} onChange={e => setNewApp(p => ({ ...p, icon: e.target.value }))} />
                <input style={inp} placeholder="Short description" value={newApp.description} onChange={e => setNewApp(p => ({ ...p, description: e.target.value }))} />
                <textarea style={{ ...inp, minHeight: 70, resize: 'none' }} placeholder="Full description" value={newApp.full_description} onChange={e => setNewApp(p => ({ ...p, full_description: e.target.value }))} />
                <select style={inp} value={newApp.category} onChange={e => setNewApp(p => ({ ...p, category: e.target.value }))}>
                  {['Tools', 'Islamic', 'AI', 'Business', 'Games', 'Education', 'Health', 'Social'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <input style={{ ...inp, marginBottom: 0 }} type="number" min="1" max="5" step="0.1" placeholder="Rating (1–5)" value={newApp.rating} onChange={e => setNewApp(p => ({ ...p, rating: e.target.value }))} />
                  <input style={{ ...inp, marginBottom: 0 }} placeholder="Downloads (e.g. 10K+)" value={newApp.downloads} onChange={e => setNewApp(p => ({ ...p, downloads: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <input style={{ ...inp, marginBottom: 0 }} placeholder="Version (e.g. 2.1.0)" value={newApp.version} onChange={e => setNewApp(p => ({ ...p, version: e.target.value }))} />
                  <input style={{ ...inp, marginBottom: 0 }} placeholder="Size (e.g. 15MB)" value={newApp.size} onChange={e => setNewApp(p => ({ ...p, size: e.target.value }))} />
                </div>
                <input style={inp} placeholder="Developer name" value={newApp.developer} onChange={e => setNewApp(p => ({ ...p, developer: e.target.value }))} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <input type="checkbox" id="feat" checked={newApp.featured} onChange={e => setNewApp(p => ({ ...p, featured: e.target.checked }))} style={{ width: 18, height: 18 }} />
                  <label htmlFor="feat" style={{ color: TXT, fontSize: 13, cursor: 'pointer' }}>⭐ Mark as Featured</label>
                </div>
                <button onClick={addApp} style={{ ...pill(ACCENT), width: '100%', padding: '12px 0', fontSize: 14, borderRadius: 12 }}>
                  ✅ Publish App
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {apps.map(a => (
                <div key={a.id} style={{ background: CARD, borderRadius: 14, padding: 14, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{a.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                    <div style={{ color: SUB, fontSize: 11, marginTop: 2 }}>{a.category} · ⭐ {a.rating} · ⬇️ {a.install_count || 0}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => toggleFeatured(a.id, a.featured)} style={pill(a.featured ? '#f59e0b' : 'rgba(255,255,255,0.1)', a.featured ? '#000' : SUB)}>
                        {a.featured ? '⭐ Featured' : '☆ Feature'}
                      </button>
                      <button onClick={() => toggleAppStatus(a.id, a.status)} style={pill(a.status === 'active' ? '#fbbf24' : '#22c55e')}>
                        {a.status === 'active' ? '⏸ Suspend' : '▶️ Activate'}
                      </button>
                      <button onClick={() => deleteApp(a.id, a.name)} style={pill('#ef4444')}>🗑 Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======= USERS ======= */}
        {activeTab === 'users' && (
          <div>
            <p style={{ color: SUB, fontSize: 13, marginBottom: 14 }}>{users.length} registered users</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {users.map(u => (
                <div key={u.id} style={{
                  background: CARD, borderRadius: 14, padding: 14,
                  border: `1px solid ${u.banned ? '#ef444433' : BORDER}`,
                  opacity: u.banned ? 0.75 : 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.banned ? '#ef4444' : ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {u.user_metadata?.full_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.user_metadata?.full_name || 'No Name'}
                        {u.is_publisher && <span style={{ marginLeft: 6, fontSize: 10, background: '#7c3aed33', color: ACCENT, borderRadius: 8, padding: '2px 6px' }}>Publisher</span>}
                        {u.banned && <span style={{ marginLeft: 6, fontSize: 10, background: '#ef444433', color: '#ef4444', borderRadius: 8, padding: '2px 6px' }}>Banned</span>}
                      </div>
                      <div style={{ color: SUB, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                      {u.phone && (
                        <div style={{ color: '#4ade80', fontSize: 11, marginTop: 2 }}>📱 {u.phone}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {u.banned
                        ? <button onClick={() => unbanUser(u.id)} style={pill('#22c55e')}>✅ Unban</button>
                        : <button onClick={() => banUser(u.id, u.email)} style={pill('#ef4444')}>🚫 Ban</button>
                      }
                      {u.is_publisher
                        ? <button onClick={() => revokePublisher(u.id)} style={pill('#f59e0b')}>🔒 Revoke Publisher</button>
                        : <button onClick={() => grantPublisher(u.id, u.email)} style={pill(ACCENT)}>🏢 Grant Publisher</button>
                      }
                      {u.phone && (
                        <a href={`https://wa.me/${u.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                          style={{ ...pill('#25d366'), textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          💬 WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======= PUBLISHERS ======= */}
        {activeTab === 'publishers' && (
          <div>
            <p style={{ color: SUB, fontSize: 13, marginBottom: 14 }}>{pubRequests.length} total requests</p>
            {pubRequests.length === 0 && <div style={{ background: CARD, borderRadius: 16, padding: 32, textAlign: 'center', color: SUB }}><div style={{ fontSize: 48, marginBottom: 8 }}>🏢</div><div>No publisher requests yet.</div></div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pubRequests.map(r => (
                <div key={r.id} style={{
                  background: CARD, borderRadius: 16, padding: 14,
                  border: `1px solid ${r.status === 'pending' ? '#fbbf2444' : r.status === 'approved' ? '#22c55e44' : '#ef444444'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{r.app_icon || '📱'} {r.app_name}</div>
                      <div style={{ color: SUB, fontSize: 12 }}>by {r.email}</div>
                      {r.description && <div style={{ color: SUB, fontSize: 12, marginTop: 4 }}>{r.description}</div>}
                      {r.app_url && <div style={{ color: ACCENT, fontSize: 11, wordBreak: 'break-all', marginTop: 4 }}>{r.app_url}</div>}
                      {r.payment_ref && <div style={{ color: '#fbbf24', fontSize: 11, marginTop: 4 }}>💳 {r.payment_ref}</div>}
                      <div style={{ color: SUB, fontSize: 10, marginTop: 4 }}>{new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                    <span style={{
                      fontSize: 10, padding: '4px 10px', borderRadius: 20, flexShrink: 0,
                      background: r.status === 'pending' ? '#fbbf2422' : r.status === 'approved' ? '#22c55e22' : '#ef444422',
                      color: r.status === 'pending' ? '#fbbf24' : r.status === 'approved' ? '#4ade80' : '#ef4444'
                    }}>{r.status?.toUpperCase()}</span>
                  </div>
                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => reviewPubRequest(r, 'approved')} style={{ ...pill('#22c55e'), flex: 1, textAlign: 'center' }}>✅ Approve & Publish</button>
                      <button onClick={() => reviewPubRequest(r, 'rejected')} style={{ ...pill('#ef4444'), flex: 1, textAlign: 'center' }}>❌ Reject</button>
                    </div>
                  )}
                  {r.admin_note && <div style={{ marginTop: 8, color: SUB, fontSize: 12 }}>Note: {r.admin_note}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======= LOGIN LOGS ======= */}
        {activeTab === 'logins' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ color: SUB, fontSize: 13 }}>{loginLogs.length} sign-in records</p>
              <button onClick={async () => {
                const { data } = await supabaseAdmin.from('login_logs').select('*').order('logged_in_at', { ascending: false }).limit(100);
                if (data) setLoginLogs(data);
              }} style={pill()}>🔄 Refresh</button>
            </div>
            {loginLogs.length === 0 ? (
              <div style={{ background: CARD, borderRadius: 16, padding: 40, textAlign: 'center', color: SUB }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>🔐</div>
                <div>No sign-in records yet.</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>Records appear when users sign in to the store.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {loginLogs.map((log, i) => (
                  <div key={log.id || i} style={{ background: CARD, borderRadius: 14, padding: 14, border: `1px solid ${BORDER}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          👤 {log.full_name || 'Unknown User'}
                        </div>
                        <div style={{ color: ACCENT, fontSize: 12, marginTop: 2, wordBreak: 'break-all' }}>{log.email}</div>
                      </div>
                      <div style={{ color: SUB, fontSize: 10, flexShrink: 0, textAlign: 'right' }}>
                        {new Date(log.logged_in_at).toLocaleDateString()}<br />
                        {new Date(log.logged_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {log.phone && (
                        <a href={`https://wa.me/${log.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                          style={{ ...pill('#25d366'), textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                          📱 {log.phone}
                        </a>
                      )}
                      {log.country && (
                        <span style={{ ...pill('rgba(255,255,255,0.08)', SUB), fontSize: 11 }}>
                          📍 {log.city ? `${log.city}, ` : ''}{log.country}
                        </span>
                      )}
                      {log.ip_address && (
                        <span style={{ ...pill('rgba(255,255,255,0.05)', SUB), fontSize: 10 }}>
                          🌐 {log.ip_address}
                        </span>
                      )}
                      {log.device_type && (
                        <span style={{ ...pill('rgba(255,255,255,0.08)', SUB), fontSize: 11 }}>
                          {log.device_type === 'Mobile' ? '📱' : '🖥️'} {log.device_type}
                        </span>
                      )}
                      {log.browser && (
                        <span style={{ ...pill('rgba(255,255,255,0.05)', SUB), fontSize: 11 }}>
                          🌍 {log.browser}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======= LIVE SESSIONS ======= */}
        {activeTab === 'sessions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ color: SUB, fontSize: 13 }}>{activeSessions.length} users online now</p>
              <button onClick={async () => {
                const { data } = await supabaseAdmin.from('active_sessions').select('*').gte('last_ping', new Date(Date.now() - 90000).toISOString());
                if (data) setActiveSessions(data);
              }} style={pill()}>🔄 Refresh</button>
            </div>
            {activeSessions.length === 0 ? (
              <div style={{ background: CARD, borderRadius: 16, padding: 40, textAlign: 'center', color: SUB }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>💤</div>
                <div>No active users right now</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeSessions.map(s => {
                  const secsAgo = Math.floor((Date.now() - new Date(s.last_ping)) / 1000);
                  return (
                    <div key={s.id} style={{ background: CARD, borderRadius: 14, padding: 14, border: '1px solid #22c55e33', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: secsAgo < 40 ? '#4ade80' : '#fbbf24', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{s.user_id ? `User ${s.user_id.slice(0, 8)}…` : 'Guest'}</div>
                        <div style={{ color: SUB, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Page: {s.page || '/'}</div>
                      </div>
                      <div style={{ color: SUB, fontSize: 11, flexShrink: 0 }}>
                        {secsAgo < 60 ? `${secsAgo}s ago` : `${Math.floor(secsAgo / 60)}m ago`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======= ANNOUNCEMENTS ======= */}
        {activeTab === 'announce' && (
          <div>
            <p style={{ color: SUB, fontSize: 13, marginBottom: 14 }}>Broadcast a message to all users</p>
            <div style={{ background: CARD, borderRadius: 16, padding: 14, border: `1px solid ${BORDER}`, marginBottom: 16 }}>
              <textarea
                style={{ ...inp, minHeight: 90, resize: 'none', lineHeight: 1.5 }}
                placeholder="Write your announcement..."
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
              />
              <button onClick={postAnnouncement} disabled={!announcement.trim()} style={{
                ...pill(announcement.trim() ? ACCENT : 'rgba(255,255,255,0.1)', announcement.trim() ? '#fff' : SUB),
                width: '100%', padding: '12px 0', fontSize: 14, borderRadius: 12
              }}>
                📢 Post Announcement
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {announcements.map(a => (
                <div key={a.id} style={{ background: CARD, borderRadius: 14, padding: 14, border: `1px solid ${BORDER}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>{a.message}</div>
                    <div style={{ color: SUB, fontSize: 11, marginTop: 6 }}>{new Date(a.created_at).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => deleteAnnouncement(a.id)} style={{ ...pill('#ef4444'), flexShrink: 0 }}>🗑</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======= POSTS ======= */}
        {activeTab === 'posts' && (
          <div>
            <p style={{ color: SUB, fontSize: 13, marginBottom: 14 }}>{posts.length} community posts</p>
            {posts.length === 0 && <div style={{ background: CARD, borderRadius: 16, padding: 32, textAlign: 'center', color: SUB }}><div style={{ fontSize: 48, marginBottom: 8 }}>💬</div><div>No community posts yet.</div></div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {posts.map(p => (
                <div key={p.id} style={{ background: CARD, borderRadius: 14, padding: 14, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.user_name || 'Anonymous'}</div>
                    <div style={{ color: SUB, fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{p.question}</div>
                    <div style={{ color: SUB, fontSize: 11, marginTop: 6 }}>{new Date(p.created_at).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => deletePost(p.id)} style={{ ...pill('#ef4444'), flexShrink: 0 }}>🗑</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
