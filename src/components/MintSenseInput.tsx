import React, { useState } from 'react';
import { parseExpenseNL, matchMemberByName } from '../lib/mintSense';
import type { ParsedExpense } from '../lib/mintSense';
import type { GroupMember, SplitMode } from '../types';
import { Sparkles, Loader2, AlertCircle, X, ArrowRight } from 'lucide-react';

/** The resolved prefill data — all IDs instead of name strings */
export interface AIPrefill {
  description: string;
  amount: string;
  payerId: string;
  selectedIds: string[];
  splitMode: SplitMode;
  /** For exact / percentage: memberId → value string */
  customValues: Record<string, string>;
}

interface MintSenseInputProps {
  members: GroupMember[];
  onParsed: (prefill: AIPrefill) => void;
}

type Status = 'idle' | 'loading' | 'error';

export const MintSenseInput: React.FC<MintSenseInputProps> = ({ members, onParsed }) => {
  const [text, setText]     = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleParse = async () => {
    if (!text.trim()) return;
    setStatus('loading');
    setError('');

    try {
      const parsed: ParsedExpense = await parseExpenseNL(text.trim());
      const prefill = resolvePrefill(parsed, members);
      onParsed(prefill);
      setText('');
      setStatus('idle');
    } catch (e: any) {
      setStatus('error');
      setError(e.message ?? 'Could not understand, please fill manually.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleParse();
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-violet-500/10 via-slate-900/60 to-emerald-500/5 border border-violet-500/30 rounded-3xl p-5 space-y-4 backdrop-blur-sm shadow-lg shadow-violet-500/5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">MintSense AI</p>
            <p className="text-[11px] text-slate-500 leading-none">Describe your expense in plain language</p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-slate-600 hover:text-slate-400 transition-colors rounded-lg hover:bg-slate-800"
        >
          <X size={15} />
        </button>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={status === 'loading'}
          rows={2}
          placeholder='e.g. "Rahul paid 800 for dinner, split equally between Rahul, Priya and Ankit"'
          className="w-full bg-slate-950/70 border border-slate-700 hover:border-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none transition-all disabled:opacity-50"
        />

        {/* Error state */}
        {status === 'error' && (
          <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-400 leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-600">
            Press <kbd className="bg-slate-800 border border-slate-700 rounded px-1 text-slate-400 text-[10px]">Enter</kbd> to parse · <kbd className="bg-slate-800 border border-slate-700 rounded px-1 text-slate-400 text-[10px]">Shift+Enter</kbd> for new line
          </p>
          <button
            onClick={handleParse}
            disabled={status === 'loading' || !text.trim()}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-2 rounded-xl transition-all active:scale-95 shadow-md shadow-violet-500/20"
          >
            {status === 'loading' ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Parsing…
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Auto-fill
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Maps a ParsedExpense (name strings) to an AIPrefill (member IDs).
 * Unrecognised names are silently skipped.
 */
function resolvePrefill(parsed: ParsedExpense, members: GroupMember[]): AIPrefill {
  const payerId =
    matchMemberByName(parsed.paidBy, members) ?? members[0]?.id ?? '';

  const selectedIds = parsed.participants
    .map(name => matchMemberByName(name, members))
    .filter((id): id is string => Boolean(id));

  // Deduplicate while preserving order
  const uniqueIds = [...new Set(selectedIds)];

  // By default, if Groq doesn't explicitly mention multiple participants
  // for an equal split, we assume they mean "split equally among everyone".
  let finalSelectedIds = uniqueIds;
  if (parsed.splitMode === 'equal' && uniqueIds.length <= 1) {
    finalSelectedIds = members.map(m => m.id);
  } else if (uniqueIds.length === 0) {
    finalSelectedIds = members.map(m => m.id);
  }

  const customValues: Record<string, string> = {};
  if (parsed.splits) {
    Object.entries(parsed.splits).forEach(([name, value]) => {
      const id = matchMemberByName(name, members);
      if (id) customValues[id] = String(value);
    });
  }

  return {
    description: parsed.description,
    amount: String(parsed.amount),
    payerId,
    selectedIds: finalSelectedIds,
    splitMode: parsed.splitMode,
    customValues,
  };
}
