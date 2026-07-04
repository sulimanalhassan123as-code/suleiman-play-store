// Secure server-side proxy for the admin panel (fixed route, no dynamic segments —
// more reliable than a catch-all). The Supabase service_role key and admin password
// live ONLY here (Vercel serverless runtime) and are never sent to the browser.
// The client sends { path, method, body, headers } + the admin password header;
// we verify the password, then forward to Supabase (REST or GoTrue admin API)
// with the real service_role key injected.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const password = req.headers['x-admin-password'];
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  let reqBody = req.body;
  if (typeof reqBody === 'string') { try { reqBody = JSON.parse(reqBody); } catch { reqBody = {}; } }
  const { path, method = 'GET', body, headers: extraHeaders = {} } = reqBody || {};
  if (!path) return res.status(400).json({ message: 'path required' });

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const target = `${process.env.SUPABASE_URL}/${path}`;

  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (extraHeaders.prefer) headers['Prefer'] = extraHeaders.prefer;
  if (extraHeaders.range) headers['Range'] = extraHeaders.range;

  const init = { method, headers };
  if (!['GET', 'HEAD'].includes(method) && body != null) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const r = await fetch(target, init);
    const text = await r.text();
    res.status(r.status);
    const ct = r.headers.get('content-type');
    if (ct) res.setHeader('content-type', ct);
    res.send(text);
  } catch (e) {
    res.status(500).json({ message: e.message || 'Proxy error' });
  }
}
