import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function PhoneCollectModal() {
  const { theme } = useTheme();
  const { needsPhone, savePhone, dismissPhonePrompt } = useAuth();
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!needsPhone) return null;

  const submit = async () => {
    if (!phone.trim()) { setError('Enter a valid number'); return; }
    setSaving(true);
    const { error: err } = await savePhone(phone);
    setSaving(false);
    if (err) setError('Could not save, try again');
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: theme.cardBg, borderRadius: 20, padding: 26, width: '100%', maxWidth: 360,
        border: `1px solid ${theme.accent}44`, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>📱</div>
        <h3 style={{ color: theme.text, margin: '0 0 6px' }}>One quick thing!</h3>
        <p style={{ color: theme.subtext, fontSize: 13, marginBottom: 16 }}>
          Drop your WhatsApp/phone number so we can reach you with updates and support.
        </p>
        <input
          type="tel"
          placeholder="+233XXXXXXXXX"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          autoFocus
          style={{
            width: '100%', boxSizing: 'border-box', border: `1px solid ${theme.accent}44`, borderRadius: 10,
            padding: '12px 14px', background: theme.searchBg, color: theme.text, fontSize: 14,
            outline: 'none', fontFamily: 'inherit', marginBottom: 10,
          }}
        />
        {error && <p style={{ color: '#e74c3c', fontSize: 12, marginBottom: 8 }}>⚠️ {error}</p>}
        <button onClick={submit} disabled={saving} style={{
          width: '100%', background: saving ? '#888' : theme.accent, color: '#fff', border: 'none',
          borderRadius: 12, padding: 13, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', marginBottom: 8,
        }}>
          {saving ? '⏳ Saving...' : '✅ Save Number'}
        </button>
        <button onClick={dismissPhonePrompt} style={{
          width: '100%', background: 'none', border: 'none', color: theme.subtext, fontSize: 13, cursor: 'pointer', padding: 6,
        }}>
          Skip for now →
        </button>
      </div>
    </div>
  );
}
