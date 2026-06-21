import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../data/apps';
import AppCard from '../components/AppCard';

export default function StorePage() {
  const { theme } = useTheme();
  const { apps } = useAppContext();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = apps.filter(app => {
    if (!app.active) return false;
    const matchSearch = app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'All' || app.category === activeCategory.replace(/^[^ ]+ /, '');
    return matchSearch && matchCat;
  });

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
          {search && (
            <button className="search-clear" onClick={() => setSearch('')} style={{ color: theme.subtext }}>✕</button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="categories-scroll">
        {CATEGORIES.map(cat => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              className={`cat-pill ${active ? 'cat-pill-active' : ''}`}
              style={{
                background: active ? theme.pillActive : theme.pillBg,
                color: active ? '#fff' : theme.text,
                border: `1px solid ${active ? theme.pillActive : theme.accent + '44'}`
              }}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Featured label */}
      <div className="section-label" style={{ color: theme.text }}>
        {activeCategory === 'All' ? '⭐ FEATURED APPS' : `📂 ${activeCategory.toUpperCase()}`}
        <span className="app-count" style={{ color: theme.subtext }}> ({filtered.length})</span>
      </div>

      {/* App grid */}
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ color: theme.subtext }}>
          <div style={{ fontSize: 48 }}>🔍</div>
          <p>No apps found for "{search}"</p>
        </div>
      ) : (
        <div className="apps-grid">
          {filtered.map(app => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}
