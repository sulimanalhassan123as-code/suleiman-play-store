const CLOCK_AI_NAME = "Clock AI 🤖";
const CLOCK_AI_AVATAR = "🤖";

const islamicAnswers = {
  prayer: "Prayer times vary by location. Use our Prayer Times Pro app for accurate timings. Generally: Fajr before sunrise, Dhuhr midday, Asr afternoon, Maghrib after sunset, Isha at night.",
  zakat: "Zakat is 2.5% of your total savings held for a full lunar year, provided it exceeds the nisab threshold (equivalent of 85g of gold or 595g of silver). Use our Islamic Finance Calc app for precise calculations.",
  quran: "The Qur'an has 114 Surahs, 30 Juz, and 6,236 verses. For deep understanding, try our Quran AI Tafsir app for verse-by-verse explanations.",
  default: [
    "JazakAllah Khair for your question! Our scholars are reviewing this. In the meantime, try our Islamic AI Assistant app for instant answers.",
    "Great question! This is being reviewed by our community. You can also check Islamic Google for scholarly resources on this topic.",
    "Alhamdulillah, a wonderful question! Our AI is processing this. Check out our Islamic AI Assistant for detailed answers powered by Groq AI.",
    "BarakAllah feek! Your question has been noted. Our community experts will respond shortly. Meanwhile, our apps can help you explore this topic further.",
  ]
};

export function getClockAIResponse(question) {
  const q = question.toLowerCase();
  if (q.includes('prayer') || q.includes('salah') || q.includes('namaz')) return islamicAnswers.prayer;
  if (q.includes('zakat') || q.includes('zakah')) return islamicAnswers.zakat;
  if (q.includes('quran') || q.includes('qur')) return islamicAnswers.quran;
  const idx = Math.floor(Math.random() * islamicAnswers.default.length);
  return islamicAnswers.default[idx];
}

export const FAKE_USERS = [
  { name: "Abdullah M.", avatar: "👨‍🦱" },
  { name: "Fatimah K.", avatar: "👩‍🦳" },
  { name: "Usman H.", avatar: "👨‍🦲" },
  { name: "Aisha R.", avatar: "👩‍🦱" },
  { name: "Ibrahim J.", avatar: "🧔" },
];

export function getFakeUserReply(question) {
  const replies = [
    "MashaAllah, great question brother/sister! I was wondering the same thing.",
    "JazakAllah Khair for asking this, very beneficial for the community.",
    "Alhamdulillah! This is exactly what I needed to know.",
    "SubhanAllah, I learned something new today. BarakAllah feek!",
    "This is a very important topic. May Allah give us all guidance. Ameen.",
  ];
  const user = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)];
  const reply = replies[Math.floor(Math.random() * replies.length)];
  return { user, reply };
}

export { CLOCK_AI_NAME, CLOCK_AI_AVATAR };
