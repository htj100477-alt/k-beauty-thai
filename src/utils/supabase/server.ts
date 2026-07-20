import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fallback to placeholder if environment variables are not configured yet
  const url = supabaseUrl && !supabaseUrl.includes('your-project-id') 
    ? supabaseUrl 
    : 'https://placeholder.supabase.co';
    
  const key = supabaseAnonKey && !supabaseAnonKey.includes('your-project-id')
    ? supabaseAnonKey
    : 'placeholder-key';

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Safe to ignore in Server Components
          }
        },
      },
    }
  );
}
