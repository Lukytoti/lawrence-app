'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAVIGATION_CONFIG, NavItemConfig, NavGroupConfig } from '@/config/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  LayoutDashboard,
  Sun,
  Inbox,
  GitFork,
  Users,
  Award,
  TrendingUp,
  CheckSquare,
  Activity,
  Target,
  FileText,
  BookOpen,
  GraduationCap,
  Zap,
  UserPlus,
  Briefcase,
  FolderKanban,
  Share2,
  DollarSign,
  CreditCard,
  Receipt,
  MessageSquare,
  Mail,
  Megaphone,
  Compass,
  UserCheck,
  Star,
  UserCog,
  ShieldAlert,
  Settings,
  ScrollText,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-4 h-4" />,
  Sun: <Sun className="w-4 h-4" />,
  Inbox: <Inbox className="w-4 h-4" />,
  GitFork: <GitFork className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  Award: <Award className="w-4 h-4" />,
  TrendingUp: <TrendingUp className="w-4 h-4" />,
  CheckSquare: <CheckSquare className="w-4 h-4" />,
  Activity: <Activity className="w-4 h-4" />,
  Target: <Target className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
  GraduationCap: <GraduationCap className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  UserPlus: <UserPlus className="w-4 h-4" />,
  Briefcase: <Briefcase className="w-4 h-4" />,
  FolderKanban: <FolderKanban className="w-4 h-4" />,
  Share2: <Share2 className="w-4 h-4" />,
  DollarSign: <DollarSign className="w-4 h-4" />,
  CreditCard: <CreditCard className="w-4 h-4" />,
  Receipt: <Receipt className="w-4 h-4" />,
  MessageSquare: <MessageSquare className="w-4 h-4" />,
  Mail: <Mail className="w-4 h-4" />,
  Megaphone: <Megaphone className="w-4 h-4" />,
  Compass: <Compass className="w-4 h-4" />,
  UserCheck: <UserCheck className="w-4 h-4" />,
  Star: <Star className="w-4 h-4" />,
  UserCog: <UserCog className="w-4 h-4" />,
  ShieldAlert: <ShieldAlert className="w-4 h-4" />,
  Settings: <Settings className="w-4 h-4" />,
  ScrollText: <ScrollText className="w-4 h-4" />,
};

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userPermissions?: string[];
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  userPermissions = [],
  isMobileOpen = false,
  onMobileClose,
}) => {
  const pathname = usePathname();

  const renderNavGroup = (group: NavGroupConfig) => {
    // Filter items by permission if defined
    const visibleItems = group.items.filter(
      (item) => !item.requiredPermission || userPermissions.includes(item.requiredPermission)
    );

    if (visibleItems.length === 0) return null;

    return (
      <div key={group.id} className="py-2">
        {!isCollapsed && (
          <div className="px-3 mb-1 text-[10px] font-bold tracking-widest text-txt-muted uppercase">
            {group.label}
          </div>
        )}
        <div className="space-y-0.5">
          {visibleItems.map((item) => {
            const isActive = pathname ? (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))) : false;
            const icon = ICON_MAP[item.iconName] || <LayoutDashboard className="w-4 h-4" />;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onMobileClose}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition duration-150 group ${
                  isActive
                    ? 'bg-wine-deep/90 text-white border-l-2 border-wine-primary font-semibold shadow-sm'
                    : 'text-txt-muted hover:text-txt-primary hover:bg-bg-surface-elevated/60'
                }`}
              >
                <div className={`${isActive ? 'text-wine-text' : 'text-txt-muted group-hover:text-txt-primary'}`}>
                  {icon}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    {item.badge && <Badge variant="wine">{item.badge}</Badge>}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 bg-bg-surface border-r border-border-subtle flex flex-col transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border-subtle bg-bg-surface-elevated/30">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-wine-deep border border-wine-primary/60 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
            L
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-wider text-txt-primary uppercase">
                Lawrence OS
              </span>
              <span className="text-[10px] text-txt-muted font-mono">v1.0 Foundation</span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1 rounded hover:bg-zinc-800 text-txt-muted hover:text-white"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Grouped Navigation Config */}
      <nav className="flex-1 overflow-y-auto p-2 divide-y divide-border-subtle/40">
        {NAVIGATION_CONFIG.map(renderNavGroup)}
      </nav>

      {/* Footer Security Badge */}
      {!isCollapsed && (
        <div className="p-3 border-t border-border-subtle bg-bg-surface-elevated/20 text-[11px] text-txt-muted flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-wine-text" />
          <span>Dynamic RBAC Security Enforced</span>
        </div>
      )}
    </aside>
  );
};
