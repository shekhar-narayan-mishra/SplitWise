import React from 'react';
import { TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';

interface SummaryCardsProps {
  totalSpent: number;
  totalOwedToYou: number;
  totalYouOwe: number;
}

const fmt = (n: number) =>
  '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalSpent,
  totalOwedToYou,
  totalYouOwe,
}) => {


  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Total Spent */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Group Total
          </span>
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <IndianRupee size={16} className="text-slate-400" />
          </div>
        </div>
        <p className="text-3xl font-black text-white tabular-nums">{fmt(totalSpent)}</p>
        <p className="text-xs text-slate-500">Total group spending</p>
      </div>

      {/* Owed to you */}
      <div className={`border rounded-2xl p-5 flex flex-col gap-3 ${
        totalOwedToYou > 0
          ? 'bg-emerald-500/5 border-emerald-500/25'
          : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Owed to You
          </span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            totalOwedToYou > 0 ? 'bg-emerald-500/20' : 'bg-slate-800 border border-slate-700'
          }`}>
            <TrendingUp size={16} className={totalOwedToYou > 0 ? 'text-emerald-400' : 'text-slate-500'} />
          </div>
        </div>
        <p className={`text-3xl font-black tabular-nums ${
          totalOwedToYou > 0 ? 'text-emerald-400' : 'text-slate-500'
        }`}>
          {fmt(totalOwedToYou)}
        </p>
        <p className="text-xs text-slate-500">
          {totalOwedToYou > 0 ? 'Members owe you this' : 'No one owes you'}
        </p>
      </div>

      {/* You owe */}
      <div className={`border rounded-2xl p-5 flex flex-col gap-3 ${
        totalYouOwe > 0
          ? 'bg-rose-500/5 border-rose-500/25'
          : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            You Owe
          </span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            totalYouOwe > 0 ? 'bg-rose-500/20' : 'bg-slate-800 border border-slate-700'
          }`}>
            <TrendingDown size={16} className={totalYouOwe > 0 ? 'text-rose-400' : 'text-slate-500'} />
          </div>
        </div>
        <p className={`text-3xl font-black tabular-nums ${
          totalYouOwe > 0 ? 'text-rose-400' : 'text-slate-500'
        }`}>
          {fmt(totalYouOwe)}
        </p>
        <p className="text-xs text-slate-500">
          {totalYouOwe > 0 ? 'You owe this in total' : 'All settled up!'}
        </p>
      </div>
    </div>
  );
};
