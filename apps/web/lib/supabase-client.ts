import { createClient } from '@supabase/supabase-js';

// Safe browser/client-side Supabase client.
// This file must NOT import from 'next/headers' or any server-only module.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
