import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../data/apps';
import AppCard from '../components/AppCard';

export default function StorePage() {
  const { theme } = useTheme();
  const { apps, loadingApps } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = apps.filter(app => {
    if (!app.active && app.active !== undefined) return false;
    if (app.status && app.status !== 'active') return false;
    const matchSearch = app.name.toLowerCase().includes(search.toLowerCase()) ||
      (app.description || '').toLowerCase().includes(search.toLowerCase());
    const catName = activeCategory.replace(/^[^\s]+ /, '');
    const matchCat = activeCategory === 'All' || app.category === catName;
    return matchSearch && matchCat;
  });

  const featured = filtered.filter(a => a.featured);
  const regular = filtered.filter(a => !a.featured);

  return (
    <div className="store-page">
      {/* Search */}
      <div className="search-wrap">
        <div className="search-bar" style={{ background: theme.searchBg, border: `1px solid ${theme.accent}33` }}>
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            style={{ background: 'transparent', color: theme.text }}
            placeholder="Search apps..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="search-clear" onClick={() => setSearch('')} style={{ color: theme.subtext }}>✕</button>}
        </div>
      </div>

      {/* Category pills */}
      <div className="categories-scroll">
        {CATEGORIES.map(cat => {
          const active = activeCategory === cat;
          return (
            <button key={cat} className={`cat-pill ${active ? 'cat-pill-active' : ''}`}
              style={{ background: active ? theme.pillActive : theme.pillBg, color: active ? '#fff' : theme.text, border: `1px solid ${active ? theme.pillActive : theme.accent + '44'}` }}
              onClick={() => setActiveCategory(cat)}>
              {cat}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loadingApps && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 12px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: 270, borderRadius: 16 }} />
          ))}
        </div>
      )}

      {!loadingApps && (
        <>
          {/* Featured section */}
          {featured.length > 0 && (
            <>
              <div className="section-label" style={{ color: theme.text }}>
                ⭐ FEATURED <span className="app-count" style={{ color: theme.subtext }}>({featured.length})</span>
              </div>
              <div className="apps-grid">
                {featured.map(app => <AppCard key={app.id} app={app} />)}
              </div>
            </>
          )}

          {/* All apps */}
          {regular.length > 0 && (
            <>
              <div className="section-label" style={{ color: theme.text }}>
                {activeCategory === 'All' ? '📱 ALL APPS' : `📂 ${activeCategory.toUpperCase()}`}
                <span className="app-count" style={{ color: theme.subtext }}> ({regular.length})</span>
              </div>
              <div className="apps-grid">
                {regular.map(app => <AppCard key={app.id} app={app} />)}
              </div>
            </>
          )}

          {filtered.length === 0 && (
            <div className="empty-state" style={{ color: theme.subtext }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🔍</div>
              <p>{search ? `No apps found for "${search}"` : 'No apps in this category yet'}</p>
            </div>
          )}

          {/* Publish CTA */}
          <div onClick={() => navigate('/publish')} style={{
            margin: '16px 12px 8px', background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}99)`,
            borderRadius: 16, padding: '16px 18px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 14
          }}>
            <span style={{ fontSize: 36 }}>🚀</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Publish Your App</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>Reach thousands of users on Suleiman Store</div>
            </div>
            <span style={{ color: '#fff', marginLeft: 'auto', fontSize: 18 }}>›</span>
          </div>
        </>
      )}
    </div>
  );
}
