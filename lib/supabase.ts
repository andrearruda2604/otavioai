import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Using mock mode.');
} else {
    console.log('Supabase configured:', { hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey, urlPrefix: supabaseUrl?.substring(0, 30) });
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);

export const isSupabaseConfigured = () => {
    return !!(supabaseUrl && supabaseAnonKey);
};
