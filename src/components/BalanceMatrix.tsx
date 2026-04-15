import React from 'react';
import type { GroupMember } from '../types';

interface BalanceMatrixProps {
  members: GroupMember[];
  /** netBalances keyed by participant_id */
  netBalances: Record<string, number>;
  /** settlements list from balanceEngine */
  settlements: { from: string; to: string; amount: number }[];
  currentUserId: string;
}

const round = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) =>
  '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Builds a pairwise balance matrix from settlements.
 * matrix[A][B] = amount A owes B (positive means A→B debt).
 */
function buildMatrix(
  members: GroupMember[],
  settlements: { from: string; to: string; amount: number }[]
): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  members.forEach(r => {
    matrix[r.id] = {};
    members.forEach(c => { matrix[r.id][c.id] = 0; });
  });
  settlements.forEach(s => {
    matrix[s.from][s.to] = round(matrix[s.from][s.to] + s.amount);
  });
  return matrix;
}

export const BalanceMatrix: React.FC<BalanceMatrixProps> = ({
  members,
  netBalances,
  settlements,
  currentUserId,
}) => {
  const matrix = buildMatrix(members, settlements);

  if (members.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800">
      <table className="w-full min-w-[400px] text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left py-3 px-4 text-slate-500 font-bold text-xs uppercase tracking-widest bg-slate-900/60 w-32">
              Owes ↓ / To →
            </th>
            {members.map(m => (
              <th
                key={m.id}
                className="py-3 px-3 text-center bg-slate-900/60"
              >
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black"
                    style={{ backgroundColor: m.color ?? '#64748b' }}
                  >
                    {(m.nickname ?? 'M').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-slate-400 font-semibold text-xs truncate max-w-[60px]">
                    {m.nickname ?? 'Member'}
                  </span>
                </div>
              </th>
            ))}
            <th className="py-3 px-4 text-center bg-slate-900/60 text-xs text-slate-500 font-bold uppercase tracking-widest">
              Net
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((row) => (
            <tr
              key={row.id}
              className={`border-b border-slate-800/50 last:border-0 ${
                row.id === currentUserId ? 'bg-slate-800/20' : ''
              }`}
            >
              {/* Row header */}
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-black"
                    style={{ backgroundColor: row.color ?? '#64748b' }}
                  >
                    {(row.nickname ?? 'M').charAt(0).toUpperCase()}
                  </div>
                  <span className={`font-semibold truncate ${
                    row.id === currentUserId ? 'text-emerald-400' : 'text-slate-300'
                  }`}>
                    {row.id === currentUserId ? 'You' : row.nickname}
                  </span>
                </div>
              </td>

              {/* Cells */}
              {members.map((col) => {
                const amount = matrix[row.id]?.[col.id] ?? 0;
                const isSelf = row.id === col.id;
                const isYouRow = row.id === currentUserId;

                let cellClass = 'text-slate-600';
                let label = '—';

                if (isSelf) {
                  cellClass = 'text-slate-700';
                  label = '·';
                } else if (amount > 0.005) {
                  // row owes col
                  cellClass = isYouRow ? 'text-rose-400 font-bold' : 'text-slate-400';
                  label = fmt(amount);
                }

                return (
                  <td
                    key={col.id}
                    className={`py-3 px-3 text-center tabular-nums ${cellClass} ${
                      isSelf ? 'bg-slate-950/30' : ''
                    }`}
                  >
                    <span className="text-xs">{label}</span>
                  </td>
                );
              })}

              {/* Net balance column */}
              <td className="py-3 px-4 text-center tabular-nums">
                {(() => {
                  const net = netBalances[row.id] ?? 0;
                  const cls =
                    net > 0.005  ? 'text-emerald-400 font-bold text-xs' :
                    net < -0.005 ? 'text-rose-400 font-bold text-xs' :
                    'text-slate-600 text-xs';
                  const prefix = net > 0.005 ? '+' : '';
                  return <span className={cls}>{prefix}{fmt(Math.abs(net))}</span>;
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
