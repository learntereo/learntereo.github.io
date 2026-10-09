import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext } from 'react';

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** Signed in with an anonymous (guest) account that has not been saved yet. */
  isGuest: boolean;
  /** Google reported the identity already belongs to another Ako account. */
  googleLinkConflict: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  /** Adds an email and password to the guest account. The email must be confirmed before the account is saved. */
  saveWithEmail: (email: string, password: string) => Promise<void>;
  saveWithGoogle: () => Promise<void>;
  dismissGoogleLinkConflict: () => void;
  /** Leaves the guest account behind and signs in with Google. */
  switchToGoogleAccount: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
