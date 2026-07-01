import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, supabaseAdmin, isSupabaseReady } from '../lib/supabase';

const AuthContext = createContext();

// Fetch approximate location from IP
async function fetchLocation() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return null;
    const d = await res.json();
    return {
      country: d.country_name || null,
      city: d.city || null,
      region: d.region || null,
      ip: d.ip || null,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPublisher, setIsPublisher] = useState(false);
  const pingRef = useRef(null);
  const sessionTokenRef = useRef(null);

  useEffect(() => {
    if (!isSupabaseReady) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
        startPing(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
        startPing(session.user.id);
      } else {
        setProfile(null); setIsAdmin(false); setIsPublisher(false);
        stopPing();
      }
    });
    return () => { subscription.unsubscribe(); stopPing(); };
  }, []);

  const fetchProfile = async (u) => {
    if (!u || !supabase) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', u.id).single();
    if (data) {
      setProfile(data);
      setIsAdmin(data?.is_admin === true);
      setIsPublisher(data?.is_publisher === true);
    }
  };

  // Ping active sessions every 30s
  const startPing = async (userId) => {
    stopPing();
    if (!supabaseAdmin) return;
    const token = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    sessionTokenRef.current = token;

    const doPing = async (page = window.location.pathname) => {
      await supabaseAdmin.from('active_sessions').upsert({
        user_id: userId,
        session_token: token,
        page,
        last_ping: new Date().toISOString()
      }, { onConflict: 'session_token' });
    };

    doPing();
    pingRef.current = setInterval(() => doPing(window.location.pathname), 30000);

    // Clean up stale sessions > 2 min old
    await supabaseAdmin.from('active_sessions')
      .delete()
      .lt('last_ping', new Date(Date.now() - 120000).toISOString());
  };

  const stopPing = async () => {
    if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
    if (sessionTokenRef.current && supabaseAdmin) {
      await supabaseAdmin.from('active_sessions').delete().eq('session_token', sessionTokenRef.current);
      sessionTokenRef.current = null;
    }
  };

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    });
    if (!error && data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        email,
        is_admin: false,
        is_publisher: false,
        publisher_limit: 5,
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString()
      });
    }
    return { data, error };
  };

  const signIn = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (!result.error && result.data.user) {
      // Update last seen
      await supabase.from('profiles').update({ last_seen: new Date().toISOString() })
        .eq('id', result.data.user.id);

      // Log the login with location + device info for admin tracking
      try {
        const location = await fetchLocation();
        const ua = navigator.userAgent || '';
        const deviceType = /Mobile|Android|iPhone|iPad/.test(ua) ? 'Mobile' : 'Desktop';
        const browser = /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : /Edge/.test(ua) ? 'Edge' : 'Unknown';

        // Fetch phone from profiles
        const { data: profileData } = await supabase.from('profiles').select('phone, full_name').eq('id', result.data.user.id).single();

        await supabase.from('login_logs').insert([{
          user_id: result.data.user.id,
          email: result.data.user.email,
          full_name: profileData?.full_name || result.data.user.user_metadata?.full_name || null,
          phone: profileData?.phone || null,
          ip_address: location?.ip || null,
          country: location?.country || null,
          city: location?.city || null,
          region: location?.region || null,
          device_type: deviceType,
          browser,
          user_agent: ua.slice(0, 200),
          logged_in_at: new Date().toISOString(),
        }]);
      } catch (logErr) {
        console.warn('Login log failed:', logErr);
      }
    }
    return result;
  };

  const signOut = async () => {
    await stopPing();
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setIsAdmin(false); setIsPublisher(false);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading, isAdmin, isPublisher,
      signUp, signIn, signOut, isSupabaseReady,
      refreshProfile: () => user && fetchProfile(user)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
