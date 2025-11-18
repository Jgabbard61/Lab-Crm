
// Authentication Helper using Supabase Auth
import { supabase } from './supabase/client';

export interface LoginCredentials {
  username: string;
  password: string;
}

export async function signIn(credentials: LoginCredentials) {
  try {
    // Since Supabase Auth uses email, we'll need to fetch user by username first
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('username', credentials.username)
      .single();
    
    if (userError || !userData) {
      throw new Error('Invalid username or password');
    }
    
    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: credentials.password,
    });
    
    if (error) throw error;
    
    return { success: true, user: data.user };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Authentication failed' };
  }
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
