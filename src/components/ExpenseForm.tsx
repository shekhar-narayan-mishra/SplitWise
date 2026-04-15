import React, { useState, useMemo } from 'react';
import type { GroupMember, SplitMode } from '../types';
import type { ExpensePayload } from '../hooks/useExpenses';
import type { ExpenseWithSplits } from '../types';
import {
  Calendar, User, Users, Percent,
  Sliders, Equal, AlertCircle, Loader2, CheckCircle2
} from 'lucide-react';
import { MintSenseInput } from './MintSenseInput';
import type { AIPrefill } from './MintSenseInput';

interface ExpenseFormProps {
  groupId: string;
  members: GroupMember[];
  initialData?: ExpenseWithSplits;        // For editing
  onSubmit: (payload: ExpensePayload) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

const round = (v: number) => Math.round(v * 100) / 100;

const SPLIT_MODES: { value: SplitMode; label: string; icon: React.ReactNode }[] = [
  { value: 'equal',      label: 'Equal',      icon: <Equal size={16} /> },
  { value: 'exact',      label: 'Custom',     icon: <Sliders size={16} /> },
  { value: 'percentage', label: 'Percentage', icon: <Percent size={16} /> },
];

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  groupId, members, initialData, onSubmit, onCancel, loading
}) => {
  const today = new Date().toISOString().split('T')[0];

  /* ── form state ────────────────────────────────── */
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [amount, setAmount]           = useState(initialData?.amount?.toString() ?? '');
  const [date, setDate]               = useState(initialData?.date ?? today);
  const [payerId, setPayerId]         = useState(initialData?.paid_by ?? members[0]?.id ?? '');
  const [splitMode, setSplitMode]     = useState<SplitMode>(initialData?.split_mode ?? 'equal');
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    initialData ? initialData.splits.map(s => s.participant_id) : members.map(m => m.id)
  );
  // Custom / Percentage values keyed by member id
  const [customValues, setCustomValues] = useState<Record<string, string>>(() => {
    if (initialData) {
      const map: Record<string, string> = {};
      initialData.splits.forEach(s => {
        map[s.participant_id] = splitMode === 'percentage'
          ? (s.percentage ?? 0).toString()
          : s.amount.toString();
      });
      return map;
    }
    return {};
  });

  const totalAmount = parseFloat(amount) || 0;
  const selectedMembers = members.filter(m => selectedIds.includes(m.id));

  /* ── derived split values ──────────────────────── */
  const splits = useMemo<{ memberId: string; amount: number; percentage: number | null }[]>(() => {
    if (selectedMembers.length === 0) return [];

    if (splitMode === 'equal') {
      const base = round(totalAmount / selectedMembers.length);
      const remainder = round(totalAmount - base * selectedMembers.length);
      return selectedMembers.map((m, i) => ({
        memberId: m.id,
        amount: i === selectedMembers.length - 1 ? round(base + remainder) : base,
        percentage: null,
      }));
    }

    if (splitMode === 'exact') {
      return selectedMembers.map(m => ({
        memberId: m.id,
        amount: round(parseFloat(customValues[m.id] ?? '0') || 0),
        percentage: null,
      }));
    }

    // percentage
    return selectedMembers.map(m => {
      const pct = parseFloat(customValues[m.id] ?? '0') || 0;
      return {
        memberId: m.id,
        amount: round((pct / 100) * totalAmount),
        percentage: pct,
      };
    });
  }, [splitMode, selectedMembers, customValues, totalAmount]);

  /* ── validation ────────────────────────────────── */
  const exactSum  = splits.reduce((s, x) => round(s + x.amount), 0);
  const pctSum    = splits.reduce((s, x) => round(s + (x.percentage ?? 0)), 0);

  const validExact   = splitMode !== 'exact'      || Math.abs(exactSum - totalAmount) < 0.005;
  const validPct     = splitMode !== 'percentage' || Math.abs(pctSum - 100) < 0.5;
  const canSubmit    = description.trim() && totalAmount > 0 && payerId && selectedIds.length > 0 && validExact && validPct;

  /* ── handlers ──────────────────────────────────── */
  const toggleMember = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const setCustom = (memberId: string, val: string) => {
    setCustomValues(prev => ({ ...prev, [memberId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const payload: ExpensePayload = {
      group_id: groupId,
      description: description.trim(),
      amount: totalAmount,
      paid_by: payerId,
      date,
      split_mode: splitMode,
      splits: splits.map(s => ({
        participant_id: s.memberId,
        amount: s.amount,
        percentage: s.percentage,
      })),
    };
    await onSubmit(payload);
  };
  const handleAIParsed = (prefill: AIPrefill) => {
    setDescription(prefill.description);
    setAmount(prefill.amount);
    if (prefill.payerId) setPayerId(prefill.payerId);
    setSelectedIds(prefill.selectedIds);
    setSplitMode(prefill.splitMode);
    setCustomValues(prefill.customValues);
  };

  return (
    <div className="space-y-8">
      {/* AI Suggestion (Only on Add, not Edit) */}
      {!initialData && (
        <MintSenseInput members={members} onParsed={handleAIParsed} />
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Description + Amount + Date + Payer */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6 backdrop-blur-sm">
        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
            Description
          </label>
          <input
            required
            autoFocus
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Dinner at Taj, Train tickets…"
            className="w-full bg-slate-950 px-4 py-3 rounded-2xl border border-slate-700 text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              Total Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 pl-8 pr-4 py-3 rounded-2xl border border-slate-700 text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-950 pl-9 pr-4 py-3 rounded-2xl border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none transition-all [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Payer */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
            Paid by
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              value={payerId}
              onChange={e => setPayerId(e.target.value)}
              className="w-full bg-slate-950 pl-9 pr-4 py-3 rounded-2xl border border-slate-700 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none transition-all appearance-none"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.nickname ?? 'Member'}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Participants */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Users size={14} /> Participants
          </label>
          <span className="text-xs text-slate-500">{selectedIds.length}/{members.length} selected</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map(m => {
            const selected = selectedIds.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMember(m.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
                  selected
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                    : 'border-slate-700 bg-slate-950 text-slate-500 hover:border-slate-600'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[9px] font-bold"
                  style={{ backgroundColor: m.color ?? '#64748b' }}
                >
                  {(m.nickname ?? 'M').charAt(0).toUpperCase()}
                </div>
                {m.nickname ?? 'Member'}
                {selected && <CheckCircle2 size={14} className="text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Split Mode + Calculations */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-5 backdrop-blur-sm">
        {/* Mode Tabs */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Split Mode
          </label>
          <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-2xl">
            {SPLIT_MODES.map(mode => (
              <button
                key={mode.value}
                type="button"
                onClick={() => setSplitMode(mode.value)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
                  splitMode === mode.value
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode.icon}
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Split Inputs */}
        {selectedMembers.length > 0 && totalAmount > 0 && (
          <div className="space-y-2">
            {selectedMembers.map((m, i) => {
              const s = splits[i];
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 bg-slate-950/60 rounded-2xl px-4 py-3 border border-slate-800"
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: m.color ?? '#64748b' }}
                  >
                    {(m.nickname ?? 'M').charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm font-semibold text-slate-200">{m.nickname}</span>

                  {splitMode === 'equal' && (
                    <span className="text-emerald-400 font-bold tabular-nums">
                      ${s?.amount.toFixed(2)}
                    </span>
                  )}

                  {splitMode === 'exact' && (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={customValues[m.id] ?? ''}
                        onChange={e => setCustom(m.id, e.target.value)}
                        placeholder="0.00"
                        className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-sm font-bold text-right focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {splitMode === 'percentage' && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={customValues[m.id] ?? ''}
                          onChange={e => setCustom(m.id, e.target.value)}
                          placeholder="0"
                          className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-sm font-bold text-right focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none"
                        />
                        <span className="text-slate-500">%</span>
                      </div>
                      <span className="text-slate-500 text-sm tabular-nums">
                        = ${s?.amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Live Validation */}
        {totalAmount > 0 && selectedMembers.length > 0 && (
          <>
            {splitMode === 'exact' && (
              <div className={`flex items-center justify-between text-sm font-semibold px-2 ${
                validExact ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                <span className="flex items-center gap-2">
                  {validExact ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                  Sum: ${exactSum.toFixed(2)}
                </span>
                <span>Total: ${totalAmount.toFixed(2)}</span>
              </div>
            )}
            {splitMode === 'percentage' && (
              <div className={`flex items-center justify-between text-sm font-semibold px-2 ${
                validPct ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                <span className="flex items-center gap-2">
                  {validPct ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                  Total %: {pctSum.toFixed(1)}%
                </span>
                <span>Required: 100%</span>
              </div>
            )}
          </>
        )}
      </section>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-4 px-6 border border-slate-800 rounded-2xl text-slate-400 font-bold hover:bg-slate-800/50 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="flex-[2] py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>{initialData ? 'Update Expense' : 'Save Expense'}</>
          )}
        </button>
      </div>
    </form>
    </div>
  );
};
