import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import { ParticipantInput } from '../components/ParticipantInput';
import type { Participant } from '../components/ParticipantInput';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Settings, 
  Loader2, 
  AlertCircle,
  Info
} from 'lucide-react';

export default function EditGroup() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deleteGroup, error: hookError } = useGroups();
  
  const [name, setName] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      if (!id) return;
      try {
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .select(`
            *,
            group_members (*)
          `)
          .eq('id', id)
          .single();

        if (groupError) throw groupError;

        setName(group.name);
        // Map existing members to Participant format (excluding the current user which is handled differently)
        // For simplicity in this demo, we'll allow editing all besides the "You" placeholder
        const mappedParticipants = group.group_members
          .filter((m: any) => m.nickname !== 'You')
          .map((m: any) => ({
            id: m.id,
            nickname: m.nickname,
            color: m.color
          }));
        setParticipants(mappedParticipants);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name.trim()) return;
    setSaving(true);
    setError(null);

    try {
      // 1. Update Group Name
      const { error: groupError } = await supabase
        .from('groups')
        .update({ name })
        .eq('id', id);

      if (groupError) throw groupError;

      // 2. Member management
      // This is a complex operation in production (syncing list).
      // For this MVP, we will only allow ADDING new members or UPDATING existing ones.
      // Full sync logic would involve finding diffs.
      
      const { data: existingMembers } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', id);

      const existingIds = new Set(existingMembers?.map(m => m.id) || []);

      for (const p of participants) {
        if (existingIds.has(p.id)) {
          // Update
          await supabase
            .from('group_members')
            .update({ nickname: p.nickname, color: p.color })
            .eq('id', p.id);
        } else {
          // Insert new
          await supabase
            .from('group_members')
            .insert({ group_id: id, nickname: p.nickname, color: p.color });
        }
      }

      navigate(`/groups/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this group? All expenses and splits will be permanently removed.')) return;

    try {
      await deleteGroup(id);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500 mb-4" size={32} />
        <p className="text-slate-400">Loading group settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <Link 
          to={`/groups/${id}`} 
          className="text-slate-500 hover:text-emerald-400 flex items-center gap-2 mb-4 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Group
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <Settings className="text-emerald-500" size={32} />
            Group <span className="text-emerald-400">Settings</span>
          </h1>
          <button
            onClick={handleDelete}
            className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all group border border-transparent hover:border-rose-500/20"
            title="Delete Group"
          >
            <Trash2 size={22} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8 pb-12">
        {(error || hookError) && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error || hookError}</span>
          </div>
        )}

        <section className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 backdrop-blur-sm">
          <label className="block text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">
            Group Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-950 block w-full px-5 py-4 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-lg font-semibold"
          />
        </section>

        <section className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 backdrop-blur-sm">
          <ParticipantInput 
            participants={participants} 
            onChange={setParticipants} 
            maxParticipants={5} // Allow more when editing
          />
        </section>

        <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex items-start gap-3">
          <Info className="text-emerald-400 shrink-0 mt-0.5" size={18} />
          <p className="text-xs text-slate-400 leading-relaxed">
            Note: Deleting a group will remove all associated expenses and split records. This action cannot be undone. 
            Currently, you can add new participants or update existing ones. Participant removal is disabled to prevent accidental data loss for existing expenses.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(`/groups/${id}`)}
            className="flex-1 py-4 px-6 border border-slate-800 rounded-2xl text-slate-400 font-bold hover:bg-slate-800/50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name}
            className="flex-[2] py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Save Changes
                <Save size={20} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
