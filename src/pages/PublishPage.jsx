import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseReady } from '../lib/supabase';

const CATEGORIES = ['Islamic', 'Tools', 'AI', 'Games', 'Business', 'Education', 'Social', 'Entertainment'];

export default function PublishPage() {
  const { theme } = useTheme();
  const { user, isPublisher } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    app_name: '', app_icon: '📱', category: 'Tools',
    description: '', app_url: '', payment_ref: ''
  });
  const [error, setError] = useState('');

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.app_name.trim()) { setError('App name is required'); return; }
    if (!form.description.trim()) { setError('Description is required'); return; }
    if (!form.app_url.trim()) { setError('App URL is required'); return; }
    if (!form.payment_ref.trim()) { setError('Payment reference is required to proceed'); return; }
    if (!user) { navigate('/auth'); return; }

    setLoading(true); setError('');
    const { error: err } = await supabase.from('publisher_requests').insert([{
      user_id: user.id,
      email: user.email,
      ...form
    }]);
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSubmitted(true);
  };

  const s = { // styles
    card: { background: theme.cardBg, borderRadius: 16, padding: 18, border: `1px solid ${theme.accent}33`, marginBottom: 14 },
    inp: { width: '100%', boxSizing: 'border-box', background: theme.searchBg, border: `1px solid ${theme.accent}44`, borderRadius: 10, padding: '11px 13px', color: theme.text, fontSize: 14, outline: 'none', fontFamily: 'inherit', display: 'block' },
    btn: (c = theme.accent) => ({ border: 'none', borderRadius: 12, padding: '12px 20px', background: c, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', minHeight: 46 }),
  };

  if (submitted) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 72, marginBottom: 12 }}>🎉</div>
        <h2 style={{ color: theme.text, marginBottom: 8 }}>Request Submitted!</h2>
        <p style={{ color: theme.subtext, lineHeight: 1.6, marginBottom: 20 }}>
          Your app submission is under review. The admin will verify your payment and approve your app within <b style={{ color: theme.accent }}>24-48 hours</b>.
        </p>
        <div style={s.card}>
          <div style={{ color: theme.subtext, fontSize: 13, lineHeight: 1.7 }}>
            <div>📱 <b style={{ color: theme.text }}>{form.app_name}</b></div>
            <div>💳 Payment ref: <b style={{ color: theme.accent }}>{form.payment_ref}</b></div>
            <div>📧 We'll notify: <b style={{ color: theme.text }}>{user?.email}</b></div>
          </div>
        </div>
        <button onClick={() => navigate('/')} style={{ ...s.btn(), width: '100%' }}>← Back to Store</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 20px' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}bb)`, padding: '20px 16px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🚀</div>
        <h2 style={{ color: '#fff', margin: '0 0 6px', fontSize: 20 }}>Publish on Suleiman Store</h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: 0 }}>
          Submit your app to reach thousands of users
        </p>
      </div>

      <div style={{ padding: '16px 14px' }}>
        {/* Pricing card */}
        <div style={{ ...s.card, background: theme.accent + '15', border: `2px solid ${theme.accent}55` }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: theme.text, marginBottom: 10 }}>💰 Publishing Plans</div>
          <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
            {[
              { plan: 'Basic Listing', price: 'GHS 50 / $5', features: 'Listed in store · Up to 1 app · Standard placement' },
              { plan: 'Featured', price: 'GHS 150 / $15', features: 'Featured spot · Priority review · Homepage banner' },
              { plan: 'Publisher Bundle', price: 'GHS 300 / $30', features: 'Up to 5 apps · Featured placement · Publisher badge' },
            ].map(p => (
              <div key={p.plan} style={{ background: theme.searchBg, borderRadius: 12, padding: '12px 14px', border: `1px solid ${theme.accent}33` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>{p.plan}</span>
                  <span style={{ color: theme.accent, fontWeight: 700, fontSize: 14 }}>{p.price}</span>
                </div>
                <div style={{ color: theme.subtext, fontSize: 12 }}>{p.features}</div>
              </div>
            ))}
          </div>
          <p style={{ color: theme.subtext, fontSize: 12, marginTop: 10, lineHeight: 1.5 }}>
            💳 Pay via <b style={{ color: theme.text }}>MoMo · MTN: 0XXXXXXXXX</b> or any method. Include your app name as reference.
          </p>
        </div>

        {!user && (
          <div style={{ ...s.card, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
            <p style={{ color: theme.text, marginBottom: 12 }}>You need an account to submit an app</p>
            <button onClick={() => navigate('/auth')} style={{ ...s.btn(), width: '100%' }}>Sign In / Register</button>
          </div>
        )}

        {user && (
          <>
            {/* App Details */}
            <div style={s.card}>
              <div style={{ fontWeight: 700, fontSize: 15, color: theme.text, marginBottom: 14 }}>📱 App Details</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 0 }}>
                  <input style={{ ...s.inp, width: 60, textAlign: 'center', fontSize: 24, padding: '8px' }} value={form.app_icon} onChange={e => upd('app_icon', e.target.value)} />
                  <div style={{ color: theme.subtext, fontSize: 10, textAlign: 'center', marginTop: 2 }}>Icon</div>
                </div>
                <div style={{ flex: 1 }}>
                  <input style={{ ...s.inp, marginBottom: 8 }} placeholder="App name *" value={form.app_name} onChange={e => upd('app_name', e.target.value)} />
                  <select style={s.inp} value={form.category} onChange={e => upd('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <textarea
                style={{ ...s.inp, minHeight: 80, resize: 'vertical', marginTop: 4 }}
                placeholder="Describe your app — what it does, who it's for *"
                value={form.description}
                onChange={e => upd('description', e.target.value)}
              />
            </div>

            {/* App URL */}
            <div style={s.card}>
              <div style={{ fontWeight: 700, fontSize: 15, color: theme.text, marginBottom: 10 }}>🔗 App Link</div>
              <input style={s.inp} placeholder="https://your-app.vercel.app *" value={form.app_url} onChange={e => upd('app_url', e.target.value)} />
              <p style={{ color: theme.subtext, fontSize: 12, marginTop: 6 }}>Must be a working live URL. Your app will be tested before approval.</p>
            </div>

            {/* Payment */}
            <div style={s.card}>
              <div style={{ fontWeight: 700, fontSize: 15, color: theme.text, marginBottom: 10 }}>💳 Payment Confirmation</div>
              <p style={{ color: theme.subtext, fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>
                After paying, enter your MoMo transaction ID or payment reference below so admin can verify.
              </p>
              <input
                style={s.inp}
                placeholder="Transaction ID / Payment reference *"
                value={form.payment_ref}
                onChange={e => upd('payment_ref', e.target.value)}
              />
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginBottom: 10 }}>⚠️ {error}</p>}

            <button onClick={submit} disabled={loading} style={{ ...s.btn(loading ? '#888' : theme.accent), width: '100%' }}>
              {loading ? '⏳ Submitting...' : '🚀 Submit for Review'}
            </button>

            <p style={{ color: theme.subtext, fontSize: 12, textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              By submitting, you agree that your app content is halal and appropriate for all users.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
