import type { Session } from '@supabase/supabase-js';
import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../data/supabaseClient';
import { AuthContext, type AuthState } from './AuthContext';

function redirectUrl(): string {
  return window.location.origin + import.meta.env.BASE_URL;
}

function cleanAuthQueryParams() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('code') && !url.searchParams.has('error')) return;
  url.searchParams.delete('code');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');
  window.history.replaceState({}, '', url.toString());
}

const IDENTITY_EXISTS = 'identity_already_exists';

/** Supabase sends the user back with this error in the URL when a Google link fails because the identity is taken. */
function urlHasLinkConflict(): boolean {
  return new URLSearchParams(window.location.search).get('error_code') === IDENTITY_EXISTS;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => supabase !== null);
  const [googleLinkConflict, setGoogleLinkConflict] = useState(urlHasLinkConflict);

  useEffect(() => {
    if (!googleLinkConflict) return;
    // Clear the error from the address and send the guest to the Account screen, where the message is shown.
    const url = new URL(window.location.href);
    for (const key of ['error', 'error_code', 'error_description']) url.searchParams.delete(key);
    url.hash = '#/account';
    window.history.replaceState({}, '', url.toString());
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session) cleanAuthQueryParams();
    });

    const { data: subscription } = client.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
      if (event === 'SIGNED_IN' && nextSession) cleanAuthQueryParams();
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const isGuest = session?.user.is_anonymous === true;

  // After confirming the email in another tab, refresh so the guest flag clears.
  useEffect(() => {
    if (!supabase || !isGuest) return;
    const client = supabase;
    const onFocus = () => void client.auth.refreshSession();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [isGuest]);

  async function signInWithGoogle() {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl() },
    });
    if (error) throw error;
  }

  async function signInWithPassword(email: string, password: string) {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUpWithPassword(email: string, password: string) {
    if (!supabase) return;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl() },
    });
    if (error) throw error;
  }

  async function sendPasswordReset(email: string) {
    if (!supabase) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectUrl()}#/reset-password`,
    });
    if (error) throw error;
  }

  async function updatePassword(password: string) {
    if (!supabase) return;
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function continueAsGuest() {
    if (!supabase) return;
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }

  async function saveWithEmail(email: string, password: string) {
    if (!supabase) return;
    const { error } = await supabase.auth.updateUser({ email, password }, { emailRedirectTo: redirectUrl() });
    if (error) throw error;
  }

  async function saveWithGoogle() {
    if (!supabase) return;
    setGoogleLinkConflict(false);
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo: redirectUrl() },
    });
    if (!error) return;
    if ((error as { code?: string }).code === IDENTITY_EXISTS) {
      setGoogleLinkConflict(true);
      return;
    }
    throw error;
  }

  async function switchToGoogleAccount() {
    await signOut();
    await signInWithGoogle();
  }

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    loading,
    isGuest,
    googleLinkConflict,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    sendPasswordReset,
    updatePassword,
    signOut,
    continueAsGuest,
    saveWithEmail,
    saveWithGoogle,
    dismissGoogleLinkConflict: () => setGoogleLinkConflict(false),
    switchToGoogleAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
