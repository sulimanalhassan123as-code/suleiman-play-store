import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import SkyBackground from './components/SkyBackground';
import StorePage from './pages/StorePage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';
import AppDetailPage from './pages/AppDetailPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import PublishPage from './pages/PublishPage';
import './App.css';

function Layout() {
  const { theme } = useTheme();
  return (
    <div className="app-shell" style={{ color: theme.text }}>
      <SkyBackground />
      <div className="app-content">
        <Header />
        <main className="main-scroll">
          <Routes>
            <Route path="/" element={<StorePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/app/:id" element={<AppDetailPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/publish" element={<PublishPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/*" element={<Layout />} />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
