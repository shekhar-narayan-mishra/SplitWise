import React from 'react';
import { Link } from 'react-router-dom';
import type { ExpenseWithSplits } from '../types';
import type { GroupMember } from '../types';
import { Pencil, Trash2, Calendar, User } from 'lucide-react';

interface ExpenseItemProps {
  expense: ExpenseWithSplits;
  members: GroupMember[];
  currentUserId: string;
  onDelete: (id: string) => void;
}

export const ExpenseItem: React.FC<ExpenseItemProps> = ({
  expense,
  members,
  currentUserId,
  onDelete,
}) => {
  const payer = members.find(m => m.id === expense.paid_by);
  const payerIsMe = expense.paid_by === currentUserId;
  const mySplit = expense.splits.find(s => s.participant_id === currentUserId);

  const formattedDate = new Date(expense.date).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="group flex items-stretch gap-4 bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all">
      {/* Left accent bar */}
      <div
        className="w-1 rounded-full shrink-0"
        style={{ backgroundColor: payer?.color ?? '#10b981' }}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-3">
          <div>
            <p className="font-bold text-white truncate">{expense.description}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: payer?.color ?? '#10b981' }}
                />
                <User size={11} />
                {payerIsMe ? 'You paid' : `${payer?.nickname ?? 'Someone'} paid`}
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="font-black text-white text-lg">
              ${Number(expense.amount).toFixed(2)}
            </p>
            {mySplit && (
              <p className={`text-xs font-semibold mt-0.5 ${
                payerIsMe ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {payerIsMe ? 'Lent' : 'You owed'} ${Number(mySplit.amount).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Split mode badge */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">
            {expense.split_mode} split · {expense.splits.length} people
          </span>

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              to={`/expenses/${expense.id}/edit`}
              className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
              title="Edit"
            >
              <Pencil size={14} />
            </Link>
            <button
              onClick={() => onDelete(expense.id)}
              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
