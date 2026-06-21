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

  const app = apps.find(a => a.id === parseInt(id));
  const isInstalled = installedApps.includes(app?.id);

  if (!app) return (
    <div style={{ padding: 24, color: theme.text, textAlign: 'center' }}>
      <div style={{ fontSize: 48 }}>😕</div>
      <p>App not found</p>
      <button onClick={() => navigate('/')} style={{ background: theme.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px' }}>
        ← Go Back
      </button>
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

  const submitReview = () => {
    if (!newReview.trim()) return;
    setReviews(prev => [{ user: "You", avatar: "😊", rating: 5, text: newReview, time: "Just now" }, ...prev]);
    setNewReview('');
  };

  return (
    <div className="app-detail-page" style={{ background: 'transparent' }}>
      <button className="back-btn" onClick={() => navigate(-1)} style={{ color: theme.accent }}>
        ← Back
      </button>

      {/* Hero */}
      <div className="detail-hero" style={{ background: app.color }}>
        <div className="detail-icon">{app.emoji}</div>
        <div className="detail-hero-info">
          <h1 className="detail-name">{app.name}</h1>
          <p className="detail-category">Never Hide Tech Empire</p>
          <div className="detail-stats">
            <span>★ {app.rating}</span>
            <span>·</span>
            <span>{app.downloads} downloads</span>
            <span>·</span>
            <span>{app.category}</span>
          </div>
        </div>
      </div>

      <div className="detail-body" style={{ background: theme.cardBg }}>
        {/* Install button */}
        {installing ? (
          <div className="detail-install-progress">
            <div className="big-progress-bar">
              <div className="big-progress-fill" style={{ width: `${progress}%`, background: app.color }} />
            </div>
            <p style={{ color: theme.text }}>Installing... {Math.round(progress)}%</p>
          </div>
        ) : (
          <div className="detail-actions-row">
            <button
              className="detail-install-btn"
              style={{ background: isInstalled ? '#888' : app.color }}
              onClick={handleInstall}
            >
              {isInstalled ? '✓ Installed — Uninstall' : '⬇️ Install'}
            </button>
            <button className="detail-share-btn" style={{ borderColor: app.color, color: app.color }}
              onClick={() => navigator.share?.({ title: app.name, text: app.description, url: window.location.href })}>
              📤
            </button>
            <button className="detail-share-btn" style={{ borderColor: app.color, color: app.color }}>
              ❤️
            </button>
          </div>
        )}

        {/* About */}
        <section className="detail-section">
          <h3 style={{ color: theme.text }}>About this app</h3>
          <p style={{ color: theme.subtext }}>{app.fullDescription}</p>
        </section>

        {/* Features */}
        <section className="detail-section">
          <h3 style={{ color: theme.text }}>Features</h3>
          <div className="features-grid">
            {app.features?.map((f, i) => (
              <div key={i} className="feature-item" style={{ background: app.color + '22', color: app.color }}>
                ✓ {f}
              </div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <section className="detail-section">
          <h3 style={{ color: theme.text }}>Reviews</h3>
          <div className="review-input-wrap">
            <input
              className="review-input"
              style={{ background: theme.searchBg, color: theme.text, border: `1px solid ${theme.accent}44` }}
              placeholder="Write a review..."
              value={newReview}
              onChange={e => setNewReview(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitReview()}
            />
            <button style={{ background: app.color, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px' }} onClick={submitReview}>Post</button>
          </div>
          {reviews.map((r, i) => (
            <div key={i} className="review-item" style={{ borderBottom: `1px solid ${theme.accent}22` }}>
              <div className="review-header">
                <span>{r.avatar}</span>
                <span style={{ color: theme.text, fontWeight: 600 }}>{r.user}</span>
                <span style={{ color: '#f4c430' }}>{'★'.repeat(r.rating)}</span>
                <span style={{ color: theme.subtext, fontSize: 12 }}>{r.time}</span>
              </div>
              <p style={{ color: theme.subtext, margin: '4px 0 0 28px', fontSize: 14 }}>{r.text}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
