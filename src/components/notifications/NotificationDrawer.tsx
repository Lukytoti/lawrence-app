'use client';

import React from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Bell, CheckCheck, Info, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string | Date;
}

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WARNING':
      case 'ALERT':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Notification Center" side="right">
      <div className="flex flex-col h-full gap-4">
        {/* Header Summary */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-txt-primary">Notifications</span>
            {unreadCount > 0 && <Badge variant="wine">{unreadCount} unread</Badge>}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-wine-text hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-txt-muted">
              <Bell className="w-8 h-8 mb-2 stroke-1 opacity-50" />
              <p className="text-sm font-medium text-txt-primary">No Notifications</p>
              <p className="text-xs text-txt-muted mt-0.5">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-lg border transition ${
                  item.isRead
                    ? 'bg-bg-surface-elevated/30 border-border-subtle/50 opacity-75'
                    : 'bg-bg-surface-elevated border-border-strong shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{getTypeIcon(item.type)}</div>
                    <div>
                      <h4 className="text-sm font-semibold text-txt-primary">{item.title}</h4>
                      <p className="text-xs text-txt-muted mt-1 leading-relaxed">{item.message}</p>
                      {item.link && (
                        <Link
                          href={item.link}
                          onClick={onClose}
                          className="inline-flex items-center gap-1 text-xs text-wine-text hover:underline mt-2"
                        >
                          <span>View Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                  {!item.isRead && (
                    <button
                      onClick={() => onMarkRead(item.id)}
                      className="text-[10px] text-txt-muted hover:text-white shrink-0"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="text-[10px] text-txt-muted text-right mt-2">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Drawer>
  );
};
