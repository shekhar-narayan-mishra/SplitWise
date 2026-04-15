import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import type { GroupMember } from '../types';
import type { ExpenseWithSplits } from '../types';

interface ContributionChartProps {
  expenses: ExpenseWithSplits[];
  members: GroupMember[];
}

const fmt = (v: number) => '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl text-sm">
      <p className="font-bold text-white mb-1">{label}</p>
      <p className="text-emerald-400 font-semibold">Paid: {fmt(payload[0]?.value ?? 0)}</p>
      {payload[1] && (
        <p className="text-rose-400 font-semibold">Owed: {fmt(payload[1]?.value ?? 0)}</p>
      )}
    </div>
  );
};

export const ContributionChart: React.FC<ContributionChartProps> = ({ expenses, members }) => {
  // Build per-member paid + owed totals
  const data = members.map(m => {
    let paid  = 0;
    let owed  = 0;
    expenses.forEach(e => {
      if (e.paid_by === m.id) paid += Number(e.amount);
      const split = e.splits.find(s => s.participant_id === m.id);
      if (split) owed += Number(split.amount);
    });
    return {
      name: m.nickname ?? m.id.slice(0, 6),
      paid: Math.round(paid * 100) / 100,
      owed: Math.round(owed * 100) / 100,
      color: m.color ?? '#10b981',
    };
  });

  if (data.every(d => d.paid === 0 && d.owed === 0)) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
        No expenses to display yet.
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#475569', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="paid" name="Paid" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.9} />
            ))}
          </Bar>
          <Bar dataKey="owed" name="Owed" radius={[6, 6, 0, 0]} fill="#f43f5e" fillOpacity={0.5} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
