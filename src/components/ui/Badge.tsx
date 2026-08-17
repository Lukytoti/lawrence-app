import React from 'react';

export interface BadgeProps {
  variant?: 'default' | 'wine' | 'success' | 'warning' | 'info' | 'outline';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  const styles = {
    default: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    wine: 'bg-wine-deep/80 text-wine-text border border-wine-primary/60',
    success: 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80',
    warning: 'bg-amber-950/80 text-amber-300 border border-amber-800/80',
    info: 'bg-blue-950/80 text-blue-300 border border-blue-800/80',
    outline: 'border border-border-strong text-txt-muted',
  };

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};
