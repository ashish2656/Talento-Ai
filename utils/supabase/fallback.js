const fallbackError = 'Supabase is not configured';

const notConfigured = () => ({ message: fallbackError });

const createNoopQueryBuilder = () => {
    const builder = {
        select() { return builder; },
        insert() { return builder; },
        update() { return builder; },
        delete() { return builder; },
        upsert() { return builder; },
        eq() { return builder; },
        neq() { return builder; },
        in() { return builder; },
        ilike() { return builder; },
        gt() { return builder; },
        gte() { return builder; },
        lt() { return builder; },
        lte() { return builder; },
        order() { return builder; },
        limit() { return builder; },
        range() { return builder; },
        single: async () => ({ data: null, error: notConfigured() }),
        maybeSingle: async () => ({ data: null, error: notConfigured() }),
    };

    return builder;
};

const createNoopStorageBucket = () => ({
    upload: async () => ({ data: null, error: notConfigured() }),
    download: async () => ({ data: null, error: notConfigured() }),
    remove: async () => ({ data: null, error: notConfigured() }),
    createSignedUrl: async () => ({ data: null, error: notConfigured() }),
    getPublicUrl: () => ({ data: { publicUrl: '' } }),
    list: async () => ({ data: [], error: notConfigured() }),
});

const createFallbackSupabaseClient = () => ({
    __fallback: true,
    auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({
            data: {
                subscription: {
                    unsubscribe() {},
                },
            },
        }),
        signOut: async () => ({ data: null, error: null }),
        updateUser: async () => ({ data: { user: null }, error: notConfigured() }),
        signInWithOAuth: async () => ({ data: null, error: notConfigured() }),
        signInWithPassword: async () => ({ data: null, error: notConfigured() }),
        signInWithOtp: async () => ({ data: null, error: notConfigured() }),
        verifyOtp: async () => ({ data: null, error: notConfigured() }),
        signUp: async () => ({ data: null, error: notConfigured() }),
        resetPasswordForEmail: async () => ({ data: null, error: notConfigured() }),
        admin: {
            generateLink: async () => ({ data: null, error: notConfigured() }),
        },
    },
    from() {
        return createNoopQueryBuilder();
    },
    storage: {
        from() {
            return createNoopStorageBucket();
        },
    },
});

export default createFallbackSupabaseClient;
