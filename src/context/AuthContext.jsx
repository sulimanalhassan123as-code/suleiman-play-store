import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, supabaseAdmin, isSupabaseReady } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isSupabaseReady) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      else { setProfile(null); setIsAdmin(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (u) => {
    if (!u) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', u.id).single();
    setProfile(data);
    setIsAdmin(data?.is_admin === true);
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
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString()
      });
    }
    return { data, error };
  };

  const signIn = async (email, password) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (!result.error && result.data.user) {
      // Update last_seen on login
      await supabase.from('profiles').update({ last_seen: new Date().toISOString() })
        .eq('id', result.data.user.id);
    }
    return result;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading, isAdmin,
      signUp, signIn, signOut, isSupabaseReady
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
