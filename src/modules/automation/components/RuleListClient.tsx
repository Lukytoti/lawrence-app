'use client';

import React from 'react';

interface Props {
  rules: any[];
}

export function RuleListClient({ rules }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Automation Rules & Conditions</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Reusable condition definitions for evaluating cross-domain business logic
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-lg p-5">
        <p className="text-xs text-zinc-400">
          Rules define condition criteria (such as client health score &lt; 65 or invoice overdue count &gt; 0) evaluated dynamically during workflow step execution.
        </p>
      </div>
    </div>
  );
}
