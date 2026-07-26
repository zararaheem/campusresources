import { createLocalStore } from './local';
import { createSupabaseStore } from './supabase';

// Choose the backend: Supabase if configured, otherwise the local file store.
let _store = null;

export function getStore() {
  if (_store) return _store;
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  _store = hasSupabase ? createSupabaseStore() : createLocalStore();
  return _store;
}

export function usingSupabase() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}
