'use client';

import React, { useState } from 'react';
import { BookOpen, Save, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { updateKnowledgeEntryAction, publishKnowledgeEntryAction } from '../actions';

interface KnowledgeEditorProps {
  entry: any;
  currentUserId: string;
}

export default function KnowledgeEditorClient({ entry: initialEntry, currentUserId }: KnowledgeEditorProps) {
  const [entry, setEntry] = useState(initialEntry);
  const [title, setTitle] = useState(entry.title);
  const [content, setContent] = useState(entry.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMsg('');
    try {
      const updated = await updateKnowledgeEntryAction(entry.id, { title, content }, currentUserId);
      setEntry(updated);
      setMsg('Saved successfully');
    } catch (err: any) {
      setMsg(err.message || 'Save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    setMsg('');
    try {
      const pub = await publishKnowledgeEntryAction(entry.id, currentUserId);
      setEntry(pub);
      setMsg('Published successfully');
    } catch (err: any) {
      setMsg(err.message || 'Publish failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111113] border border-white/10 rounded-xl p-6">
        <div>
          <Link
            href="/documents/knowledge"
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Knowledge Base
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-500" />
            Edit Knowledge Article
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {entry.status !== 'PUBLISHED' && (
            <button
              onClick={handlePublish}
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition"
            >
              Publish Article
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg text-xs">
          {msg}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[#111113] border border-white/10 rounded-xl p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
            Article Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
            Article Content (Markdown)
          </label>
          <textarea
            rows={14}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-[#18181B] border border-white/10 rounded-lg p-3 text-sm text-white font-mono leading-relaxed focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving...' : 'Save Draft Changes'}
        </button>
      </form>
    </div>
  );
}
