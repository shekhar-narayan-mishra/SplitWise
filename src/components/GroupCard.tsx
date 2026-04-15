import React from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import type { GroupWithStats } from '../hooks/useGroups';

interface GroupCardProps {
  group: GroupWithStats;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  const isOwed = group.user_net_balance > 0;
  const isSettled = Math.abs(group.user_net_balance) < 0.01;
  const balanceValue = Math.abs(group.user_net_balance).toFixed(2);

  return (
    <Link 
      to={`/groups/${group.id}`}
      className="group bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all shadow-xl hover:shadow-emerald-500/10 flex flex-col h-full animate-in fade-in zoom-in-95"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors tracking-tight">
            {group.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-sm">
            <Users size={14} />
            <span>{group.member_count} members</span>
          </div>
        </div>
        <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 group-hover:border-emerald-500/30 transition-colors">
          <ArrowRight className="text-slate-600 group-hover:text-emerald-400 transition-all group-hover:translate-x-0.5" size={18} />
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Group Expense</div>
          <div className="text-2xl font-black text-white flex items-baseline gap-1">
            <span className="text-slate-500 text-lg font-medium">$</span>
            {group.total_spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className={`rounded-2xl p-4 border flex flex-col justify-center ${
          isSettled 
            ? 'bg-slate-800/20 border-slate-800 text-slate-500' 
            : isOwed 
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/5 border-rose-500/20 text-rose-400'
        }`}>
          <div className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70">Your Net Balance</div>
          <div className="flex items-center gap-2">
            {isSettled ? (
              <span className="text-lg font-bold">All settled up</span>
            ) : (
              <>
                {isOwed ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                <div className="text-2xl font-black flex items-baseline gap-1">
                  <span className="text-sm font-medium opacity-70">$</span>
                  {balanceValue}
                </div>
                <span className="text-xs font-medium ml-auto opacity-70">
                  {isOwed ? 'Owed to you' : 'You owe'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex -space-x-2">
        {group.members.slice(0, 4).map((member, i) => (
          <div 
            key={member.id}
            title={member.nickname || 'Member'}
            className="w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
            style={{ backgroundColor: member.color || '#334155', zIndex: 10 - i }}
          >
            {(member.nickname || 'M').charAt(0).toUpperCase()}
          </div>
        ))}
        {group.member_count > 4 && (
          <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
            +{group.member_count - 4}
          </div>
        )}
      </div>
    </Link>
  );
};
