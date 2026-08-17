'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  side = 'right',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sideClasses = side === 'right' ? 'right-0 border-l' : 'left-0 border-r';

  return (
    <div className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur-xs">
      <div className="flex-1" onClick={onClose} />
      <div
        className={`fixed top-0 bottom-0 ${sideClasses} w-full max-w-md bg-bg-surface border-border-subtle shadow-2xl flex flex-col z-50`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-surface-elevated/40">
          {title && <h3 className="text-base font-semibold text-txt-primary">{title}</h3>}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-txt-muted hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};
