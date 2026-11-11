import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { AuthSession, AuthUser, UserProfile } from '../types/auth';

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  simulateUser: (userType: 'A' | 'B' | 'C') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_AUTH_STORAGE_KEY = 'pfh_auth_local_session';
const REMEMBER_ME_KEY = 'pfh_auth_remember_me';

// Pre-configured simulated users for rapid testing of Multi-Tenant isolation
export const SIMULATED_USERS: Record<'A' | 'B' | 'C', { user: AuthUser; profile: UserProfile }> = {
  A: {
    user: {
      id: 'usr-sim-a-carlos-mendes-001',
      email: 'carlos.mendes@executivo.com.br',
      user_metadata: {
        full_name: 'Carlos Eduardo Mendes',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      created_at: '2026-01-10T09:00:00Z',
    },
    profile: {
      id: 'usr-sim-a-carlos-mendes-001',
      email: 'carlos.mendes@executivo.com.br',
      fullName: 'Carlos Eduardo Mendes',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-01-10T09:00:00Z',
      lastSignIn: new Date().toISOString(),
    },
  },
  B: {
    user: {
      id: 'usr-sim-b-beatriz-sampaio-002',
      email: 'beatriz.sampaio@medicina.com.br',
      user_metadata: {
        full_name: 'Dra. Beatriz Sampaio',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      },
      created_at: '2026-02-15T14:30:00Z',
    },
    profile: {
      id: 'usr-sim-b-beatriz-sampaio-002',
      email: 'beatriz.sampaio@medicina.com.br',
      fullName: 'Dra. Beatriz Sampaio',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-02-15T14:30:00Z',
      lastSignIn: new Date().toISOString(),
    },
  },
  C: {
    user: {
      id: 'usr-sim-c-roberto-tech-003',
      email: 'roberto@techventures.io',
      user_metadata: {
        full_name: 'Roberto Albuquerque',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
      created_at: '2026-03-01T11:20:00Z',
    },
    profile: {
      id: 'usr-sim-c-roberto-tech-003',
      email: 'roberto@techventures.io',
      fullName: 'Roberto Albuquerque',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-03-01T11:20:00Z',
      lastSignIn: new Date().toISOString(),
    },
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to load profile from Supabase
  const loadSupabaseProfile = async (userId: string, email: string, defaultName?: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setProfile({
          id: data.id,
          email: data.email || email,
          fullName: data.full_name || defaultName || email.split('@')[0],
          avatarUrl: data.avatar_url,
          createdAt: data.created_at,
          lastSignIn: new Date().toISOString(),
        });
      } else {
        // Create initial profile if missing
        const newProfile: UserProfile = {
          id: userId,
          email,
          fullName: defaultName || email.split('@')[0],
          createdAt: new Date().toISOString(),
        };
        await supabase.from('profiles').upsert({
          id: userId,
          email,
          full_name: newProfile.fullName,
          created_at: newProfile.createdAt,
        });
        setProfile(newProfile);
      }
    } catch (err) {
      console.warn('Erro ao carregar perfil do Supabase:', err);
    }
  };

  // Check initial session
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setLoading(true);
      const supabase = getSupabaseClient();

      if (supabase) {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession?.user && isMounted) {
            const mappedUser: AuthUser = {
              id: currentSession.user.id,
              email: currentSession.user.email || '',
              user_metadata: currentSession.user.user_metadata,
              created_at: currentSession.user.created_at,
            };
            setUser(mappedUser);
            setSession({
              access_token: currentSession.access_token,
              refresh_token: currentSession.refresh_token,
              expires_at: currentSession.expires_at,
              user: mappedUser,
            });
            await loadSupabaseProfile(
              mappedUser.id,
              mappedUser.email,
              mappedUser.user_metadata?.full_name
            );
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Erro ao obter sessão Supabase:', err);
        }

        // Listen to auth changes in Supabase
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!isMounted) return;

            if (newSession?.user) {
              const mappedUser: AuthUser = {
                id: newSession.user.id,
                email: newSession.user.email || '',
                user_metadata: newSession.user.user_metadata,
                created_at: newSession.user.created_at,
              };
              setUser(mappedUser);
              setSession({
                access_token: newSession.access_token,
                refresh_token: newSession.refresh_token,
                expires_at: newSession.expires_at,
                user: mappedUser,
              });
              await loadSupabaseProfile(
                mappedUser.id,
                mappedUser.email,
                mappedUser.user_metadata?.full_name
              );
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setProfile(null);
              setSession(null);
            }
            setLoading(false);
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      }

      // Check local persisted session
      try {
        const storedLocal = localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
        if (storedLocal && isMounted) {
          const parsed = JSON.parse(storedLocal);
          if (parsed.user && parsed.profile) {
            setUser(parsed.user);
            setProfile(parsed.profile);
            setSession(parsed.session || null);
          }
        }
      } catch (err) {
        console.error('Erro ao ler sessão local:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save/clean local session fallback
  const persistLocalSession = (usr: AuthUser | null, prof: UserProfile | null, sess: AuthSession | null) => {
    if (usr && prof) {
      localStorage.setItem(
        LOCAL_AUTH_STORAGE_KEY,
        JSON.stringify({ user: usr, profile: prof, session: sess })
      );
    } else {
      localStorage.removeItem(LOCAL_AUTH_STORAGE_KEY);
    }
  };

  // Sign In with Email & Password
  const signInWithEmail = async (email: string, password: string, rememberMe = true) => {
    setError(null);
    const supabase = getSupabaseClient();

    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
    }

    // Try Supabase Auth first
    if (supabase) {
      try {
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (sbError) {
          return { success: false, error: sbError.message };
        }

        if (data.user) {
          const mappedUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || email,
            user_metadata: data.user.user_metadata,
            created_at: data.user.created_at,
          };
          setUser(mappedUser);
          if (data.session) {
            setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at,
              user: mappedUser,
            });
          }
          await loadSupabaseProfile(mappedUser.id, mappedUser.email, mappedUser.user_metadata?.full_name);
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Supabase Auth error, using fallback:', err);
      }
    }

    // Fallback: local user authentication (e.g. if Supabase is offline or not configured)
    const storedUsersRaw = localStorage.getItem('pfh_registered_users_db');
    const registeredUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : {};

    const found = registeredUsers[email.toLowerCase().trim()];
    if (found && found.password === password) {
      const authUser: AuthUser = {
        id: found.id,
        email: found.email,
        user_metadata: { full_name: found.fullName },
        created_at: found.createdAt,
      };
      const userProfile: UserProfile = {
        id: found.id,
        email: found.email,
        fullName: found.fullName,
        createdAt: found.createdAt,
        lastSignIn: new Date().toISOString(),
      };
      setUser(authUser);
      setProfile(userProfile);
      persistLocalSession(authUser, userProfile, null);
      return { success: true };
    }

    // Check if matching simulated users
    for (const key of ['A', 'B', 'C'] as const) {
      const sim = SIMULATED_USERS[key];
      if (sim.user.email.toLowerCase() === email.toLowerCase().trim()) {
        setUser(sim.user);
        setProfile(sim.profile);
        persistLocalSession(sim.user, sim.profile, null);
        return { success: true };
      }
    }

    return {
      success: false,
      error: 'E-mail ou senha incorretos. Verifique suas credenciais ou crie uma nova conta.',
    };
  };

  // Sign Up with Email & Password
  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    setError(null);
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { data, error: sbError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (sbError) {
          return { success: false, error: sbError.message };
        }

        if (data.user) {
          const mappedUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || email,
            user_metadata: { full_name: fullName },
            created_at: data.user.created_at,
          };
          const newProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            fullName: fullName.trim(),
            createdAt: new Date().toISOString(),
          };

          // If session was established immediately (no confirm required)
          if (data.session) {
            setUser(mappedUser);
            setProfile(newProfile);
            setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at,
              user: mappedUser,
            });
            await loadSupabaseProfile(mappedUser.id, mappedUser.email, fullName);
            return { success: true };
          }

          // If confirmation email is required
          return {
            success: true,
            message: 'Conta criada com sucesso! Verifique seu e-mail para confirmar seu cadastro ou faça login.',
          };
        }
      } catch (err: any) {
        console.warn('Supabase SignUp error, creating local isolated account:', err);
      }
    }

    // Fallback: register in local multi-tenant database
    const storedUsersRaw = localStorage.getItem('pfh_registered_users_db');
    const registeredUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : {};

    const cleanEmail = email.toLowerCase().trim();
    if (registeredUsers[cleanEmail]) {
      return { success: false, error: 'Este e-mail já está cadastrado no sistema.' };
    }

    const newUserId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newRecord = {
      id: newUserId,
      email: cleanEmail,
      fullName: fullName.trim(),
      password,
      createdAt: new Date().toISOString(),
    };

    registeredUsers[cleanEmail] = newRecord;
    localStorage.setItem('pfh_registered_users_db', JSON.stringify(registeredUsers));

    const authUser: AuthUser = {
      id: newUserId,
      email: cleanEmail,
      user_metadata: { full_name: fullName.trim() },
      created_at: newRecord.createdAt,
    };
    const userProfile: UserProfile = {
      id: newUserId,
      email: cleanEmail,
      fullName: fullName.trim(),
      createdAt: newRecord.createdAt,
      lastSignIn: new Date().toISOString(),
    };

    setUser(authUser);
    setProfile(userProfile);
    persistLocalSession(authUser, userProfile, null);

    return { success: true };
  };

  // Sign In with Google OAuth
  const signInWithGoogle = async () => {
    setError(null);
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { error: sbError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (sbError) {
          return { success: false, error: sbError.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Erro ao iniciar login com Google.' };
      }
    }

    // If Supabase credentials are not configured yet, notify user with clear instructions
    return {
      success: false,
      error: 'Para login com Google OAuth, conecte o Supabase em Configurações > Conectar Supabase e ative o provedor Google no painel Supabase.',
    };
  };

  // Password Reset
  const resetPassword = async (email: string) => {
    setError(null);
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { error: sbError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (sbError) {
          return { success: false, error: sbError.message };
        }
        return {
          success: true,
          message: 'Instruções de recuperação foram enviadas para o seu e-mail.',
        };
      } catch (err: any) {
        return { success: false, error: err.message || 'Erro ao enviar e-mail de recuperação.' };
      }
    }

    return {
      success: true,
      message: 'Link de recuperação simulado enviado com sucesso para ' + email + '.',
    };
  };

  // Sign Out
  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Erro ao sair no Supabase:', err);
      }
    }

    setUser(null);
    setProfile(null);
    setSession(null);
    persistLocalSession(null, null, null);
  };

  // Update Profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { success: false, error: 'Nenhum usuário conectado.' };

    const updatedProfile: UserProfile = {
      ...(profile || {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || user.email.split('@')[0],
        createdAt: new Date().toISOString(),
      }),
      ...updates,
    };

    setProfile(updatedProfile);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: updatedProfile.fullName,
          avatar_url: updatedProfile.avatarUrl,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Erro ao atualizar perfil no Supabase:', err);
      }
    }

    persistLocalSession(user, updatedProfile, session);
    return { success: true };
  };

  // 1-Click Simulation for Requirement 8 (Testing multi-user isolation across 3 users)
  const simulateUser = (userType: 'A' | 'B' | 'C') => {
    const target = SIMULATED_USERS[userType];
    setUser(target.user);
    setProfile(target.profile);
    setSession(null);
    persistLocalSession(target.user, target.profile, null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        error,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        resetPassword,
        signOut,
        updateProfile,
        simulateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
