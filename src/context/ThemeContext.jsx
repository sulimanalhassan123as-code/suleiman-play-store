import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
  morning: {
    name: 'Morning',
    emoji: '☀️',
    greeting: 'Good Morning',
    bg: 'linear-gradient(180deg, #FF6B35 0%, #FFB347 30%, #87CEEB 60%, #f0f8ff 100%)',
    cardBg: 'rgba(255,255,255,0.95)',
    headerBg: '#FF6B35',
    text: '#1a1a2e',
    subtext: '#444',
    accent: '#FF6B35',
    navBg: 'rgba(255,255,255,0.97)',
    pillActive: '#FF6B35',
    pillBg: '#fff3ee',
    searchBg: '#fff',
    sky: 'morning'
  },
  afternoon: {
    name: 'Afternoon',
    emoji: '🌤️',
    greeting: 'Good Afternoon',
    bg: 'linear-gradient(180deg, #1a7fc1 0%, #5ba3d9 30%, #c8e6f5 60%, #f0f8ff 100%)',
    cardBg: 'rgba(255,255,255,0.95)',
    headerBg: '#1a7fc1',
    text: '#0d1b2a',
    subtext: '#333',
    accent: '#1a7fc1',
    navBg: 'rgba(255,255,255,0.97)',
    pillActive: '#1a7fc1',
    pillBg: '#e8f4fd',
    searchBg: '#fff',
    sky: 'afternoon'
  },
  evening: {
    name: 'Evening',
    emoji: '🌙',
    greeting: 'Good Evening',
    bg: 'linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 25%, #2d2d6b 50%, #1a1a2e 100%)',
    cardBg: 'rgba(30,30,60,0.95)',
    headerBg: '#0a0a2e',
    text: '#e8e8ff',
    subtext: '#aab',
    accent: '#7c83fd',
    navBg: 'rgba(10,10,46,0.97)',
    pillActive: '#7c83fd',
    pillBg: 'rgba(124,131,253,0.15)',
    searchBg: 'rgba(255,255,255,0.1)',
    sky: 'evening'
  },
  dark: {
    name: 'Dark',
    emoji: '🌑',
    greeting: 'Welcome',
    bg: 'linear-gradient(180deg, #0d0d0d 0%, #1a1a1a 100%)',
    cardBg: 'rgba(30,30,30,0.98)',
    headerBg: '#111',
    text: '#f0f0f0',
    subtext: '#aaa',
    accent: '#1a8c3a',
    navBg: 'rgba(17,17,17,0.97)',
    pillActive: '#1a8c3a',
    pillBg: 'rgba(26,140,58,0.15)',
    searchBg: 'rgba(255,255,255,0.08)',
    sky: 'dark'
  },
  green: {
    name: 'Classic',
    emoji: '🕌',
    greeting: 'Assalamu Alaikum',
    bg: 'linear-gradient(180deg, #1a5c3a 0%, #2d8c5e 40%, #e8f5ee 100%)',
    cardBg: 'rgba(255,255,255,0.97)',
    headerBg: '#1a5c3a',
    text: '#0d2b1a',
    subtext: '#2d5a3d',
    accent: '#1a5c3a',
    navBg: 'rgba(255,255,255,0.97)',
    pillActive: '#1a5c3a',
    pillBg: '#e8f5ee',
    searchBg: '#fff',
    sky: 'classic'
  }
};

export function ThemeProvider({ children }) {
  const getAutoTheme = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'afternoon';
    if (h >= 17 && h < 21) return 'evening';
    return 'dark';
  };

  const [themeName, setThemeName] = useState(() => localStorage.getItem('theme') || getAutoTheme());
  const theme = themes[themeName];

  useEffect(() => {
    localStorage.setItem('theme', themeName);
  }, [themeName]);

  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeName, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
