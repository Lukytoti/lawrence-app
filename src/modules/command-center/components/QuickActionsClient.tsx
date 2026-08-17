'use client';

import React, { useState } from 'react';
import { executeQuickAction } from '../actions';
import { Plus, CheckSquare, Target, Receipt, ShieldAlert, Send, X, Loader2 } from 'lucide-react';

interface QuickActionsClientProps {
  actorUserId: string;
}

export const QuickActionsClient: React.FC<QuickActionsClientProps> = ({ actorUserId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || loading) return;

    setLoading(true);
    try {
      await executeQuickAction('CREATE_TASK', { title, description, priority: 'MEDIUM' }, actorUserId);
      setActiveModal(null);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      alert(`Error creating task: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-wine-800 hover:bg-wine-700 text-white text-xs font-semibold shadow transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Quick Action</span>
      </button>

      {/* Quick Action Selector Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Execute Quick Action</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveModal('TASK');
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-wine-800 text-left transition-colors"
              >
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-sm font-semibold text-white">Create New Task</div>
                  <div className="text-xs text-slate-400">Prompt 04 Productivity Service</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {activeModal === 'TASK' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Productivity Task</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Task Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter task details..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-wine-800 hover:bg-wine-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
