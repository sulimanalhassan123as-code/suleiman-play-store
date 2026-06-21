import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const { theme } = useTheme();
  const { signIn, signUp, isSupabaseReady } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handle = async () => {
    setError(''); setSuccess('');
    if (!email || !password) { setError('Please fill all fields'); return; }
    if (!isSupabaseReady) { setError('Auth not configured yet. Coming soon!'); return; }
    setLoading(true);
    if (mode === 'login') {
      const { error: err } = await signIn(email, password);
      if (err) setError(err.message);
      else navigate('/');
    } else {
      if (!fullName) { setError('Enter your full name'); setLoading(false); return; }
      const { error: err } = await signUp(email, password, fullName);
      if (err) setError(err.message);
      else setSuccess('Account created! Check your email to confirm.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: theme.cardBg, borderRadius: 20, padding: 28, width: '100%', maxWidth: 380, border: `1px solid ${theme.accent}44`, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>🏪</div>
          <h2 style={{ color: theme.text, margin: '8px 0 4px' }}>Suleiman Play Store</h2>
          <p style={{ color: theme.subtext, fontSize: 13 }}>Never Hide Tech Empire</p>
        </div>

        <div style={{ display: 'flex', background: theme.searchBg, borderRadius: 12, padding: 4, marginBottom: 20, border: `1px solid ${theme.accent}33` }}>
          {['login','register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
              style={{ flex: 1, border: 'none', borderRadius: 9, padding: '9px 0', background: mode === m ? theme.accent : 'transparent', color: mode === m ? '#fff' : theme.subtext, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}>
              {m === 'login' ? '🔐 Sign In' : '✍️ Register'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <input placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)}
              style={{ border: `1px solid ${theme.accent}44`, borderRadius: 10, padding: '12px 14px', background: theme.searchBg, color: theme.text, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          )}
          <input placeholder="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)}
            style={{ border: `1px solid ${theme.accent}44`, borderRadius: 10, padding: '12px 14px', background: theme.searchBg, color: theme.text, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()}
            style={{ border: `1px solid ${theme.accent}44`, borderRadius: 10, padding: '12px 14px', background: theme.searchBg, color: theme.text, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
        </div>

        {error && <p style={{ color: '#e74c3c', fontSize: 13, marginTop: 8, textAlign: 'center' }}>⚠️ {error}</p>}
        {success && <p style={{ color: '#27ae60', fontSize: 13, marginTop: 8, textAlign: 'center' }}>✅ {success}</p>}

        <button onClick={handle} disabled={loading}
          style={{ width: '100%', marginTop: 16, background: loading ? '#888' : theme.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? '⏳ Please wait...' : mode === 'login' ? '🔐 Sign In' : '✍️ Create Account'}
        </button>

        <button onClick={() => navigate('/')}
          style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: theme.subtext, fontSize: 13, cursor: 'pointer', padding: 8 }}>
          Continue as Guest →
        </button>
      </div>
    </div>
  );
}
