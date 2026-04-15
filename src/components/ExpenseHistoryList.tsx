import React, { useState, useMemo } from 'react';
import type { ExpenseWithSplits } from '../types';
import type { GroupMember } from '../types';
import { ExpenseItem } from './ExpenseItem';
import { Search, Filter, Calendar, X } from 'lucide-react';

interface ExpenseHistoryListProps {
  expenses: ExpenseWithSplits[];
  members: GroupMember[];
  currentUserId: string;
  onDelete: (id: string) => void;
}

export const ExpenseHistoryList: React.FC<ExpenseHistoryListProps> = ({
  expenses,
  members,
  currentUserId,
  onDelete,
}) => {
  const [search, setSearch]         = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterMember) {
        const inSplits = e.splits.some(s => s.participant_id === filterMember);
        const isPayer  = e.paid_by === filterMember;
        if (!inSplits && !isPayer) return false;
      }
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo   && e.date > dateTo)   return false;
      return true;
    });
  }, [expenses, search, filterMember, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearch('');
    setFilterMember('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = search || filterMember || dateFrom || dateTo;

  return (
    <div className="space-y-4">
      {/* Search bar + toggle filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search expenses…"
            className="w-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <Filter size={15} />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
          )}
        </button>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Participant filter */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Participant
              </label>
              <select
                value={filterMember}
                onChange={e => setFilterMember(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 appearance-none"
              >
                <option value="">All members</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.nickname ?? 'Member'}</option>
                ))}
              </select>
            </div>

            {/* Date from */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                From
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Date to */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                To
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              <X size={12} />
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          {filtered.length === expenses.length
            ? `${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`
            : `${filtered.length} of ${expenses.length} expenses`}
        </span>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-rose-400 hover:underline">
            Clear
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map(expense => (
            <ExpenseItem
              key={expense.id}
              expense={expense}
              members={members}
              currentUserId={currentUserId}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500 text-sm">
          {hasActiveFilters ? 'No expenses match your filters.' : 'No expenses yet.'}
        </div>
      )}
    </div>
  );
};
