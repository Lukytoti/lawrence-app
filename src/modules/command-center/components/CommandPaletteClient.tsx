'use client';

import React, { useState, useEffect } from 'react';
import { CommandItem } from '../types';
import { COMMAND_REGISTRY } from '../commands';
import { Search, Sparkles, X, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CommandPaletteClientProps {
  isOpen: boolean;
  onClose: () => void;
  actorUserId: string;
}

export const CommandPaletteClient: React.FC<CommandPaletteClientProps> = ({
  isOpen,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const filteredCommands = COMMAND_REGISTRY.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          executeCommand(selected);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  if (!isOpen) return null;

  const executeCommand = (cmd: CommandItem) => {
    onClose();
    if (cmd.targetRoute) {
      router.push(cmd.targetRoute);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-wine-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search (e.g. 'Search Client', 'Create Invoice')..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 outline-none"
            autoFocus
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">No matching commands found.</div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <div
                key={cmd.id}
                onClick={() => executeCommand(cmd)}
                className={`flex items-center justify-between p-3 rounded-lg text-sm cursor-pointer transition-colors ${
                  idx === selectedIndex ? 'bg-wine-950/80 border border-wine-800/60 text-white' : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">{cmd.category}</span>
                  <span className="font-medium">{cmd.label}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Navigate with <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">↑</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">↓</kbd></span>
          <span>Select with <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Enter</kbd></span>
          <span>Close with <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">Esc</kbd></span>
        </div>
      </div>
    </div>
  );
};
