import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Group, GroupMember } from '../types';

export interface GroupWithStats extends Group {
  member_count: number;
  total_spent: number;
  user_net_balance: number;
  members: GroupMember[];
}

export function useGroups() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchGroups = useCallback(async (): Promise<GroupWithStats[]> => {
    if (!user) return [];
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch groups the user belongs to
      const { data: memberRows, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;
      if (!memberRows || memberRows.length === 0) return [];

      const groupIds = memberRows.map(m => m.group_id);

      // 2. Fetch full group details and members
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          group_members (*)
        `)
        .in('id', groupIds);

      if (groupsError) throw groupsError;

      // 3. Fetch expenses and splits to calculate totals and balances
      // Note: In a large app, this would be a Postgres function/view
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          group_id,
          description,
          amount,
          paid_by,
          expense_splits (
            participant_id,
            amount
          )
        `)
        .in('group_id', groupIds);

      if (expensesError) throw expensesError;

      // 4. Transform and calculate stats
      const enrichedGroups: GroupWithStats[] = (groupsData || []).map(group => {
        const groupExpenses = expensesData?.filter(e => e.group_id === group.id) || [];
        
        let totalSpent = 0;
        let userPaidTotal = 0;
        let userOweTotal = 0;

        const myMember = group.group_members.find(m => m.user_id === user.id);
        const myMemberId = myMember?.id;

        groupExpenses.forEach(expense => {
          if (expense.description !== 'Settled Debt') {
            totalSpent += Number(expense.amount);
          }
          
          if (myMemberId && expense.paid_by === myMemberId) {
            userPaidTotal += Number(expense.amount);
          }

          const mySplit = expense.expense_splits?.find(s => s.participant_id === myMemberId);
          if (myMemberId && mySplit) {
            userOweTotal += Number(mySplit.amount);
          }
        });

        return {
          ...group,
          members: group.group_members,
          member_count: group.group_members.length,
          total_spent: totalSpent,
          user_net_balance: userPaidTotal - userOweTotal
        };
      });

      return enrichedGroups;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createGroup = async (name: string, participants: { nickname: string, color: string }[]) => {
    if (!user) return;
    setLoading(true);
    
    try {
      // 1. Create the Group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({ name, created_by: user.id })
        .select()
        .single();

      if (groupError) throw groupError;

      // 2. Prepare member inserts
      const membersToInsert = [
        // Add current user
        { group_id: group.id, user_id: user.id, nickname: 'You', color: '#10b981' },
        // Add extra participants (Ghost Members)
        ...participants.map(p => ({
          group_id: group.id,
          nickname: p.nickname,
          color: p.color
        }))
      ];

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(membersToInsert);

      if (membersError) throw membersError;

      return group;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);
      
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchGroups,
    createGroup,
    deleteGroup
  };
}
