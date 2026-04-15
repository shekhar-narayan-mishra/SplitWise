// ─────────────────────────────────────────────
// SplitMint — useAuth hook (scaffold)
// Wraps Supabase auth state into a React hook
// ─────────────────────────────────────────────

import { useAuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useAuthContext();
  return context;
}
