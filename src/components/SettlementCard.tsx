import React, { useState } from 'react';
import type { Settlement } from '../lib/balanceEngine';
import type { GroupMember } from '../types';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

interface SettlementCardProps {
  settlement: Settlement;
  members: GroupMember[];
  onMarkSettled: (from: string, to: string, amount: number) => Promise<void>;
}

const fmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const memberInfo = (id: string, members: GroupMember[]) => {
  const m = members.find(m => m.id === id);
  return {
    name: m?.nickname ?? id.slice(0, 6),
    color: m?.color ?? '#64748b',
    initial: (m?.nickname ?? 'M').charAt(0).toUpperCase(),
  };
};

export const SettlementCard: React.FC<SettlementCardProps> = ({
  settlement,
  members,
  onMarkSettled,
}) => {
  const [settling, setSettling] = useState(false);
  const from = memberInfo(settlement.from, members);
  const to   = memberInfo(settlement.to, members);

  const handle = async () => {
    setSettling(true);
    try {
      await onMarkSettled(settlement.from, settlement.to, settlement.amount);
    } finally {
      setSettling(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all">
      {/* From avatar */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0 shadow"
        style={{ backgroundColor: from.color }}
      >
        {from.initial}
      </div>

      {/* Flow */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200 truncate">
          <span className="text-white font-bold">{from.name}</span>
          {' '}pays{' '}
          <span className="text-white font-bold">{to.name}</span>
        </p>
        <p className="text-xl font-black text-rose-400 tabular-nums mt-0.5">
          {fmt(settlement.amount)}
        </p>
      </div>

      <ArrowRight size={16} className="text-slate-600 shrink-0 hidden sm:block" />

      {/* To avatar */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0 shadow hidden sm:flex"
        style={{ backgroundColor: to.color }}
      >
        {to.initial}
      </div>

      {/* Mark settled */}
      <button
        onClick={handle}
        disabled={settling}
        className="shrink-0 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95"
      >
        {settling ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <CheckCircle2 size={14} />
        )}
        <span className="hidden sm:inline">Mark Settled</span>
      </button>
    </div>
  );
};
