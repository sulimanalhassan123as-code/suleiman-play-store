// Public AI proxy — keeps the Groq API key server-side only. No password needed
// (this is a regular visitor-facing feature), but the key never reaches the browser.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { prompt, systemPrompt } = body || {};
  if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'prompt required' });

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) return res.status(200).json({ content: null });

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: systemPrompt || 'You are Clock AI, a helpful Islamic knowledge assistant for the Suleiman Play Store community. Answer questions about Islam, apps, and technology. Keep answers concise and respectful. Always say JazakAllah or relevant Islamic greeting.' },
          { role: 'user', content: String(prompt).slice(0, 4000) },
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });
    const data = await r.json();
    return res.status(200).json({ content: data.choices?.[0]?.message?.content || null });
  } catch (e) {
    return res.status(200).json({ content: null });
  }
}
