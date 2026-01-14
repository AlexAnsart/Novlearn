import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check credentials but only log errors
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] ERROR: Supabase URL or Anon Key is missing!');
  console.error('[Supabase] URL:', supabaseUrl ? 'present' : 'MISSING');
  console.error('[Supabase] Key:', supabaseAnonKey ? 'present' : 'MISSING');
  console.error('[Supabase] Please check your environment variables.');
} else {
  console.log('[Supabase] Initialized successfully');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
