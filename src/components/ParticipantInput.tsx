import React from 'react';
import { User, X } from 'lucide-react';

export interface Participant {
  id: string; // temp id for list management
  nickname: string;
  color: string;
}

interface ParticipantInputProps {
  participants: Participant[];
  onChange: (participants: Participant[]) => void;
  maxParticipants?: number;
}

const COLORS = [
  '#f43f5e', // rose-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#71717a', // zinc-500
];

export const ParticipantInput: React.FC<ParticipantInputProps> = ({ 
  participants, 
  onChange, 
  maxParticipants = 3 
}) => {
  const addParticipant = () => {
    if (participants.length >= maxParticipants) return;
    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      nickname: '',
      color: COLORS[participants.length % COLORS.length]
    };
    onChange([...participants, newParticipant]);
  };

  const removeParticipant = (id: string) => {
    onChange(participants.filter(p => p.id !== id));
  };

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    onChange(participants.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-300">
          Participants <span className="text-slate-500 font-normal">(up to {maxParticipants})</span>
        </label>
        {participants.length < maxParticipants && (
          <button
            type="button"
            onClick={addParticipant}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors py-1 px-2 rounded-lg bg-emerald-400/10 border border-emerald-400/20"
          >
            + Add Person
          </button>
        )}
      </div>

      <div className="space-y-3">
        {participants.map((p, index) => (
          <div 
            key={p.id} 
            className="group flex items-center gap-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800 transition-all hover:border-slate-700 animate-in fade-in slide-in-from-left-2"
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 transition-transform group-hover:scale-105"
              style={{ backgroundColor: p.color }}
            >
              <User size={20} />
            </div>

            <div className="flex-1">
              <input
                type="text"
                value={p.nickname}
                onChange={(e) => updateParticipant(p.id, { nickname: e.target.value })}
                placeholder={`Participant ${index + 1} name`}
                className="bg-transparent block w-full border-none focus:ring-0 text-slate-200 placeholder-slate-600 text-sm font-medium p-0"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateParticipant(p.id, { color: c })}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${p.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => removeParticipant(p.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}

        {participants.length === 0 && (
          <div className="text-center py-6 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
            No participants added yet.
          </div>
        )}
      </div>
    </div>
  );
};
