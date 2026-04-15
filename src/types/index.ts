// ─────────────────────────────────────────────
// SplitMint — TypeScript Entity Interfaces
// ─────────────────────────────────────────────

/** Supported split modes for an expense */
export type SplitMode = 'equal' | 'exact' | 'percentage';

// ── Users ───────────────────────────────────

export interface User {
  id: string;                // uuid, FK → auth.users
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;        // ISO-8601 timestamp
}

// ── Groups ──────────────────────────────────

export interface Group {
  id: string;                // uuid
  name: string;
  created_by: string;        // FK → users.id
  created_at: string;
}

// ── Group Members ───────────────────────────

export interface GroupMember {
  id: string;                // uuid
  group_id: string;          // FK → groups.id
  user_id: string;           // FK → users.id
  nickname: string | null;
  color: string | null;      // hex colour for UI avatars
  joined_at: string;
}

// ── Expenses ────────────────────────────────

export interface Expense {
  id: string;                // uuid
  group_id: string;          // FK → groups.id
  description: string;
  amount: number;            // stored as numeric(12,2)
  paid_by: string;           // FK → users.id
  date: string;              // ISO date (YYYY-MM-DD)
  split_mode: SplitMode;
  created_at: string;
}

// ── Expense Splits ──────────────────────────

export interface ExpenseSplit {
  id: string;                // uuid
  expense_id: string;        // FK → expenses.id
  participant_id: string;    // FK → users.id
  amount: number;            // the participant's share
  percentage: number | null; // only populated when split_mode = 'percentage'
}

// ── Convenience / Join Types ────────────────

/** Expense with its related splits hydrated */
export interface ExpenseWithSplits extends Expense {
  splits: ExpenseSplit[];
}

/** Group with members list hydrated */
export interface GroupWithMembers extends Group {
  members: GroupMember[];
}
