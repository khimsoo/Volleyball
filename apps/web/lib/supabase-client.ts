import { createClient } from '@supabase/supabase-js';

// Safe browser/client-side Supabase client.
// This file must NOT import from 'next/headers' or any server-only module.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const cookieStorage = typeof window !== 'undefined'
  ? {
      getItem(key: string) {
        const match = document.cookie.match(
          new RegExp('(^|;)\\s*' + encodeURIComponent(key) + '=([^;]*)'),
        );
        return match ? decodeURIComponent(match[2]) : null;
      },
      setItem(key: string, value: string) {
        const secure = location.protocol === 'https:' ? 'secure; ' : '';
        document.cookie =
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; ${secure}sameSite=lax`;
      },
      removeItem(key: string) {
        document.cookie =
          `${encodeURIComponent(key)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; sameSite=lax`;
      },
    }
  : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: cookieStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
