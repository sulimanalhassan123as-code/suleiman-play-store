// Public, narrow telemetry endpoint for regular visitors (no password needed —
// these are routine actions every visitor triggers: install tracking, session
// heartbeat). The Supabase service_role key is used ONLY here, server-side, and
// only for these specific pre-defined, narrowly-scoped operations — never a
// general-purpose passthrough like /api/proxy which is reserved for /admin.

async function sb(path, opts = {}) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!r.ok) throw new Error(await r.text());
  if (r.status === 204) return null;
  const ct = r.headers.get('content-type') || '';
  return ct.includes('json') ? r.json() : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { action, payload = {} } = body || {};

  try {
    switch (action) {
      case 'install_app': {
        const appId = String(payload.app_id || '').slice(0, 100);
        if (!appId) return res.status(400).json({ error: 'app_id required' });
        const rows = await sb(`apps?id=eq.${encodeURIComponent(appId)}&select=install_count`);
        const current = rows?.[0]?.install_count || 0;
        await sb(`apps?id=eq.${encodeURIComponent(appId)}`, {
          method: 'PATCH', headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ install_count: current + 1 }),
        });
        await sb('app_installs', {
          method: 'POST', headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ app_id: appId }),
        });
        return res.status(200).json({ ok: true });
      }

      case 'session_heartbeat': {
        const { user_id, session_token, page } = payload;
        if (!session_token) return res.status(400).json({ error: 'session_token required' });
        await sb('active_sessions?on_conflict=session_token', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({
            user_id: user_id || null,
            session_token: String(session_token).slice(0, 200),
            page: String(page || '/').slice(0, 300),
            last_ping: new Date().toISOString(),
          }),
        });
        // opportunistic cleanup of stale sessions (>2 min)
        await sb(`active_sessions?last_ping=lt.${encodeURIComponent(new Date(Date.now() - 120000).toISOString())}`, {
          method: 'DELETE', headers: { Prefer: 'return=minimal' },
        });
        return res.status(200).json({ ok: true });
      }

      case 'session_end': {
        const { session_token } = payload;
        if (!session_token) return res.status(400).json({ error: 'session_token required' });
        await sb(`active_sessions?session_token=eq.${encodeURIComponent(session_token)}`, {
          method: 'DELETE', headers: { Prefer: 'return=minimal' },
        });
        return res.status(200).json({ ok: true });
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
