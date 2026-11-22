import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import createFallbackSupabaseClient from './fallback'
import { getSupabaseConfig } from './env'

export async function createClientForServer() {
    const cookieStore = await cookies()

    const { supabaseUrl, supabaseKey, hasConfig } = getSupabaseConfig()

    if (!hasConfig) {
        return createFallbackSupabaseClient()
    }

    return createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options),
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                flowType: 'pkce',
            },
        },
    )
}
