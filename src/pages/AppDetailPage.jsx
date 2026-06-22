import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

const REVIEWS = [
  { user: "Abdullah M.", avatar: "👨‍🦱", rating: 5, text: "MashaAllah, absolutely amazing app! Highly recommended.", time: "2 days ago" },
  { user: "Fatimah K.", avatar: "👩‍🦳", rating: 5, text: "JazakAllah Khair! This has changed my daily routine for the better.", time: "1 week ago" },
  { user: "Usman H.", avatar: "👨‍🦲", rating: 4, text: "Very useful app. Could use a few more features but overall great.", time: "2 weeks ago" },
];

export default function AppDetailPage() {
  const { id } = useParams();
  const { apps, installedApps, installApp, uninstallApp } = useAppContext();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [reviews, setReviews] = useState(REVIEWS);

  // Support both UUID (from Supabase) and numeric (from fallback) IDs
  const app = apps.find(a => String(a.id) === String(id));
  const isInstalled = installedApps.includes(app?.id);

  if (!app) return (
    <div style={{ padding: 40, color: theme.text, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
      <p style={{ marginBottom: 16 }}>App not found</p>
      <button onClick={() => navigate('/')} style={{
        background: theme.accent, color: '#fff', border: 'none',
        borderRadius: 10, padding: '10px 20px', fontSize: 14, cursor: 'pointer'
      }}>← Go Back</button>
    </div>
  );

  const handleInstall = () => {
    if (isInstalled) { uninstallApp(app.id); return; }
    setInstalling(true); setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 12 + 5;
      if (p >= 100) {
        p = 100; clearInterval(interval);
        setTimeout(() => { setInstalling(false); installApp(app.id); }, 400);
      }
      setProgress(Math.min(p, 100));
    }, 200);
  };

  const handleOpen = () => {
    if (app.url && app.url !== '#') {
      window.open(app.url, '_blank', 'noopener');
    }
  };

  const submitReview = () => {
    if (!newReview.trim()) return;
    setReviews(prev => [{ user: "You", avatar: "😊", rating: 5, text: newReview, time: "Just now" }, ...prev]);
    setNewReview('');
  };

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Back button */}
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: theme.accent, fontSize: 15,
        fontWeight: 600, cursor: 'pointer', padding: '14px 16px', display: 'flex',
        alignItems: 'center', gap: 4, minHeight: 44
      }}>← Back</button>

      {/* Hero Banner */}
      <div style={{
        background: app.color, padding: '20px 16px 24px', display: 'flex',
        flexDirection: 'column', alignItems: 'center', textAlign: 'center'
      }}>
        <div style={{
          width: 90, height: 90, borderRadius: 22,
          background: 'rgba(255,255,255,0.2)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 44, marginBottom: 14
        }}>{app.emoji}</div>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 6, lineHeight: 1.2 }}>{app.name}</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 6 }}>Never Hide Tech Empire</p>
        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span>★ {app.rating}</span>
          <span>·</span>
          <span>{app.downloads} downloads</span>
          <span>·</span>
          <span>{app.category}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: theme.cardBg, margin: '0 12px', borderRadius: '0 0 16px 16px', padding: '16px 14px' }}>
        {/* Actions */}
        {installing ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ height: 8, background: 'rgba(0,0,0,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: app.color, borderRadius: 4, transition: 'width 0.2s' }} />
            </div>
            <p style={{ color: theme.subtext, fontSize: 12, textAlign: 'center' }}>Installing... {Math.round(progress)}%</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={handleInstall} style={{
              flex: 1, background: isInstalled ? '#888' : app.color, color: '#fff',
              border: 'none', borderRadius: 12, padding: '12px', fontSize: 14,
              fontWeight: 700, cursor: 'pointer', minHeight: 46
            }}>
              {isInstalled ? '✓ Uninstall' : '⬇️ Install'}
            </button>
            {app.url && app.url !== '#' && (
              <button onClick={handleOpen} style={{
                flex: 1, background: 'transparent', color: app.color,
                border: `2px solid ${app.color}`, borderRadius: 12,
                padding: '12px', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', minHeight: 46
              }}>🔗 Open App</button>
            )}
            <button onClick={() => navigator.share?.({ title: app.name, text: app.description, url: app.url || window.location.href })}
              style={{
                background: 'transparent', border: `2px solid ${theme.accent}44`,
                borderRadius: 12, padding: '12px', fontSize: 18, cursor: 'pointer',
                minHeight: 46, minWidth: 46
              }}>📤</button>
          </div>
        )}

        {/* About */}
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ color: theme.text, fontSize: 15, fontWeight: 700, marginBottom: 8 }}>About this app</h3>
          <p style={{ color: theme.subtext, fontSize: 14, lineHeight: 1.6 }}>
            {app.fullDescription || app.description}
          </p>
        </div>

        {/* Features */}
        {app.features && app.features.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ color: theme.text, fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Features</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {app.features.map((f, i) => (
                <span key={i} style={{
                  background: app.color + '22', color: app.color,
                  borderRadius: 10, padding: '5px 10px', fontSize: 12, fontWeight: 600
                }}>✓ {f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div>
          <h3 style={{ color: theme.text, fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Reviews</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              style={{
                flex: 1, background: theme.searchBg, color: theme.text,
                border: `1px solid ${theme.accent}44`, borderRadius: 10,
                padding: '10px 12px', fontSize: 14, outline: 'none',
                fontFamily: 'inherit', minHeight: 42
              }}
              placeholder="Write a review..."
              value={newReview}
              onChange={e => setNewReview(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitReview()}
            />
            <button onClick={submitReview} style={{
              background: app.color, color: '#fff', border: 'none',
              borderRadius: 10, padding: '10px 14px', fontWeight: 700,
              cursor: 'pointer', fontSize: 13, minHeight: 42
            }}>Post</button>
          </div>
          {reviews.map((r, i) => (
            <div key={i} style={{
              borderBottom: `1px solid ${theme.accent}22`,
              paddingBottom: 12, marginBottom: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>{r.avatar}</span>
                <span style={{ color: theme.text, fontWeight: 600, fontSize: 13 }}>{r.user}</span>
                <span style={{ color: '#f4c430', fontSize: 12 }}>{'★'.repeat(r.rating)}</span>
                <span style={{ color: theme.subtext, fontSize: 11, marginLeft: 'auto' }}>{r.time}</span>
              </div>
              <p style={{ color: theme.subtext, fontSize: 13, lineHeight: 1.5, marginLeft: 30 }}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
