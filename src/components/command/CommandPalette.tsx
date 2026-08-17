'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Command, ArrowRight } from 'lucide-react';
import { NAVIGATION_CONFIG, NavItemConfig } from '@/config/navigation';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const router = RouterHook();

  function RouterHook() {
    return useRouter();
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open trigger handled outside
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allItems: (NavItemConfig & { groupName: string })[] = [];
  NAVIGATION_CONFIG.forEach((group) => {
    group.items.forEach((item) => {
      allItems.push({ ...item, groupName: group.label });
    });
  });

  const filteredItems = query.trim()
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.groupName.toLowerCase().includes(query.toLowerCase()) ||
          item.href.toLowerCase().includes(query.toLowerCase())
      )
    : allItems.slice(0, 8);

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-bg-surface border border-border-subtle rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-border-subtle bg-bg-surface-elevated/50">
          <Search className="w-5 h-5 text-txt-muted mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search commands, modules, settings... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-txt-primary placeholder:text-txt-muted outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-txt-muted hover:text-white mr-2">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border border-border-strong text-txt-muted">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border-subtle/30">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-sm text-txt-muted">No commands found for "{query}"</div>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.href)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-bg-surface-elevated text-left group transition duration-100"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-zinc-800 text-wine-text group-hover:bg-wine-deep transition">
                    <Command className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-txt-primary group-hover:text-white">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-txt-muted">{item.groupName} • {item.href}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-txt-muted opacity-0 group-hover:opacity-100 transition" />
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border-subtle bg-bg-surface-elevated/30 text-[11px] text-txt-muted flex justify-between">
          <span>Use search to quickly access modules</span>
          <span className="font-mono">Navigation Engine v1.0</span>
        </div>
      </div>
    </div>
  );
};
