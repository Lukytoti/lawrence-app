'use client';

import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  Edit2,
  Trash2,
  Move,
  FileText,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { createFolderAction, renameFolderAction, deleteFolderAction } from '../actions';

interface FolderBrowserProps {
  initialFolders: any[];
  currentUserId: string;
}

export default function FolderBrowserClient({
  initialFolders,
  currentUserId,
}: FolderBrowserProps) {
  const [folders, setFolders] = useState(initialFolders);
  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [parentFolderId, setParentFolderId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const newFolder = await createFolderAction(
        {
          name: folderName,
          description,
          parentFolderId: parentFolderId || undefined,
        },
        currentUserId
      );

      setFolders([...folders, newFolder]);
      setFolderName('');
      setDescription('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? Non-empty folders cannot be deleted.')) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await deleteFolderAction(folderId, currentUserId);
      setFolders(folders.filter((f) => f.id !== folderId));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111113] border border-white/10 rounded-xl p-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
            <Folder className="w-6 h-6 text-amber-500" />
            Folder & Directory Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Organize documents into structured folders with circular-move prevention and visibility controls.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg text-xs">
          {errorMsg}
        </div>
      )}

      {/* Create Folder Form */}
      <div className="bg-[#111113] border border-white/10 rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <FolderPlus className="w-4 h-4 text-amber-500" />
          Create New Folder
        </h2>
        <form onSubmit={handleCreateFolder} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
              Folder Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Legal & Contracts"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
              Parent Folder (Optional)
            </label>
            <select
              value={parentFolderId}
              onChange={(e) => setParentFolderId(e.target.value)}
              className="w-full bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-sm text-gray-300 focus:outline-none focus:border-amber-500"
            >
              <option value="">None (Top-level folder)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>

      {/* Folders List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {folders.map((f) => (
          <div
            key={f.id}
            className="bg-[#111113] border border-white/10 rounded-xl p-5 hover:border-amber-500/50 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <Folder className="w-6 h-6 text-amber-400" />
                <span className="text-xs font-mono text-gray-500">{f.folderCode}</span>
              </div>
              <h3 className="font-semibold text-white text-base">{f.name}</h3>
              {f.description && <p className="text-xs text-gray-400 mt-1">{f.description}</p>}
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5 text-xs text-gray-400">
              <span>{f.visibility}</span>
              <button
                onClick={() => handleDeleteFolder(f.id)}
                className="text-red-400 hover:text-red-300 transition p-1"
                title="Delete Folder"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
