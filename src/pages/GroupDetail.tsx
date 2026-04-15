import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useExpenses } from '../hooks/useExpenses';
import { useAuth } from '../hooks/useAuth';
import { calculateBalances } from '../lib/balanceEngine';
import { summarizeHistoryNL } from '../lib/mintSense';
import { SummaryCards } from '../components/SummaryCards';
import { BalanceMatrix } from '../components/BalanceMatrix';
import { SettlementCard } from '../components/SettlementCard';
import { ContributionChart } from '../components/ContributionChart';
import { ExpenseHistoryList } from '../components/ExpenseHistoryList';
import type { GroupMember } from '../types';
import type { ExpenseWithSplits } from '../types';
import {
  ArrowLeft, PlusCircle, Settings,
  BarChart2, Table2, Receipt, Handshake,
  Sparkles, Loader2
} from 'lucide-react';

interface GroupData {
  id: string;
  name: string;
  group_members: GroupMember[];
}

type Tab = 'overview' | 'matrix' | 'settlements' | 'history';

const TABS: { id: Tab; label: string; icon: typeof BarChart2 }[] = [
  { id: 'overview',     label: 'Overview',     icon: BarChart2 },
  { id: 'matrix',       label: 'Balance Table', icon: Table2 },
  { id: 'settlements',  label: 'Settlements',   icon: Handshake },
  { id: 'history',      label: 'History',       icon: Receipt },
];

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { fetchExpenses, deleteExpense, createExpense } = useExpenses(id ?? '');

  const [group, setGroup]       = useState<GroupData | null>(null);
  const [expenses, setExpenses] = useState<ExpenseWithSplits[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const loadAll = useCallback(async () => {
    if (!id) return;
    const { data: groupData, error } = await supabase
      .from('groups')
      .select('*, group_members(*)')
      .eq('id', id)
      .single();

    if (error) { navigate('/'); return; }
    setGroup(groupData);

    const expData = await fetchExpenses();
    setExpenses(expData);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Balance engine ─────────────────────────────── */
  const { netBalances, settlements } = calculateBalances(expenses);
  const members = group?.group_members ?? [];
  const currentUserMember = members.find(m => m.user_id === user?.id);
  const currentUserId = currentUserMember?.id ?? '';

  /* ── Derived summary numbers ─────────────────────── */
  const realExpenses = expenses.filter(e => e.description !== 'Settled Debt');
  const totalSpent = realExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const myNet      = netBalances[currentUserId] ?? 0;
  const totalOwedToYou = myNet > 0 ? myNet : 0;
  const totalYouOwe    = myNet < 0 ? Math.abs(myNet) : 0;

  /* ── Handlers ────────────────────────────────────── */
  const handleDelete = async (expenseId: string) => {
    if (!confirm('Delete this expense? This cannot be undone.')) return;
    await deleteExpense(expenseId);
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };

  // Insert a settlement record and refresh data.
  const [settledPairs, setSettledPairs] = useState<Set<string>>(new Set());
  const handleMarkSettled = async (from: string, to: string, amount: number) => {
    // Optimistically hide it
    setSettledPairs(prev => new Set([...prev, `${from}:${to}`]));
    try {
      const today = new Date().toISOString().split('T')[0];
      await createExpense({
        group_id: id ?? '',
        description: 'Settled Debt',
        amount: amount,
        paid_by: from,
        date: today,
        split_mode: 'exact',
        splits: [{ participant_id: to, amount: amount, percentage: null }],
      });
      loadAll();
    } catch (err) {
      console.error(err);
      alert('Failed to settle debt.');
      setSettledPairs(prev => {
        const next = new Set(prev);
        next.delete(`${from}:${to}`);
        return next;
      });
    }
  };
  const activeSettlements = settlements.filter(s =>
    !settledPairs.has(`${s.from}:${s.to}`)
  );

  const handleGenerateSummary = async () => {
    setLoadingAi(true);
    setAiSummary(null);
    try {
      const summary = await summarizeHistoryNL(realExpenses, members, netBalances);
      setAiSummary(summary);
    } catch (e: any) {
      setAiSummary(e.message || 'Failed to generate insight.');
    } finally {
      setLoadingAi(false);
    }
  };

  /* ── Render ───────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-emerald-500/20 rounded-full" />
          <div className="w-12 h-12 border-4 border-t-emerald-500 rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-slate-400 animate-pulse">Loading dashboard…</p>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">

      {/* ── Header ───────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            to="/"
            className="text-slate-500 hover:text-emerald-400 flex items-center gap-1.5 mb-3 text-sm transition-colors group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
            All Groups
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {group.name}
          </h1>
          {/* Member avatars */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex -space-x-2">
              {members.slice(0, 5).map((m, i) => (
                <div
                  key={m.id}
                  title={m.nickname ?? 'Member'}
                  className="w-7 h-7 rounded-full border-2 border-slate-950 flex items-center justify-center text-[9px] font-black text-white"
                  style={{ backgroundColor: m.color ?? '#64748b', zIndex: 10 - i }}
                >
                  {(m.nickname ?? 'M').charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-slate-500 text-sm">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <Link
            to={`/groups/${id}/edit`}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-700 transition-all"
          >
            <Settings size={19} />
          </Link>
          <Link
            to={`/groups/${id}/expenses/add`}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all text-sm group"
          >
            <PlusCircle size={17} className="group-hover:rotate-90 transition-transform duration-300" />
            Add Expense
          </Link>
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────────── */}
      <SummaryCards
        totalSpent={totalSpent}
        totalOwedToYou={totalOwedToYou}
        totalYouOwe={totalYouOwe}
      />

      {/* ── Tab Nav ───────────────────────────────────── */}
      <div className="flex overflow-x-auto gap-1 bg-slate-900/50 p-1 rounded-2xl border border-slate-800 scrollbar-none">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const badge = tab.id === 'settlements' && activeSettlements.length > 0
            ? activeSettlements.length : 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{tab.label}</span>
              {badge > 0 && (
                <span className="w-5 h-5 bg-emerald-500 rounded-full text-white text-[10px] font-black flex items-center justify-center">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Panels ────────────────────────────────── */}

      {/* Overview — chart + quick settlements */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* MintSense Insights Card */}
          <section className="bg-gradient-to-br from-violet-500/10 via-slate-900/60 to-emerald-500/5 border border-violet-500/30 rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-violet-500/5 hover:border-violet-500/50 transition-colors duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    MintSense AI Insights
                  </h2>
                  <p className="text-sm text-slate-400">Summarize group activity instantly.</p>
                </div>
              </div>
              <button
                onClick={handleGenerateSummary}
                disabled={loadingAi || realExpenses.length === 0}
                className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                {loadingAi ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {aiSummary ? 'Regenerate' : 'Generate Summary'}
              </button>
            </div>
            
            {(aiSummary || loadingAi) && (
              <div className="mt-5 p-4 bg-slate-950/60 rounded-2xl border border-violet-500/20 text-slate-300 text-[15px] leading-relaxed relative z-10 animate-in fade-in zoom-in-95">
                {loadingAi ? (
                  <div className="flex items-center gap-2.5 text-violet-400 font-medium animate-pulse">
                    <Sparkles size={16} className="animate-pulse" /> 
                    <span>Reading {realExpenses.length} transactions...</span>
                  </div>
                ) : (
                  <p dangerouslySetInnerHTML={{ 
                    __html: (aiSummary || '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') 
                  }} />
                )}
              </div>
            )}
          </section>

          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <BarChart2 size={18} className="text-emerald-400" />
              Member Contributions
            </h2>
            <ContributionChart expenses={realExpenses} members={members} />
            <p className="text-xs text-slate-600 mt-3 text-center">
              Bars show amount each member paid vs. what they owe
            </p>
          </section>

          {activeSettlements.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <Handshake size={18} className="text-emerald-400" />
                Quick Settlements
              </h2>
              <div className="space-y-2">
                {activeSettlements.slice(0, 3).map((s, i) => (
                  <SettlementCard
                    key={i}
                    settlement={s}
                    members={members}
                    onMarkSettled={handleMarkSettled}
                  />
                ))}
                {activeSettlements.length > 3 && (
                  <button
                    onClick={() => setActiveTab('settlements')}
                    className="text-sm text-emerald-400 hover:underline pl-2"
                  >
                    View all {activeSettlements.length} settlements →
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Balance Matrix */}
      {activeTab === 'matrix' && (
        <div className="animate-in fade-in duration-300 space-y-3">
          <p className="text-sm text-slate-500 px-1">
            Row = who owes · Column = they owe this person · Your row is highlighted.
          </p>
          <BalanceMatrix
            members={members}
            netBalances={netBalances}
            settlements={settlements}
            currentUserId={currentUserId}
          />
        </div>
      )}

      {/* All Settlements */}
      {activeTab === 'settlements' && (
        <div className="space-y-3 animate-in fade-in duration-300">
          {activeSettlements.length === 0 ? (
            <div className="text-center py-14 text-slate-500">
              <Handshake size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">All settled up!</p>
              <p className="text-sm mt-1">No outstanding payments.</p>
            </div>
          ) : (
            activeSettlements.map((s, i) => (
              <SettlementCard
                key={i}
                settlement={s}
                members={members}
                onMarkSettled={handleMarkSettled}
              />
            ))
          )}
        </div>
      )}

      {/* Expense History */}
      {activeTab === 'history' && (
        <div className="animate-in fade-in duration-300">
          <ExpenseHistoryList
            expenses={expenses}
            members={members}
            currentUserId={currentUserId}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
}
