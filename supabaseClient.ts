import { createClient } from '@supabase/supabase-js';

// Helper: Simple Base64 decoding for obfuscation
const decodeConfig = () => {
  if (typeof window === 'undefined') return { url: '', key: '' };
  
  try {
    // Look for the obfuscated key '_sys_pref_v1' instead of obvious 'sb_key'
    const encoded = localStorage.getItem('_sys_pref_v1');
    if (!encoded) return { url: '', key: '' };
    
    const jsonStr = atob(encoded); // Base64 Decode
    const config = JSON.parse(jsonStr);
    return { url: config.u || '', key: config.k || '' };
  } catch (e) {
    console.error("Failed to load config");
    return { url: '', key: '' };
  }
};

const localConfig = decodeConfig();

// 1. Try to get from Environment Variables (Vite)
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// 2. Fallback: Try to get from Obfuscated Local Storage
const localUrl = localConfig.url;
const localKey = localConfig.key;

// 3. Final Fallback: Placeholder to prevent crash, but calls will fail
const supabaseUrl = envUrl || localUrl || 'https://placeholder.supabase.co';
const supabaseKey = envKey || localKey || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to check if we have valid-looking credentials
export const isSupabaseConfigured = () => {
  return (!!envUrl || !!localUrl) && (!!envKey || !!localKey) && supabaseUrl !== 'https://placeholder.supabase.co';
};