
// Authentication Helper using Supabase Auth
import { supabase } from './supabase/client';

export interface LoginCredentials {
  username: string;
  password: string;
}

export async function signIn(credentials: LoginCredentials) {
  // ✅ SECURITY FIX: Prevent username enumeration via timing attacks
  const startTime = Date.now();
  let success = false;
  let user = null;

  try {
    // Always perform database lookup (even if it might fail)
    const { data: userData } = await supabase
      .from('users')
      .select('email, username')
      .ilike('username', credentials.username)
      .single();

    // Use dummy email if user not found to maintain constant timing
    const emailToUse = userData?.email || 'nonexistent@dummy.local';

    // Always attempt authentication (even with dummy email)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: credentials.password,
    });

    // Only mark as successful if both user exists AND auth succeeded
    if (!error && userData) {
      success = true;
      user = data.user;
    }

  } catch (error: any) {
    // Silently catch errors to prevent information leakage
    // Do not log specific error details
  }

  // Add constant delay to prevent timing attacks (300ms)
  const elapsed = Date.now() - startTime;
  const minDelay = 300;
  if (elapsed < minDelay) {
    await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
  }

  // Always return same error message (no indication of what failed)
  if (!success) {
    return { success: false, error: 'Invalid credentials' };
  }

  return { success: true, user };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  
  if (!user) return null;
  
  // Fetch additional user data from users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (userError) return user;
  
  return { ...user, ...userData };
}
