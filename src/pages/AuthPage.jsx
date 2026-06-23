import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseReady } from '../lib/supabase';

export default function AuthPage() {
  const { theme } = useTheme();
  const { signIn, signUp, isSupabaseReady: authReady } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const inp = {
    border: `1px solid ${theme.accent}44`,
    borderRadius: 10,
    padding: '12px 14px',
    background: theme.searchBg,
    color: theme.text,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  };

  const handle = async () => {
    setError(''); setSuccess('');
    if (!email || !password) { setError('Please fill all fields'); return; }
    if (!authReady) { setError('Auth not configured yet. Coming soon!'); return; }
    setLoading(true);

    if (mode === 'login') {
      const { error: err } = await signIn(email, password);
      if (err) { setError(err.message); setLoading(false); return; }
      // Show feedback popup after sign in
      setShowFeedback(true);
    } else {
      if (!fullName) { setError('Enter your full name'); setLoading(false); return; }
      const { error: err, data } = await signUp(email, password, fullName);
      if (err) { setError(err.message); setLoading(false); return; }
      // Save phone to profiles after signup
      if (phone.trim() && isSupabaseReady && data?.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          phone: phone.trim(),
        });
      }
      setSuccess('Account created! Check your email to confirm, then sign in.');
    }
    setLoading(false);
  };

  const submitFeedback = async () => {
    if (!isSupabaseReady) { navigate('/'); return; }
    try {
      await supabase.from('user_feedback').insert([{
        email,
        rating,
        message: feedbackText.trim() || null,
        created_at: new Date().toISOString(),
      }]);
    } catch (_) {}
    setFeedbackSent(true);
    setTimeout(() => navigate('/'), 1500);
  };

  const skipFeedback = () => navigate('/');

  // ---- FEEDBACK POPUP ----
  if (showFeedback) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: theme.cardBg, borderRadius: 20, padding: 28, width: '100%', maxWidth: 380, border: `1px solid ${theme.accent}44`, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', textAlign: 'center' }}>
          {feedbackSent ? (
            <>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
              <h3 style={{ color: theme.text, margin: '0 0 8px' }}>Thank you!</h3>
              <p style={{ color: theme.subtext, fontSize: 13 }}>Redirecting to store...</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48, marginBottom: 8 }}>⭐</div>
              <h3 style={{ color: theme.text, margin: '0 0 6px' }}>How's the Store?</h3>
              <p style={{ color: theme.subtext, fontSize: 13, marginBottom: 18 }}>Quick 5-second feedback helps us improve!</p>
              {/* Star Rating */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setRating(n)} style={{
                    background: 'none', border: 'none', fontSize: 32, cursor: 'pointer',
                    opacity: n <= rating ? 1 : 0.3, transition: 'all 0.15s', transform: n <= rating ? 'scale(1.2)' : 'scale(1)'
                  }}>⭐</button>
                ))}
              </div>
              <textarea
                placeholder="Any comment? (optional)"
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                style={{ ...inp, minHeight: 70, resize: 'none', marginBottom: 14 }}
              />
              <button onClick={submitFeedback} style={{
                width: '100%', background: theme.accent, color: '#fff', border: 'none',
                borderRadius: 12, padding: 13, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10
              }}>
                ✅ Submit Feedback
              </button>
              <button onClick={skipFeedback} style={{
                width: '100%', background: 'none', border: 'none', color: theme.subtext,
                fontSize: 13, cursor: 'pointer', padding: 6
              }}>
                Skip →
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---- MAIN AUTH ----
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
            <input placeholder="Full Name *" value={fullName} onChange={e => setFullName(e.target.value)} style={inp} />
          )}
          <input placeholder="Email address *" type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
          <input placeholder="Password *" type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()} style={inp} />
          {mode === 'register' && (
            <input placeholder="📱 Phone / WhatsApp (e.g. +233XXXXXXXXX)" type="tel" value={phone}
              onChange={e => setPhone(e.target.value)} style={inp} />
          )}
          {mode === 'register' && (
            <p style={{ color: theme.subtext, fontSize: 11, margin: '-4px 0 0', textAlign: 'center' }}>
              📞 We may send you store updates via WhatsApp/SMS
            </p>
          )}
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
