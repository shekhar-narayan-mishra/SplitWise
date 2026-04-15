import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useExpenses } from '../hooks/useExpenses';
import { ExpenseForm } from '../components/ExpenseForm';
import type { GroupMember } from '../types';
import type { ExpenseWithSplits } from '../types';
import { ArrowLeft, Pencil, Loader2 } from 'lucide-react';

export default function EditExpense() {
  const { expenseId } = useParams<{ expenseId: string }>();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<ExpenseWithSplits | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const { updateExpense, loading } = useExpenses(expense?.group_id ?? '');

  useEffect(() => {
    if (!expenseId) return;

    supabase
      .from('expenses')
      .select('*, splits:expense_splits(*)')
      .eq('id', expenseId)
      .single()
      .then(async ({ data: expData }) => {
        if (!expData) return;
        setExpense(expData as ExpenseWithSplits);

        // Fetch group members
        const { data: groupData } = await supabase
          .from('groups')
          .select('group_members(*)')
          .eq('id', expData.group_id)
          .single();

        if (groupData) {
          setMembers(groupData.group_members);
        }
        setLoadingData(false);
      });
  }, [expenseId]);

  const handleSubmit = async (payload: Parameters<typeof updateExpense>[1]) => {
    if (!expenseId || !expense) return;
    await updateExpense(expenseId, payload);
    navigate(`/groups/${expense.group_id}`);
  };

  if (loadingData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
        <p className="text-slate-400 animate-pulse">Loading expense…</p>
      </div>
    );
  }

  if (!expense) return null;

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <Link
          to={`/groups/${expense.group_id}`}
          className="text-slate-500 hover:text-emerald-400 flex items-center gap-2 mb-4 transition-colors group text-sm"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Group
        </Link>
        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <Pencil className="text-emerald-500" size={28} />
          Edit <span className="text-emerald-400">Expense</span>
        </h1>
        <p className="text-slate-400 mt-2">Update the details or adjust the split.</p>
      </div>

      <ExpenseForm
        groupId={expense.group_id}
        members={members}
        initialData={expense}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/groups/${expense.group_id}`)}
        loading={loading}
      />
    </div>
  );
}
