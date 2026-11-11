export interface UserProfile {
  id: string; // Supabase auth.users UUID
  email: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
  lastSignIn?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
  created_at?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: AuthUser;
}

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
}
