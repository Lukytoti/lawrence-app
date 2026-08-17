import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center border border-dashed border-border-strong rounded-xl bg-bg-surface/50 ${className}`}
    >
      {icon && <div className="p-3 mb-3 rounded-full bg-zinc-800/60 text-txt-muted">{icon}</div>}
      <h4 className="text-base font-semibold text-txt-primary">{title}</h4>
      <p className="text-sm text-txt-muted max-w-sm mt-1 mb-4">{description}</p>
      {action}
    </div>
  );
};
