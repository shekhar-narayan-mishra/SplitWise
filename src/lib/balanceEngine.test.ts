import { calculateBalances } from './balanceEngine';
import type { ExpenseWithSplits } from '../types';

describe('SplitMint Balance Engine', () => {
  const userA = 'user-a';
  const userB = 'user-b';
  const userC = 'user-c';

  test('Equal split among 3 people', () => {
    // User A pays $30, split equally among A, B, and C
    const expenses: ExpenseWithSplits[] = [
      {
        id: '1',
        group_id: 'g1',
        description: 'Dinner',
        amount: 30,
        paid_by: userA,
        date: '2023-01-01',
        split_mode: 'equal',
        created_at: '',
        splits: [
          { id: 's1', expense_id: '1', participant_id: userA, amount: 10, percentage: null },
          { id: 's2', expense_id: '1', participant_id: userB, amount: 10, percentage: null },
          { id: 's3', expense_id: '1', participant_id: userC, amount: 10, percentage: null },
        ]
      }
    ];

    const result = calculateBalances(expenses);

    // B and C owe $10 each, A is owed $20 total
    expect(result.netBalances[userA]).toBe(20);
    expect(result.netBalances[userB]).toBe(-10);
    expect(result.netBalances[userC]).toBe(-10);

    expect(result.settlements).toEqual(
      expect.arrayContaining([
        { from: userB, to: userA, amount: 10 },
        { from: userC, to: userA, amount: 10 }
      ])
    );
  });

  test('Custom split with different amounts', () => {
    // User A pays $100. Split: B = $70, C = $30. A = $0.
    const expenses: ExpenseWithSplits[] = [
      {
        id: '2',
        group_id: 'g1',
        description: 'Rent',
        amount: 100,
        paid_by: userA,
        date: '2023-01-01',
        split_mode: 'exact',
        created_at: '',
        splits: [
          { id: 's4', expense_id: '2', participant_id: userB, amount: 70, percentage: null },
          { id: 's5', expense_id: '2', participant_id: userC, amount: 30, percentage: null },
        ]
      }
    ];

    const result = calculateBalances(expenses);

    expect(result.netBalances[userA]).toBe(100);
    expect(result.netBalances[userB]).toBe(-70);
    expect(result.netBalances[userC]).toBe(-30);

    expect(result.settlements).toEqual([
      { from: userB, to: userA, amount: 70 },
      { from: userC, to: userA, amount: 30 }
    ]);
  });

  test('Percentage split calculation', () => {
    // User A pays $100. Split: B = 60%, C = 40%
    const expenses: ExpenseWithSplits[] = [
      {
        id: '3',
        group_id: 'g1',
        description: 'Party',
        amount: 100,
        paid_by: userA,
        date: '2023-01-01',
        split_mode: 'percentage',
        created_at: '',
        splits: [
          { id: 's6', expense_id: '3', participant_id: userB, amount: 60, percentage: 60 },
          { id: 's7', expense_id: '3', participant_id: userC, amount: 40, percentage: 40 },
        ]
      }
    ];

    const result = calculateBalances(expenses);

    expect(result.netBalances[userA]).toBe(100);
    expect(result.netBalances[userB]).toBe(-60);
    expect(result.netBalances[userC]).toBe(-40);
  });

  test('Rounding edge case (1/3 of $10)', () => {
    // $10 split between 3 people. Usually 3.33, 3.33, 3.34
    const expenses: ExpenseWithSplits[] = [
      {
        id: '4',
        group_id: 'g1',
        description: 'Pizza',
        amount: 10,
        paid_by: userA,
        date: '2023-01-01',
        split_mode: 'equal',
        created_at: '',
        splits: [
          { id: 's8', expense_id: '4', participant_id: userA, amount: 3.33, percentage: null },
          { id: 's9', expense_id: '4', participant_id: userB, amount: 3.33, percentage: null },
          { id: 's10', expense_id: '4', participant_id: userC, amount: 3.34, percentage: null },
        ]
      }
    ];

    const result = calculateBalances(expenses);

    // A paid 10, gets 3.33 share. Net = 10 - 3.33 = 6.67
    expect(result.netBalances[userA]).toBe(6.67);
    expect(result.netBalances[userB]).toBe(-3.33);
    expect(result.netBalances[userC]).toBe(-3.34);
    
    // Settlement: B pays A 3.33, C pays A 3.34
    expect(result.settlements).toEqual(
      expect.arrayContaining([
        { from: userB, to: userA, amount: 3.33 },
        { from: userC, to: userA, amount: 3.34 }
      ])
    );
  });

  test('Already settled (zero balances)', () => {
    const expenses: ExpenseWithSplits[] = [];
    const result = calculateBalances(expenses);

    expect(result.netBalances).toEqual({});
    expect(result.settlements).toEqual([]);
  });
});
