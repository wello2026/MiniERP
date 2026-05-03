import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if the URL is valid to prevent "Invalid URL" crash during development
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const safeUrl = isValidUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder.supabase.co';

export const supabase = createClient(safeUrl, supabaseAnonKey || 'placeholder')

export const isConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url' && isValidUrl(supabaseUrl))
}