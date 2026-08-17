'use client';

import React, { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { processAiCommandAction } from '../actions';

interface AiCommandBarClientProps {
  actorUserId: string;
}

export const AiCommandBarClient: React.FC<AiCommandBarClientProps> = ({ actorUserId }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    try {
      const res = await processAiCommandAction(prompt.trim(), actorUserId);
      setResponse(res.response);
    } catch (err: any) {
      setResponse(`AI Assistant Error: ${err?.message || 'Failed to execute prompt.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-wine-900/60 rounded-xl bg-slate-900/80 p-4 shadow-xl backdrop-blur-md">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-wine-400 shrink-0" />
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask Executive AI (e.g., 'Who are my highest risk clients?', 'What invoices are overdue?')"
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 border-none outline-none focus:ring-0"
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="px-4 py-2 text-xs font-semibold text-white bg-wine-800 hover:bg-wine-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>Ask AI</span>
        </button>
      </form>

      {response && (
        <div className="mt-4 p-4 rounded-lg bg-slate-950/80 border border-slate-800 text-sm text-slate-200 leading-relaxed space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-wine-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Executive Co-Pilot</span>
          </div>
          <div className="whitespace-pre-wrap">{response}</div>
        </div>
      )}
    </div>
  );
};
