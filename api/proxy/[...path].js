// Secure server-side proxy for the admin panel.
// The Supabase service_role key and admin password live ONLY here (Vercel serverless
// runtime) and are never sent to the browser. The client sends the admin password as
// the x-admin-password header; we verify it, then forward the request to Supabase
// (REST or GoTrue admin API) with the real service_role key injected.

export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  const password = req.headers['x-admin-password'];
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const pathParts = req.query.path;
  const path = Array.isArray(pathParts) ? pathParts.join('/') : (pathParts || '');
  const qsIndex = req.url.indexOf('?');
  const qs = qsIndex >= 0 ? req.url.slice(qsIndex) : '';
  const target = `${process.env.SUPABASE_URL}/${path}${qs}`;

  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': req.headers['content-type'] || 'application/json',
  };
  if (req.headers['prefer']) headers['Prefer'] = req.headers['prefer'];
  if (req.headers['range']) headers['Range'] = req.headers['range'];

  const init = { method: req.method, headers };
  if (!['GET', 'HEAD'].includes(req.method)) {
    const raw = await readRawBody(req);
    if (raw.length) init.body = raw;
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
