import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseReady } from '../lib/supabase';
import { askGroq } from '../lib/groq';

const CLOCK_AI = { name: "Clock AI 🤖", avatar: "🤖" };

const LOCAL_POSTS = [
  { id: 1, user_name: "Abdullah M.", avatar: "👨‍🦱", created_at: new Date(Date.now()-7200000).toISOString(), question: "What is the best app for learning the Quran for beginners?", answers: [{ id: 1, user_name: "Fatimah K.", avatar: "👩‍🦳", text: "Juz Amma Pro Max is amazing for beginners! Start with Juz 30.", created_at: new Date(Date.now()-3600000).toISOString(), isAI: false, likes: 5 }], likes: 12 },
  { id: 2, user_name: "Usman H.", avatar: "👨‍🦲", created_at: new Date(Date.now()-14400000).toISOString(), question: "How do I calculate Zakat on my gold jewelry?", answers: [], likes: 8 }
];

export default function CommunityPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [posts, setPosts] = useState(LOCAL_POSTS);
  const [newQ, setNewQ] = useState('');
  const [newAnswer, setNewAnswer] = useState({});
  const [activeReply, setActiveReply] = useState(null);
  const [aiTyping, setAiTyping] = useState(null);

  const submitQuestion = async () => {
    if (!newQ.trim()) return;
    const post = {
      id: Date.now(), user_name: user?.user_metadata?.full_name || 'You',
      avatar: '😊', created_at: new Date().toISOString(),
      question: newQ, answers: [], likes: 0
    };
    setPosts(prev => [post, ...prev]);
    const q = newQ; setNewQ('');

    // Groq AI answers after 8 seconds
    setAiTyping(post.id);
    setTimeout(async () => {
      const aiReply = await askGroq(q);
      setPosts(prev => prev.map(p => p.id === post.id ? {
        ...p,
        answers: [...p.answers, { id: Date.now(), user_name: CLOCK_AI.name, avatar: CLOCK_AI.avatar, text: aiReply, created_at: new Date().toISOString(), isAI: true, likes: 0 }]
      } : p));
      setAiTyping(null);
    }, 8000);

    if (isSupabaseReady) {
      await supabase.from('community_posts').insert({ user_id: user?.id, user_name: post.user_name, question: q });
    }
  };

  const submitAnswer = (postId) => {
    const text = newAnswer[postId]; if (!text?.trim()) return;
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p, answers: [...p.answers, { id: Date.now(), user_name: user?.user_metadata?.full_name || 'You', avatar: '😊', text, created_at: new Date().toISOString(), likes: 0 }]
    } : p));
    setNewAnswer(prev => ({ ...prev, [postId]: '' }));
    setActiveReply(null);
  };

  const likePost = (id) => setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m/60)}h ago`;
    return `${Math.floor(m/1440)}d ago`;
  };

  return (
    <div className="community-page">
      <div className="community-header" style={{ color: theme.text }}>
        <h2>💬 Community</h2>
        <p style={{ color: theme.subtext }}>Ask questions · Share knowledge · Help each other</p>
      </div>

      <div className="ask-box" style={{ background: theme.cardBg, border: `1px solid ${theme.accent}33` }}>
        <div className="ask-header" style={{ color: theme.text }}>❓ Ask the Community</div>
        <textarea className="ask-input"
          style={{ background: theme.searchBg, color: theme.text, border: `1px solid ${theme.accent}33` }}
          placeholder="Post your question... Clock AI (Groq) will answer in 8 seconds 🤖"
          value={newQ} onChange={e => setNewQ(e.target.value)} rows={3} />
        <button className="ask-btn" style={{ background: theme.accent }} onClick={submitQuestion} disabled={!newQ.trim()}>
          Post Question 🚀
        </button>
      </div>

      <div className="posts-list">
        {posts.map(post => (
          <div key={post.id} className="post-card" style={{ background: theme.cardBg, border: `1px solid ${theme.accent}22` }}>
            <div className="post-user">
              <span className="post-avatar">{post.avatar}</span>
              <div>
                <span className="post-username" style={{ color: theme.text }}>{post.user_name}</span>
                <span className="post-time" style={{ color: theme.subtext }}> · {timeAgo(post.created_at)}</span>
              </div>
              {post.answers?.length > 0 && <span className="answered-badge">✓ Answered</span>}
            </div>
            <p className="post-question" style={{ color: theme.text }}>{post.question}</p>

            {aiTyping === post.id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: theme.accent + '22', borderRadius: 10, margin: '8px 0', border: `1px solid ${theme.accent}66` }}>
                <span>🤖</span>
                <span style={{ color: theme.accent, fontSize: 13 }}>Clock AI is typing...</span>
                <span style={{ animation: 'pulse 1s infinite', color: theme.accent }}>●●●</span>
              </div>
            )}

            <div className="post-actions">
              <button className="action-btn" style={{ color: theme.subtext }} onClick={() => likePost(post.id)}>❤️ {post.likes}</button>
              <button className="action-btn" style={{ color: theme.subtext }}>💬 {post.answers?.length || 0}</button>
              <button className="action-btn reply-btn" style={{ color: theme.accent }} onClick={() => setActiveReply(activeReply === post.id ? null : post.id)}>↩ Reply</button>
            </div>

            {post.answers?.length > 0 && (
              <div className="answers-list">
                {post.answers.map(ans => (
                  <div key={ans.id} className={`answer-item ${ans.isAI ? 'ai-answer' : ''}`}
                    style={{ background: ans.isAI ? theme.accent + '22' : theme.searchBg, border: ans.isAI ? `1px solid ${theme.accent}` : 'none' }}>
                    <span className="post-avatar" style={{ fontSize: 16 }}>{ans.avatar}</span>
                    <div>
                      <span className="post-username" style={{ color: theme.text, fontSize: 13 }}>{ans.user_name}</span>
                      <p className="answer-text" style={{ color: theme.text }}>{ans.text}</p>
                      <span style={{ color: theme.subtext, fontSize: 11 }}>{timeAgo(ans.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeReply === post.id && (
              <div className="reply-box">
                <input className="reply-input"
                  style={{ background: theme.searchBg, color: theme.text, border: `1px solid ${theme.accent}55` }}
                  placeholder="Write your answer..."
                  value={newAnswer[post.id] || ''}
                  onChange={e => setNewAnswer(prev => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && submitAnswer(post.id)} />
                <button className="reply-send-btn" style={{ background: theme.accent }} onClick={() => submitAnswer(post.id)}>Send</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
