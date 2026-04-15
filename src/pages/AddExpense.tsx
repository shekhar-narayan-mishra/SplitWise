import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useExpenses } from '../hooks/useExpenses';
import { ExpenseForm } from '../components/ExpenseForm';
import type { GroupMember } from '../types';
import { ArrowLeft, PlusCircle, AlertCircle } from 'lucide-react';

export default function AddExpense() {
  const { id: groupId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createExpense, loading, error } = useExpenses(groupId ?? '');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (!groupId) return;
    supabase
      .from('groups')
      .select('name, group_members(*)')
      .eq('id', groupId)
      .single()
      .then(({ data }) => {
        if (data) {
          setGroupName(data.name);
          setMembers(data.group_members);
        }
      });
  }, [groupId]);

  const handleSubmit = async (payload: Parameters<typeof createExpense>[0]) => {
    try {
      await createExpense(payload);
      navigate(`/groups/${groupId}`);
    } catch (e: any) {
      // Keep them on the form so they see the error below
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <Link
          to={`/groups/${groupId}`}
          className="text-slate-500 hover:text-emerald-400 flex items-center gap-2 mb-4 transition-colors group text-sm"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to {groupName || 'Group'}
        </Link>
        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <PlusCircle className="text-emerald-500" size={32} />
          Add <span className="text-emerald-400">Expense</span>
        </h1>
        <p className="text-slate-400 mt-2">Record an expense and choose how to split it.</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl mb-6 flex gap-3 text-sm animate-in fade-in">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {members.length > 0 && (
        <ExpenseForm
          groupId={groupId ?? ''}
          members={members}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/groups/${groupId}`)}
          loading={loading}
        />
      )}
    </div>
  );
}
