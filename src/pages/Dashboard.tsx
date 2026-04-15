import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import type { GroupWithStats } from '../hooks/useGroups';
import { GroupCard } from '../components/GroupCard';
import { Plus, RefreshCw, Layers, LayoutGrid } from 'lucide-react';

export default function Dashboard() {
  const [groups, setGroups] = useState<GroupWithStats[]>([]);
  const { fetchGroups, loading, error } = useGroups();

  const loadGroups = async () => {
    const data = await fetchGroups();
    setGroups(data);
  };

  useEffect(() => {
    loadGroups();
  }, [fetchGroups]);

  if (loading && groups.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-emerald-500/20 rounded-full"></div>
          <div className="w-12 h-12 border-4 border-t-emerald-500 rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-slate-400 font-medium animate-pulse">Fetching your groups...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <LayoutGrid className="text-emerald-500" size={32} />
            Your <span className="text-emerald-400">Groups</span>
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Manage and split expenses with your favorite circles.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadGroups}
            className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-700"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link 
            to="/groups/create"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Create Group
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* Group Grid */}
      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[2.5rem] py-20 px-6 flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center text-slate-600">
            <Layers size={40} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">No groups yet</h3>
            <p className="text-slate-400 max-w-sm mx-auto">
              You haven't joined or created any groups. Start by creating your first group to manage expenses!
            </p>
          </div>
          <Link 
            to="/groups/create"
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-2xl transition-all border border-slate-700"
          >
            <Plus size={20} />
            Create Your First Group
          </Link>
        </div>
      )}
    </div>
  );
}
