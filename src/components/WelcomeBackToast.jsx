import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function WelcomeBackToast() {
  const { theme } = useTheme();
  const { welcomeBackName, dismissWelcomeBack } = useAuth();

  useEffect(() => {
    if (!welcomeBackName) return;
    const t = setTimeout(dismissWelcomeBack, 3500);
    return () => clearTimeout(t);
  }, [welcomeBackName]);

  if (!welcomeBackName) return null;

  return (
    <div
      onClick={dismissWelcomeBack}
      style={{
        position: 'fixed',
        top: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: theme.cardBg,
        color: theme.text,
        border: `1px solid ${theme.accent}55`,
        borderRadius: 14,
        padding: '10px 18px',
        boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
        fontSize: 14,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        animation: 'welcomeBackSlide 0.35s ease-out',
        maxWidth: '92vw',
      }}
    >
      <span style={{ fontSize: 18 }}>👋</span>
      <span>Welcome back, {welcomeBackName}!</span>
      <style>{`
        @keyframes welcomeBackSlide {
          from { opacity: 0; transform: translate(-50%, -12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
