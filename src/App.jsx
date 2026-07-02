import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import SkyBackground from './components/SkyBackground';
import WelcomeBackToast from './components/WelcomeBackToast';
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
      <WelcomeBackToast />
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

// Waits for the auth session to hydrate before rendering the real UI, so
// logged-in users never see a flash of "guest" state that makes it look
// like they've been signed out.
function AuthGate({ children }) {
  const { loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12,
        background: theme.headerBg || '#0b1224',
      }}>
        <div style={{ fontSize: 44 }}>🏪</div>
        <div style={{ color: '#fff', fontSize: 13, opacity: 0.8 }}>Loading Suleiman Play Store...</div>
      </div>
    );
  }
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <AuthGate>
            <BrowserRouter>
              <Routes>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/*" element={<Layout />} />
              </Routes>
            </BrowserRouter>
          </AuthGate>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
