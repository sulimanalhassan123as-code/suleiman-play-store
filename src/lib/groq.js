const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export const isGroqReady = !!GROQ_KEY;

export async function askGroq(prompt, systemPrompt = '') {
  if (!GROQ_KEY) {
    return getOfflineResponse(prompt);
  }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: systemPrompt || 'You are Clock AI, a helpful Islamic knowledge assistant for the Suleiman Play Store community. Answer questions about Islam, apps, and technology. Keep answers concise and respectful. Always say JazakAllah or relevant Islamic greeting.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || getOfflineResponse(prompt);
  } catch (e) {
    return getOfflineResponse(prompt);
  }
}

function getOfflineResponse(q) {
  const lower = q.toLowerCase();
  if (lower.includes('prayer') || lower.includes('salah')) return "Prayer times vary by location. Use our Prayer Times Pro app for accurate timings based on your GPS location. The five daily prayers are Fajr, Dhuhr, Asr, Maghrib, and Isha. JazakAllah Khair!";
  if (lower.includes('zakat')) return "Zakat is 2.5% of your total savings held for a full lunar year above the nisab threshold (85g gold or 595g silver). Use our Islamic Finance Calc app for precise calculations. BarakAllah feek!";
  if (lower.includes('quran') || lower.includes('qur')) return "The Holy Qur'an has 114 Surahs and 6,236 verses. Try our Quran AI Tafsir app for deep verse-by-verse explanations powered by AI. May Allah bless your journey!";
  if (lower.includes('app') || lower.includes('store')) return "Suleiman Play Store has 11+ apps across Islamic, AI, Business and Tools categories. All built by Never Hide Tech Empire. JazakAllah Khair for your question!";
  return "JazakAllah Khair for your question! Our Clock AI is processing your query. In the meantime, explore our Islamic AI Assistant app for instant Groq-powered answers. BarakAllah feek! 🤖";
}
