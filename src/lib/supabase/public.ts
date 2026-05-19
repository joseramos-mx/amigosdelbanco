import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)");
}

// Anon-key client. RLS-restricted. Safe in server or client components.
export const supabasePublic = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
