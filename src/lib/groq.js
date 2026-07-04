// Client no longer holds the Groq key — every ask routes through /api/ai,
// which injects the real key server-side only.
export const isGroqReady = true;

export async function askGroq(prompt, systemPrompt = '') {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemPrompt }),
    });
    const data = await res.json();
    return data.content || getOfflineResponse(prompt);
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
