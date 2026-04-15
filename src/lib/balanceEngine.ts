import type { ExpenseWithSplits } from '../types';

/**
 * Result of the balance calculation
 */
export interface BalanceResult {
  /** Map of userId to their net balance (negative = owes, positive = owed) */
  netBalances: Record<string, number>;
  /** Minimal set of transactions to settle all debts */
  settlements: Settlement[];
}

/**
 * A single settlement transaction
 */
export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

/**
 * Rounds a number to 2 decimal places consistently
 */
const round = (val: number): number => {
  return Math.round(val * 100) / 100;
};

/**
 * SplitMint Balance Engine
 * 
 * Takes a list of expenses with their splits and calculates individual net balances
 * and a minimal settlement strategy using a greedy debt simplification algorithm.
 * 
 * @param expenses - Array of expenses, each containing its split breakdown
 * @returns An object containing net balances and a list of settlements
 */
export function calculateBalances(expenses: ExpenseWithSplits[]): BalanceResult {
  const netBalances: Record<string, number> = {};

  // 1. Calculate raw net balances
  expenses.forEach((expense) => {
    const amount = Number(expense.amount);
    const payerId = expense.paid_by;

    // Credit the payer
    netBalances[payerId] = round((netBalances[payerId] || 0) + amount);

    // Debit each participant
    expense.splits.forEach((split) => {
      const splitAmount = Number(split.amount);
      const participantId = split.participant_id;
      netBalances[participantId] = round((netBalances[participantId] || 0) - splitAmount);
    });
  });

  // 2. Identify Debtors and Creditors
  // We use a small epsilon for floating point comparison (e.g., handles $0.0001 errors)
  const epsilon = 0.01;
  const debtors: { id: string; balance: number }[] = [];
  const creditors: { id: string; balance: number }[] = [];

  Object.entries(netBalances).forEach(([id, balance]) => {
    if (balance <= -epsilon) {
      debtors.push({ id, balance: Math.abs(balance) });
    } else if (balance >= epsilon) {
      creditors.push({ id, balance });
    }
  });

  // 3. Greedy Settlement Logic (Debt Simplification)
  const settlements: Settlement[] = [];

  // Sort by balance descending to match largest debtor with largest creditor
  debtors.sort((a, b) => b.balance - a.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const amount = round(Math.min(debtor.balance, creditor.balance));
    
    if (amount > 0) {
      settlements.push({
        from: debtor.id,
        to: creditor.id,
        amount
      });
    }

    debtor.balance = round(debtor.balance - amount);
    creditor.balance = round(creditor.balance - amount);

    if (debtor.balance < epsilon) dIdx++;
    if (creditor.balance < epsilon) cIdx++;
  }

  return {
    netBalances,
    settlements
  };
}
