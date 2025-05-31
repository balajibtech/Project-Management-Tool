import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing in environment variables.');
  throw new Error('Supabase environment variables are not set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Persist session across browser restarts
    autoRefreshToken: true, // Automatically refresh tokens
    detectSessionInUrl: true, // Detect session from URL hash
  },
});

// Optional: Listen for auth state changes for debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, 'Session:', session);
});
