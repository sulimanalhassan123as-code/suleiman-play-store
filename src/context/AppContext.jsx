import { createContext, useContext, useState, useEffect } from 'react';
import { APPS } from '../data/apps';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [apps, setApps] = useState(() => {
    const saved = localStorage.getItem('suleiman_apps');
    return saved ? JSON.parse(saved) : APPS;
  });
  const [installedApps, setInstalledApps] = useState(() => {
    const saved = localStorage.getItem('installed_apps');
    return saved ? JSON.parse(saved) : [];
  });
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    localStorage.setItem('suleiman_apps', JSON.stringify(apps));
  }, [apps]);

  useEffect(() => {
    localStorage.setItem('installed_apps', JSON.stringify(installedApps));
  }, [installedApps]);

  const addApp = (app) => {
    const newApp = { ...app, id: Date.now(), active: true };
    setApps(prev => [...prev, newApp]);
  };

  const removeApp = (id) => {
    setApps(prev => prev.filter(a => a.id !== id));
  };

  const toggleApp = (id) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const installApp = (appId) => {
    if (!installedApps.includes(appId)) {
      setInstalledApps(prev => [...prev, appId]);
    }
  };

  const uninstallApp = (appId) => {
    setInstalledApps(prev => prev.filter(id => id !== appId));
  };

  return (
    <AppContext.Provider value={{ apps, addApp, removeApp, toggleApp, installedApps, installApp, uninstallApp, user, setUser, isAdmin, setIsAdmin }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
