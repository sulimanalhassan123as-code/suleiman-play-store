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
    <div style={{ padding: '0 0 8px' }}>
      {/* Header */}
      <div style={{ padding: '18px 16px 12px' }}>
        <h2 style={{ color: theme.text, fontSize: 22, fontWeight: 800, margin: 0 }}>💬 Community</h2>
        <p style={{ color: theme.subtext, fontSize: 13, margin: '4px 0 0' }}>Ask questions · Share knowledge · Help each other</p>
      </div>

      {/* Ask Box — clean modern card */}
      <div style={{
        margin: '0 14px 16px',
        background: theme.cardBg,
        borderRadius: 18,
        padding: '14px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        border: `1px solid ${theme.accent}22`
      }}>
        <div style={{ color: theme.text, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>❓ Ask the Community</div>

        {/* Clean text input — NOT a textarea */}
        <div style={{
          background: theme.searchBg,
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 10,
          border: `1px solid ${theme.accent}33`,
          minHeight: 80,
          display: 'flex',
          alignItems: 'flex-start'
        }}>
          <input
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: theme.text,
              fontSize: 14,
              fontFamily: 'inherit',
              resize: 'none',
              lineHeight: 1.5
            }}
            placeholder="Post your question... 🤖 Clock AI will answer in 8 seconds"
            value={newQ}
            onChange={e => setNewQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitQuestion()}
          />
        </div>

        <button
          onClick={submitQuestion}
          disabled={!newQ.trim()}
          style={{
            width: '100%',
            background: newQ.trim() ? theme.accent : `${theme.accent}55`,
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '12px',
            fontSize: 14,
            fontWeight: 700,
            cursor: newQ.trim() ? 'pointer' : 'default',
            transition: 'all 0.2s',
            fontFamily: 'inherit'
          }}
        >
          🚀 Post Question
        </button>
      </div>

      {/* Posts List */}
      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posts.map(post => (
          <div key={post.id} style={{
            background: theme.cardBg,
            borderRadius: 18,
            padding: '14px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
            border: `1px solid ${theme.accent}18`
          }}>
            {/* Post header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{post.avatar}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ color: theme.text, fontWeight: 700, fontSize: 14 }}>{post.user_name}</span>
                  <span style={{ color: theme.subtext, fontSize: 11 }}>· {timeAgo(post.created_at)}</span>
                  {post.answers?.length > 0 && (
                    <span style={{
                      background: '#22c55e22',
                      color: '#22c55e',
                      borderRadius: 8,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 600
                    }}>✓ Answered</span>
                  )}
                </div>
              </div>
            </div>

            {/* Question */}
            <p style={{ color: theme.text, fontSize: 15, lineHeight: 1.5, margin: '0 0 12px' }}>{post.question}</p>

            {/* AI typing indicator */}
            {aiTyping === post.id && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px',
                background: `${theme.accent}18`,
                borderRadius: 10,
                marginBottom: 10,
                border: `1px solid ${theme.accent}44`
              }}>
                <span>🤖</span>
                <span style={{ color: theme.accent, fontSize: 13 }}>Clock AI is typing...</span>
              </div>
            )}

            {/* Action pills — inline, no boxes */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => likePost(post.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: `${theme.accent}15`,
                  color: theme.text,
                  border: 'none',
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                ❤️ {post.likes}
              </button>

              <button style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: `${theme.accent}15`,
                color: theme.text,
                border: 'none',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'default',
                fontFamily: 'inherit'
              }}>
                💬 {post.answers?.length || 0}
              </button>

              <button
                onClick={() => setActiveReply(activeReply === post.id ? null : post.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: activeReply === post.id ? theme.accent : `${theme.accent}15`,
                  color: activeReply === post.id ? '#fff' : theme.accent,
                  border: 'none',
                  borderRadius: 20,
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s'
                }}
              >
                ↩ Reply
              </button>
            </div>

            {/* Answers */}
            {post.answers?.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {post.answers.map(ans => (
                  <div key={ans.id} style={{
                    display: 'flex', gap: 10,
                    background: ans.isAI ? `${theme.accent}18` : theme.searchBg,
                    borderRadius: 12,
                    padding: '10px 12px',
                    border: ans.isAI ? `1px solid ${theme.accent}55` : 'none'
                  }}>
                    <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{ans.avatar}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ color: theme.text, fontWeight: 700, fontSize: 13 }}>{ans.user_name}</span>
                      <p style={{ color: theme.text, fontSize: 13, lineHeight: 1.5, margin: '3px 0 4px' }}>{ans.text}</p>
                      <span style={{ color: theme.subtext, fontSize: 11 }}>{timeAgo(ans.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply input */}
            {activeReply === post.id && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <input
                  style={{
                    flex: 1,
                    background: theme.searchBg,
                    color: theme.text,
                    border: `1px solid ${theme.accent}44`,
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontSize: 14,
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Write your answer..."
                  value={newAnswer[post.id] || ''}
                  onChange={e => setNewAnswer(prev => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && submitAnswer(post.id)}
                />
                <button
                  onClick={() => submitAnswer(post.id)}
                  style={{
                    background: theme.accent,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 16px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0,
                    fontFamily: 'inherit'
                  }}
                >Send</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
