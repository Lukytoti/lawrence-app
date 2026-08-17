import React from 'react';
import { EmptyState } from './EmptyState';
import { Badge } from './Badge';

export interface ModulePlaceholderPageProps {
  moduleName: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  stage: string;
}

export const ModulePlaceholderPage: React.FC<ModulePlaceholderPageProps> = ({
  moduleName,
  category,
  description,
  icon,
  stage,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-widest text-txt-muted uppercase">{category}</span>
            <Badge variant="outline">{stage}</Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-txt-primary">{moduleName}</h1>
        </div>
      </div>

      <EmptyState
        icon={icon}
        title={`${moduleName} Module Boundary Reserved`}
        description={`${description} This domain boundary is established in the architecture and ready for implementation in subsequent stages.`}
        action={<Badge variant="wine">Architectural Scope Preserved</Badge>}
        className="py-16"
      />
    </div>
  );
};
