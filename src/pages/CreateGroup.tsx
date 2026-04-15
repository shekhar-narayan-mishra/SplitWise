import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import { ParticipantInput } from '../components/ParticipantInput';
import type { Participant } from '../components/ParticipantInput';
import { ArrowLeft, PlusCircle, Loader2, AlertCircle } from 'lucide-react';

export default function CreateGroup() {
  const [name, setName] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const { createGroup, loading, error } = useGroups();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      // 1. Filter out empty nicknames
      const validParticipants = participants.filter(p => p.nickname.trim() !== '');
      
      // 2. Create the group
      await createGroup(name, validParticipants);
      
      // 3. Success! Go back to dashboard
      navigate('/');
    } catch (err) {
      // Error handled by useGroups
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link 
            to="/" 
            className="text-slate-500 hover:text-emerald-400 flex items-center gap-2 mb-4 transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Create <span className="text-emerald-400">New Group</span>
          </h1>
          <p className="text-slate-400 mt-2">Set up a group to start splitting expenses with friends.</p>
        </div>
        <div className="hidden sm:block">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <PlusCircle size={32} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Group Name Section */}
        <section className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 backdrop-blur-sm">
          <label htmlFor="groupName" className="block text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">
            Group Name
          </label>
          <input
            id="groupName"
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-950 block w-full px-5 py-4 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-lg font-semibold"
            placeholder="e.g. Goa Trip 2024, Flatmates, Weekend Trek"
          />
        </section>

        {/* Participants Section */}
        <section className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 backdrop-blur-sm">
          <ParticipantInput 
            participants={participants} 
            onChange={setParticipants} 
            maxParticipants={3}
          />
        </section>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 py-4 px-6 border border-slate-800 rounded-2xl text-slate-400 font-bold hover:bg-slate-800/50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name}
            className="flex-[2] py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Create Group
                <PlusCircle size={20} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
