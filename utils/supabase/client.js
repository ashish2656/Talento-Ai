'use client'

import { createBrowserClient } from '@supabase/ssr'
import createFallbackSupabaseClient from './fallback'
import { getSupabaseConfig } from './env'

const createClientForBrowser = () => {
    const { supabaseUrl, supabaseKey, hasConfig } = getSupabaseConfig()

    if (!hasConfig) {
        return createFallbackSupabaseClient()
    }

    return createBrowserClient(
        supabaseUrl,
        supabaseKey,
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                flowType: 'pkce',
            },
        }
    )
}

export default createClientForBrowser
