'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Users,
  Award,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { createTrainingAction, assignTrainingAction, updateProgressAction } from '../actions';

interface TrainingCenterClientProps {
  assignments: any[];
  canManage: boolean;
  trainingModules?: any[];
}

export function TrainingCenterClient({ assignments: initialAssignments, canManage, trainingModules = [] }: TrainingCenterClientProps) {
  const [assignments, setAssignments] = useState<any[]>(initialAssignments);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // New Module Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('LEADERSHIP');
  const [content, setContent] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);

  // New Assign Form State
  const [selectedTrainingId, setSelectedTrainingId] = useState(trainingModules[0]?.id || '');
  const [assignedScopeType, setAssignedScopeType] = useState<'INDIVIDUAL' | 'TEAM' | 'ORG'>('INDIVIDUAL');
  const [assignedScopeValue, setAssignedScopeValue] = useState('');

  const filteredAssignments = assignments.filter((a) => {
    if (activeTab === 'ALL') return true;
    return a.status === activeTab;
  });

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createTrainingAction({
        title,
        description,
        category,
        content,
        durationMinutes,
      });

      if (res.success) {
        alert('Training module created successfully!');
        setShowCreateModal(false);
        setTitle('');
        setContent('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create training module');
    }
  };

  const handleAssignTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await assignTrainingAction({
        trainingId: selectedTrainingId,
        assignedScopeType,
        assignedScopeValue,
      });

      if (res.success) {
        alert(`Successfully created ${res.count} assignment(s).`);
        setShowAssignModal(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to assign training');
    }
  };

  const handleCompleteProgress = async (assignmentId: string) => {
    try {
      const res = await updateProgressAction(assignmentId, 100);
      if (res.success) {
        setAssignments(
          assignments.map((a) => (a.id === assignmentId ? { ...a, status: 'COMPLETED' } : a))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update progress');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-white/10 p-6 rounded-xl backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-rose-500" />
            Leadership Training Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Standardized training modules, step-up orientation, and progress verification.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Module
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-red-900 to-wine-800 hover:from-red-800 text-xs font-semibold text-white shadow-lg flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              Assign Training
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Modules', count: assignments.length },
          { id: 'ASSIGNED', label: 'Assigned', count: assignments.filter((a) => a.status === 'ASSIGNED').length },
          { id: 'IN_PROGRESS', label: 'In Progress', count: assignments.filter((a) => a.status === 'IN_PROGRESS').length },
          { id: 'COMPLETED', label: 'Completed', count: assignments.filter((a) => a.status === 'COMPLETED').length },
          { id: 'OVERDUE', label: 'Overdue', count: assignments.filter((a) => a.status === 'OVERDUE').length },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? 'bg-rose-950/60 border border-rose-800/50 text-rose-200'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span>{t.label}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px]">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Grid of Assignments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAssignments.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-900/40 border border-white/5 rounded-xl text-xs text-slate-500">
            No training assignments match the selected status filter.
          </div>
        ) : (
          filteredAssignments.map((a) => {
            const isDone = a.status === 'COMPLETED';

            return (
              <div
                key={a.id}
                className="bg-slate-900/70 border border-white/10 rounded-xl p-6 space-y-4 shadow-xl hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-950 border border-rose-800/40 text-rose-300">
                      {a.training?.category || 'GENERAL'}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">{a.training?.title}</h3>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded font-semibold ${
                      isDone
                        ? 'bg-emerald-950/70 border border-emerald-800/50 text-emerald-300'
                        : a.status === 'OVERDUE'
                        ? 'bg-red-950/70 border border-red-800/50 text-red-300'
                        : 'bg-amber-950/70 border border-amber-800/50 text-amber-300'
                    }`}
                  >
                    {a.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2">{a.training?.description}</p>

                <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-white/5 pt-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {a.training?.durationMinutes} mins
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    By: {a.assignedBy?.name || 'Leader'}
                  </span>
                </div>

                {/* Progress & Action */}
                <div className="pt-2 flex items-center justify-between">
                  {!isDone ? (
                    <button
                      onClick={() => handleCompleteProgress(a.id)}
                      className="w-full py-2 bg-gradient-to-r from-red-900 to-wine-800 hover:from-red-800 text-xs font-semibold text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Completed
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Award className="w-4 h-4" /> Verified Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Module */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Create Training Module</h2>
            <form onSubmit={handleCreateModule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-white"
                >
                  <option value="LEADERSHIP">LEADERSHIP</option>
                  <option value="PRODUCT">PRODUCT</option>
                  <option value="SALES">SALES</option>
                  <option value="NETWORK">NETWORK</option>
                  <option value="ONBOARDING">ONBOARDING</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Content / Guide</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-900 text-white font-medium shadow"
                >
                  Save Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Training */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Assign Training Module</h2>
            <form onSubmit={handleAssignTraining} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Select Module</label>
                <select
                  value={selectedTrainingId}
                  onChange={(e) => setSelectedTrainingId(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-white"
                >
                  {trainingModules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Assignment Scope</label>
                <select
                  value={assignedScopeType}
                  onChange={(e) => setAssignedScopeType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-white"
                >
                  <option value="INDIVIDUAL">INDIVIDUAL (Single Member)</option>
                  <option value="TEAM">TEAM (Team Root Member + CTE Downlines)</option>
                  <option value="ORG">ORG (All Active Organization Members)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  {assignedScopeType === 'TEAM'
                    ? 'Team Root Member ID'
                    : assignedScopeType === 'INDIVIDUAL'
                    ? 'Target Member ID'
                    : 'Scope Value (Optional)'}
                </label>
                <input
                  type="text"
                  required={assignedScopeType !== 'ORG'}
                  placeholder="e.g. member UUID"
                  value={assignedScopeValue}
                  onChange={(e) => setAssignedScopeValue(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-900 text-white font-medium shadow"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
