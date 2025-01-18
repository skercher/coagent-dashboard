import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'development') {
    throw new Error('Missing Supabase environment variables');
  }
  // In production, return a dummy client that will be replaced on the client side
  // @ts-ignore - This is intentional for SSG
  global.supabase = {};
} else {
  // Create a single instance
  // @ts-ignore - This is intentional for SSG
  global.supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

// @ts-ignore - This is intentional for SSG
export const supabase = global.supabase;