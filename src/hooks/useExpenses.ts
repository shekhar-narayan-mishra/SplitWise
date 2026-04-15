import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ExpenseWithSplits, SplitMode } from '../types';

/** Payload for creating or updating an expense */
export interface ExpensePayload {
  group_id: string;
  description: string;
  amount: number;
  paid_by: string;
  date: string;
  split_mode: SplitMode;
  splits: { participant_id: string; amount: number; percentage: number | null }[];
}

export function useExpenses(groupId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async (): Promise<ExpenseWithSplits[]> => {
    if (!groupId) return [];
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('expenses')
        .select(`
          *,
          splits:expense_splits (*)
        `)
        .eq('group_id', groupId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (err) throw err;
      return (data ?? []) as ExpenseWithSplits[];
    } catch (e: any) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const createExpense = async (payload: ExpensePayload): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      // 1. Insert expense row
      const { data: expense, error: expErr } = await supabase
        .from('expenses')
        .insert({
          group_id: payload.group_id,
          description: payload.description,
          amount: payload.amount,
          paid_by: payload.paid_by,
          date: payload.date,
          split_mode: payload.split_mode,
        })
        .select()
        .single();

      if (expErr) throw expErr;

      // 2. Insert expense_splits rows
      const splitRows = payload.splits.map(s => ({
        expense_id: expense.id,
        participant_id: s.participant_id,
        amount: s.amount,
        percentage: s.percentage,
      }));

      const { error: splitErr } = await supabase
        .from('expense_splits')
        .insert(splitRows);

      if (splitErr) throw splitErr;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateExpense = async (expenseId: string, payload: ExpensePayload): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      // 1. Update expense row
      const { error: expErr } = await supabase
        .from('expenses')
        .update({
          description: payload.description,
          amount: payload.amount,
          paid_by: payload.paid_by,
          date: payload.date,
          split_mode: payload.split_mode,
        })
        .eq('id', expenseId);

      if (expErr) throw expErr;

      // 2. Replace all splits (delete old, insert new)
      const { error: delErr } = await supabase
        .from('expense_splits')
        .delete()
        .eq('expense_id', expenseId);

      if (delErr) throw delErr;

      const splitRows = payload.splits.map(s => ({
        expense_id: expenseId,
        participant_id: s.participant_id,
        amount: s.amount,
        percentage: s.percentage,
      }));

      const { error: splitErr } = await supabase
        .from('expense_splits')
        .insert(splitRows);

      if (splitErr) throw splitErr;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (expenseId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);
      if (err) throw err;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, fetchExpenses, createExpense, updateExpense, deleteExpense };
}
