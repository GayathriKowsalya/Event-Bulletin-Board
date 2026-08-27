import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️  WARNING: SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment variables.");
  console.warn("⚠️  Supabase features will fail until these are configured.");
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (new Proxy({}, {
      get() {
        return () => {
          throw new Error("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env");
        };
      }
    }) as ReturnType<typeof createClient>);

export const getAuthClient = (token: string) => {
  if (!supabaseUrl || !supabaseAnonKey) return supabase;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};
