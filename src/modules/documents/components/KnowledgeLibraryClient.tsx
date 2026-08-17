'use client';

import React, { useState } from 'react';
import { BookOpen, Plus, Search, CheckCircle2, Folder, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import {
  createKnowledgeCollectionAction,
  createKnowledgeEntryAction,
  publishKnowledgeEntryAction,
} from '../actions';

interface KnowledgeLibraryProps {
  collections: any[];
  entries: any[];
  currentUserId: string;
}

export default function KnowledgeLibraryClient({
  collections: initialCollections,
  entries: initialEntries,
  currentUserId,
}: KnowledgeLibraryProps) {
  const [collections, setCollections] = useState(initialCollections);
  const [entries, setEntries] = useState(initialEntries);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState('ALL');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showColModal, setShowColModal] = useState(false);

  // Form States
  const [colName, setColName] = useState('');
  const [colDesc, setColDesc] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [targetColId, setTargetColId] = useState(collections[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colName) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const newCol = await createKnowledgeCollectionAction({ name: colName, description: colDesc }, currentUserId);
      setCollections([...collections, newCol]);
      setShowColModal(false);
      setColName('');
      setColDesc('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryTitle || !entryContent || !targetColId) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const newEntry = await createKnowledgeEntryAction(
        { collectionId: targetColId, title: entryTitle, content: entryContent },
        currentUserId
      );
      setEntries([newEntry, ...entries]);
      setShowEntryModal(false);
      setEntryTitle('');
      setEntryContent('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create article');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (entryId: string) => {
    setIsSubmitting(true);
    try {
      const published = await publishKnowledgeEntryAction(entryId, currentUserId);
      setEntries(entries.map((e) => (e.id === entryId ? { ...e, status: 'PUBLISHED' } : e)));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEntries = entries.filter((e) => {
    const matchesQuery =
      !searchQuery ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCol = selectedCollectionId === 'ALL' || e.collectionId === selectedCollectionId;
    return matchesQuery && matchesCol;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111113] border border-white/10 rounded-xl p-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-emerald-500" />
            Organizational Knowledge Base & SOPs
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Authoritative knowledge collections, standard operating procedures, and AI-searchable articles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowColModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#18181B] hover:bg-[#222226] text-gray-200 border border-white/10 rounded-lg text-xs font-medium transition"
          >
            <Folder className="w-4 h-4 text-emerald-400" />
            New Collection
          </button>
          <button
            onClick={() => setShowEntryModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition"
          >
            <Plus className="w-4 h-4" />
            New Article
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg text-xs">
          {errorMsg}
        </div>
      )}

      {/* Filter / Search */}
      <div className="bg-[#111113] border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search knowledge articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181B] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <select
          value={selectedCollectionId}
          onChange={(e) => setSelectedCollectionId(e.target.value)}
          className="bg-[#18181B] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="ALL">All Collections</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Knowledge Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntries.map((item) => (
          <div
            key={item.id}
            className="bg-[#111113] border border-white/10 rounded-xl p-5 flex flex-col justify-between hover:border-emerald-500/40 transition"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-emerald-400">{item.collection?.name || 'General'}</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    item.status === 'PUBLISHED'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <h3 className="font-bold text-white text-base mb-2">{item.title}</h3>
              <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{item.content}</p>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5 text-xs text-gray-400">
              <span>By {item.author?.name || 'Author'}</span>
              {item.status !== 'PUBLISHED' && (
                <button
                  onClick={() => handlePublish(item.id)}
                  disabled={isSubmitting}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition"
                >
                  Publish
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Collection Modal */}
      {showColModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181B] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-white mb-3">Create Knowledge Collection</h2>
            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Collection Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Engineering SOPs"
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  className="w-full bg-[#111113] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Knowledge domain scope..."
                  value={colDesc}
                  onChange={(e) => setColDesc(e.target.value)}
                  className="w-full bg-[#111113] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowColModal(false)}
                  className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Entry Modal */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181B] border border-white/10 rounded-2xl w-full max-w-xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">Create Knowledge Article</h2>
            <form onSubmit={handleCreateEntry} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Collection *
                </label>
                <select
                  value={targetColId}
                  onChange={(e) => setTargetColId(e.target.value)}
                  className="w-full bg-[#111113] border border-white/10 rounded-lg p-2.5 text-sm text-gray-300 focus:outline-none focus:border-emerald-500"
                >
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Qualification Standard Operating Procedure"
                  value={entryTitle}
                  onChange={(e) => setEntryTitle(e.target.value)}
                  className="w-full bg-[#111113] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Article Content (Markdown / Text) *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Enter detailed knowledge, instructions, or rules..."
                  value={entryContent}
                  onChange={(e) => setEntryContent(e.target.value)}
                  className="w-full bg-[#111113] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
                >
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
