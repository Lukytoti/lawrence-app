'use client';

import React from 'react';
import { Menu, Search, Bell, LogOut, ShieldCheck, User } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { signOut } from 'next-auth/react';

export interface TopBarProps {
  onOpenCommand: () => void;
  onOpenNotifications: () => void;
  onToggleMobileMenu: () => void;
  unreadCount?: number;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: string[];
  } | null;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenCommand,
  onOpenNotifications,
  onToggleMobileMenu,
  unreadCount = 0,
  user,
}) => {
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');

  return (
    <header className="h-14 bg-bg-surface/80 backdrop-blur-md border-b border-border-subtle sticky top-0 z-30 flex items-center justify-between px-4 md:px-6">
      {/* Left: Mobile Toggle & Search Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-md text-txt-muted hover:text-white hover:bg-zinc-800"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Command Trigger */}
        <button
          onClick={onOpenCommand}
          className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-bg-surface-elevated/70 border border-border-subtle text-txt-muted hover:text-txt-primary hover:border-border-strong text-xs w-48 md:w-72 transition"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left truncate">Search system...</span>
          <kbd className="hidden sm:inline-block font-mono text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-txt-muted border border-zinc-700">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Notifications & User Profile Menu */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg text-txt-muted hover:text-white hover:bg-bg-surface-elevated transition"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-wine-primary"></span>
            </span>
          )}
        </button>

        <div className="h-4 w-px bg-border-subtle" />

        {/* User Menu */}
        <div className="flex items-center gap-2.5">
          <Avatar src={user?.image} name={user?.name || 'User'} size="sm" />
          <div className="hidden sm:flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-txt-primary">{user?.name || 'Oluwatobi (Admin)'}</span>
              {isSuperAdmin && (
                <span title="Super Admin Role">
                  <ShieldCheck className="w-3.5 h-3.5 text-wine-text" />
                </span>
              )}
            </div>
            <span className="text-[10px] text-txt-muted truncate max-w-[140px]">
              {user?.email || 'oluwatobi@lawrenceapp.internal'}
            </span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-1.5 rounded-md text-txt-muted hover:text-red-400 hover:bg-zinc-800 transition ml-1"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
