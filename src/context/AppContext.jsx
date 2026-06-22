import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, supabaseAdmin, isSupabaseReady } from '../lib/supabase';
import { APPS } from '../data/apps';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [apps, setApps] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [installedApps, setInstalledApps] = useState(() => {
    try { return JSON.parse(localStorage.getItem('installed_apps') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    setLoadingApps(true);
    if (isSupabaseReady && supabase) {
      const { data, error } = await supabase
        .from('apps')
        .select('*')
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('install_count', { ascending: false });

      if (!error && data && data.length > 0) {
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
    setApps(APPS);
    setLoadingApps(false);
  };

  useEffect(() => {
    localStorage.setItem('installed_apps', JSON.stringify(installedApps));
  }, [installedApps]);

  const installApp = async (appId) => {
    if (!installedApps.some(id => String(id) === String(appId))) {
      setInstalledApps(prev => [...prev, appId]);
      // Track install in DB
      if (supabaseAdmin) {
        await supabaseAdmin.from('app_installs').insert({ app_id: appId });
        await supabaseAdmin.from('apps').update({
          install_count: apps.find(a => String(a.id) === String(appId))?.install_count + 1 || 1
        }).eq('id', appId);
      }
    }
  };

  const uninstallApp = (appId) => {
    setInstalledApps(prev => prev.filter(id => String(id) !== String(appId)));
  };

  const addApp = (app) => setApps(prev => [...prev, { ...app, id: Date.now(), active: true }]);
  const removeApp = (id) => setApps(prev => prev.filter(a => String(a.id) !== String(id)));
  const toggleApp = (id) => setApps(prev => prev.map(a => String(a.id) === String(id) ? { ...a, active: !a.active } : a));

  return (
    <AppContext.Provider value={{
      apps, loadingApps, addApp, removeApp, toggleApp,
      installedApps, installApp, uninstallApp, refreshApps: fetchApps
    }}>
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
    'Social': '#e91e63',
    'Entertainment': '#ff5722',
  };
  return map[cat] || '#3498db';
}

export const useAppContext = () => useContext(AppContext);
