import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, track, isSupabaseReady } from '../lib/supabase';

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
  const [welcomeBackName, setWelcomeBackName] = useState(null);
  const [needsPhone, setNeedsPhone] = useState(false);
  const pingRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const hasHydratedRef = useRef(false);
  const loggedOauthRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseReady) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user).then((p) => {
          // Only show "welcome back" on the initial page hydration, not on a
          // fresh sign-in (that already gets the feedback popup) or refreshes.
          if (!hasHydratedRef.current) {
            const name = p?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
            setWelcomeBackName(name || 'back');
          }
          if (p && !p.phone) setNeedsPhone(true);
        });
        startPing(session.user.id);
      }
      hasHydratedRef.current = true;
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user).then(async (p) => {
          // First-time Google sign-in: no profile row yet, create one
          if (!p) {
            const meta = session.user.user_metadata || {};
            const { data: created } = await supabase.from('profiles').upsert({
              id: session.user.id,
              full_name: meta.full_name || meta.name || session.user.email?.split('@')[0],
              email: session.user.email,
              avatar_url: meta.avatar_url || meta.picture || null,
              is_admin: false,
              is_publisher: false,
              publisher_limit: 5,
              created_at: new Date().toISOString(),
              last_seen: new Date().toISOString(),
            }).select().single();
            if (created) setProfile(created);
            setNeedsPhone(true);
          } else if (!p.phone) {
            setNeedsPhone(true);
          }

          // Log Google OAuth logins once per session (password logins are logged in signIn())
          if (event === 'SIGNED_IN' && session.user.app_metadata?.provider === 'google' && !loggedOauthRef.current) {
            loggedOauthRef.current = true;
            try {
              const location = await fetchLocation();
              const ua = navigator.userAgent || '';
              const deviceType = /Mobile|Android|iPhone|iPad/.test(ua) ? 'Mobile' : 'Desktop';
              const browser = /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : /Edge/.test(ua) ? 'Edge' : 'Unknown';
              await supabase.from('login_logs').insert([{
                user_id: session.user.id,
                email: session.user.email,
                full_name: p?.full_name || session.user.user_metadata?.full_name || null,
                phone: p?.phone || null,
                ip_address: location?.ip || null,
                country: location?.country || null,
                city: location?.city || null,
                region: location?.region || null,
                device_type: deviceType,
                browser,
                user_agent: ua.slice(0, 200),
                logged_in_at: new Date().toISOString(),
                provider: 'google',
              }]);
            } catch (e) { console.warn('OAuth login log failed:', e); }
          }
        });
        startPing(session.user.id);
      } else {
        setProfile(null); setIsAdmin(false); setIsPublisher(false); setNeedsPhone(false);
        loggedOauthRef.current = false;
        stopPing();
      }
    });
    return () => { subscription.unsubscribe(); stopPing(); };
  }, []);

  const fetchProfile = async (u) => {
    if (!u || !supabase) return null;
    const { data } = await supabase.from('profiles').select('*').eq('id', u.id).single();
    if (data) {
      setProfile(data);
      setIsAdmin(data?.is_admin === true);
      setIsPublisher(data?.is_publisher === true);
    }
    return data;
  };

  // Ping active sessions every 30s
  const startPing = async (userId) => {
    stopPing();
    const token = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    sessionTokenRef.current = token;

    const doPing = (page = window.location.pathname) => {
      track('session_heartbeat', { user_id: userId, session_token: token, page });
    };

    doPing();
    pingRef.current = setInterval(() => doPing(window.location.pathname), 30000);
  };

  const stopPing = async () => {
    if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
    if (sessionTokenRef.current) {
      track('session_end', { session_token: sessionTokenRef.current });
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
          provider: 'password',
        }]);
      } catch (logErr) {
        console.warn('Login log failed:', logErr);
      }
    }
    return result;
  };

  // Google OAuth sign-in — redirects to Google, then back to the app.
  const signInWithGoogle = async () => {
    if (!supabase) return { error: new Error('Supabase not configured') };
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' },
    });
  };

  const savePhone = async (phone) => {
    if (!user || !phone.trim()) return { error: new Error('No phone provided') };
    const { error } = await supabase.from('profiles').update({ phone: phone.trim() }).eq('id', user.id);
    if (!error) {
      setProfile(prev => ({ ...prev, phone: phone.trim() }));
      setNeedsPhone(false);
    }
    return { error };
  };

  const dismissPhonePrompt = () => setNeedsPhone(false);

  const signOut = async () => {
    await stopPing();
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setIsAdmin(false); setIsPublisher(false);
  };

  const dismissWelcomeBack = () => setWelcomeBackName(null);

  return (
    <AuthContext.Provider value={{
      user, profile, loading, isAdmin, isPublisher,
      signUp, signIn, signInWithGoogle, signOut, isSupabaseReady,
      welcomeBackName, dismissWelcomeBack,
      needsPhone, savePhone, dismissPhonePrompt,
      refreshProfile: () => user && fetchProfile(user)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
