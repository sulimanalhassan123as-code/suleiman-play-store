import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabase';
import { APPS } from '../data/apps';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [apps, setApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [installedApps, setInstalledApps] = useState(() => {
    const saved = localStorage.getItem('installed_apps');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchApps = async () => {
      if (isSupabaseReady && supabase) {
        const { data, error } = await supabase
          .from('apps')
          .select('*')
          .order('featured', { ascending: false })
          .order('rating', { ascending: false });
        if (!error && data && data.length > 0) {
          // Normalize: map DB fields to app fields expected by components
          const mapped = data.map(a => ({
            ...a,
            emoji: a.icon,
            active: true,
            color: getCategoryColor(a.category),
          }));
          setApps(mapped);
          setLoadingApps(false);
          return;
        }
      }
      // Fallback to local data
      setApps(APPS);
      setLoadingApps(false);
    };
    fetchApps();
  }, []);

  useEffect(() => {
    localStorage.setItem('installed_apps', JSON.stringify(installedApps));
  }, [installedApps]);

  const installApp = (appId) => {
    if (!installedApps.includes(appId)) {
      setInstalledApps(prev => [...prev, appId]);
    }
  };

  const uninstallApp = (appId) => {
    setInstalledApps(prev => prev.filter(id => id !== appId));
  };

  // Keep legacy methods for admin compat
  const addApp = (app) => setApps(prev => [...prev, { ...app, id: Date.now(), active: true }]);
  const removeApp = (id) => setApps(prev => prev.filter(a => a.id !== id));
  const toggleApp = (id) => setApps(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));

  return (
    <AppContext.Provider value={{ apps, loadingApps, addApp, removeApp, toggleApp, installedApps, installApp, uninstallApp }}>
      {children}
    </AppContext.Provider>
  );
}

function getCategoryColor(cat) {
  const map = {
    'Islamic': '#2ecc71',
    'AI': '#9b59b6',
    'Games': '#e74c3c',
    'Tools': '#3498db',
    'Business': '#f39c12',
    'Education': '#1abc9c',
  };
  return map[cat] || '#3498db';
}

export const useAppContext = () => useContext(AppContext);
