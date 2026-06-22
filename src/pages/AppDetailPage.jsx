import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabase';

function getCategoryColor(cat) {
  const map = { 'Islamic': '#2ecc71', 'AI': '#9b59b6', 'Games': '#e74c3c', 'Tools': '#3498db', 'Business': '#f39c12', 'Education': '#1abc9c', 'Social': '#e91e63', 'Entertainment': '#ff5722', 'Chat': '#00b894' };
  return map[cat] || '#3498db';
}

export default function AppDetailPage() {
  const { id } = useParams();
  const { apps, loadingApps, installedApps, installApp, uninstallApp } = useAppContext();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [appLoading, setAppLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [postingReview, setPostingReview] = useState(false);
  const [avgRating, setAvgRating] = useState(null);

  // Load app — try context first, fall back to direct Supabase fetch
  useEffect(() => {
    setAppLoading(true);

    // Try from context (fast path if already loaded)
    const fromContext = apps.find(a => String(a.id) === String(id));
    if (fromContext) {
      setApp(fromContext);
      setAppLoading(false);
      return;
    }

    // Context not ready yet OR app not in context — fetch directly
    if (isSupabaseReady && supabase) {
      supabase.from('apps').select('*').eq('id', id).single()
        .then(({ data, error }) => {
          if (data && !error) {
            setApp({
              ...data,
              emoji: data.icon,
              color: getCategoryColor(data.category),
              active: true
            });
          } else {
            setApp(null);
          }
          setAppLoading(false);
        });
    } else if (!loadingApps) {
      // No Supabase + context finished loading = truly not found
      setApp(null);
      setAppLoading(false);
    }
    // If loadingApps is still true, wait for context to finish (the first useEffect re-runs)
  }, [id, apps, loadingApps]);

  // Load reviews for this app
  useEffect(() => {
    if (!id || !isSupabaseReady || !supabase) return;
    supabase.from('app_reviews')
      .select('*').eq('app_id', id)
      .order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setReviews(data);
          const avg = data.reduce((s, r) => s + (r.rating || 0), 0) / data.length;
          setAvgRating(avg.toFixed(1));
        }
      });
  }, [id]);

  const isInstalled = installedApps.some(i => String(i) === String(app?.id));

  const handleInstall = () => {
    if (isInstalled) { uninstallApp(app.id); return; }
    setInstalling(true); setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 12 + 5;
      if (p >= 100) {
        p = 100; clearInterval(iv);
        setTimeout(() => { setInstalling(false); installApp(app.id); }, 400);
      }
      setProgress(Math.min(p, 100));
    }, 180);
  };

  const handleOpenApp = () => {
    if (app.url && app.url !== '#') window.open(app.url, '_blank', 'noopener');
  };

  const submitReview = async () => {
    if (!newReview.trim()) return;
    if (!user) { navigate('/auth'); return; }
    setPostingReview(true);
    const { data, error } = await supabase.from('app_reviews').upsert([{
      app_id: app.id, user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      rating: newRating, review: newReview
    }]).select();
    if (!error && data) {
      setReviews(prev => [data[0], ...prev.filter(r => r.user_id !== user.id)]);
      setNewReview('');
    }
    setPostingReview(false);
  };

  const starStr = (n) => '★'.repeat(Math.min(5, Math.max(0, Math.round(n)))) + '☆'.repeat(Math.max(0, 5 - Math.round(n)));

  // ---- LOADING ----
  if (appLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: theme.text }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <p style={{ color: theme.subtext }}>Loading app details...</p>
      </div>
    );
  }

  // ---- NOT FOUND ----
  if (!app) {
    return (
      <div style={{ padding: 40, color: theme.text, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <p style={{ marginBottom: 16 }}>App not found</p>
        <button onClick={() => navigate('/')} style={{
          background: theme.accent, color: '#fff', border: 'none',
          borderRadius: 10, padding: '10px 20px', fontSize: 14, cursor: 'pointer'
        }}>← Go Back</button>
      </div>
    );
  }

  const displayRating = avgRating || app.rating || '—';
  const appColor = app.color || getCategoryColor(app.category);
  const description = app.full_description || app.fullDescription || app.description || '';

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Back button */}
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: theme.accent, fontSize: 15,
        fontWeight: 600, cursor: 'pointer', padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 4, minHeight: 44
      }}>← Back</button>

      {/* Hero banner */}
      <div style={{ background: appColor, padding: '20px 16px 24px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 38, flexShrink: 0
          }}>{app.emoji || app.icon || '📱'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 4px', lineHeight: 1.2 }}>{app.name}</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: '0 0 8px' }}>
              {app.developer || 'Never Hide Tech Empire'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>★ {displayRating}</span>
              <span style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>{app.downloads} downloads</span>
              <span style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>{app.category}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 12 }}>
          {[['📦', app.size || '—', 'Size'], ['🔢', app.version || '1.0', 'Version'], ['⬇️', app.install_count || app.downloads || '0', 'Installs']].map(([icon, val, label]) => (
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{icon} {val}</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 14px' }}>

        {/* Install / Open */}
        {installing ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 8, background: theme.searchBg, borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: appColor, borderRadius: 4, transition: 'width 0.15s' }} />
            </div>
            <p style={{ color: theme.subtext, fontSize: 12, textAlign: 'center' }}>Installing... {Math.round(progress)}%</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={handleInstall} style={{
              flex: 1, background: isInstalled ? '#888' : appColor, color: '#fff',
              border: 'none', borderRadius: 12, padding: 12, fontSize: 14,
              fontWeight: 700, cursor: 'pointer', minHeight: 46
            }}>{isInstalled ? '✓ Uninstall' : '⬇️ Install'}</button>
            {app.url && app.url !== '#' && (
              <button onClick={handleOpenApp} style={{
                flex: 1, background: 'transparent', color: appColor,
                border: `2px solid ${appColor}`, borderRadius: 12,
                padding: 12, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', minHeight: 46
              }}>🔗 Open App</button>
            )}
            <button onClick={() => navigator.share?.({ title: app.name, text: description, url: app.url || window.location.href })}
              style={{ background: theme.searchBg, border: `1px solid ${theme.accent}33`, borderRadius: 12, padding: 12, fontSize: 18, cursor: 'pointer', minHeight: 46, minWidth: 46 }}>📤</button>
          </div>
        )}

        {/* About */}
        <div style={{ background: theme.cardBg, borderRadius: 14, padding: 14, marginBottom: 12, border: `1px solid ${theme.accent}22` }}>
          <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>About this app</h3>
          <p style={{ color: theme.subtext, fontSize: 14, lineHeight: 1.65 }}>{description}</p>
        </div>

        {/* Features */}
        {app.features && app.features.length > 0 && (
          <div style={{ background: theme.cardBg, borderRadius: 14, padding: 14, marginBottom: 12, border: `1px solid ${theme.accent}22` }}>
            <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700, marginBottom: 10 }}>✨ Features</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {app.features.map((f, i) => (
                <span key={i} style={{ background: appColor + '22', color: appColor, borderRadius: 10, padding: '5px 10px', fontSize: 12, fontWeight: 600 }}>✓ {f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div style={{ background: theme.cardBg, borderRadius: 14, padding: 14, border: `1px solid ${theme.accent}22` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ color: theme.text, fontSize: 14, fontWeight: 700 }}>⭐ Reviews</h3>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: theme.text, fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{displayRating}</div>
              <div style={{ color: '#f4c430', fontSize: 11 }}>{starStr(displayRating)}</div>
              <div style={{ color: theme.subtext, fontSize: 10 }}>{reviews.length} reviews</div>
            </div>
          </div>

          {/* Review input */}
          <div style={{ marginBottom: 14, padding: 12, background: theme.searchBg, borderRadius: 12 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8, justifyContent: 'center' }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setNewRating(n)}
                  style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: n <= newRating ? '#f4c430' : theme.subtext, padding: '2px 4px' }}>★</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                style={{ flex: 1, background: theme.cardBg, color: theme.text, border: `1px solid ${theme.accent}44`, borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit', minHeight: 42 }}
                placeholder={user ? 'Write your review...' : 'Sign in to review'}
                value={newReview} onChange={e => setNewReview(e.target.value)}
                disabled={!user} onKeyDown={e => e.key === 'Enter' && submitReview()}
              />
              <button onClick={submitReview} disabled={postingReview || !user}
                style={{ background: appColor, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: user ? 'pointer' : 'default', fontSize: 13, minHeight: 42, opacity: !user ? 0.5 : 1 }}>
                {postingReview ? '...' : 'Post'}
              </button>
            </div>
            {!user && (
              <button onClick={() => navigate('/auth')}
                style={{ width: '100%', marginTop: 8, background: 'none', border: `1px solid ${theme.accent}55`, borderRadius: 10, padding: 8, color: theme.accent, cursor: 'pointer', fontSize: 12 }}>
                Sign in to leave a review →
              </button>
            )}
          </div>

          {reviews.length === 0 ? (
            <p style={{ color: theme.subtext, fontSize: 13, textAlign: 'center', padding: '8px 0' }}>No reviews yet — be the first! 🌟</p>
          ) : reviews.map((r, i) => (
            <div key={r.id || i} style={{ borderBottom: `1px solid ${theme.accent}22`, paddingBottom: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>👤</span>
                <span style={{ color: theme.text, fontWeight: 600, fontSize: 13 }}>{r.user_name || 'User'}</span>
                <span style={{ color: '#f4c430', fontSize: 12 }}>{'★'.repeat(r.rating || 0)}{'☆'.repeat(5-(r.rating||0))}</span>
                <span style={{ color: theme.subtext, fontSize: 10, marginLeft: 'auto' }}>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{ color: theme.subtext, fontSize: 13, lineHeight: 1.5, marginLeft: 28 }}>{r.review}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
