'use client';

import React, { useState } from 'react';
import { executeWorkflowAction } from '../actions';

interface Props {
  workflow: any;
  currentUserId: string;
}

export function WorkflowDetailClient({ workflow, currentUserId }: Props) {
  const [isExecuting, setIsExecuting] = useState(false);

  const handleManualExecute = async () => {
    setIsExecuting(true);
    try {
      const idempotencyKey = `Manual:${workflow.id}:${Date.now()}`;
      await executeWorkflowAction(currentUserId, {
        workflowId: workflow.id,
        triggerType: 'MANUAL',
        triggerEvent: 'UserManualExecute',
        idempotencyKey,
      });
      alert('Workflow execution initiated successfully!');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Workflow execution failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-white/10 p-6 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{workflow.name}</h1>
            <span className="px-2.5 py-0.5 bg-zinc-800 text-zinc-400 font-mono text-xs rounded border border-white/10">
              {workflow.workflowCode} (v{workflow.version})
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">{workflow.description || 'No description provided.'}</p>
        </div>

        <button
          onClick={handleManualExecute}
          disabled={isExecuting || !workflow.isActive}
          className="px-4 py-2 bg-burgundy-900 hover:bg-burgundy-800 text-white rounded-md text-xs font-semibold transition disabled:opacity-50"
        >
          {isExecuting ? 'Executing...' : 'Run Workflow Now'}
        </button>
      </div>

      {/* Visual Sequence Builder */}
      <div className="bg-zinc-900 border border-white/10 p-6 rounded-lg space-y-6">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Workflow Sequence Diagram</h3>

        <div className="space-y-4">
          <div className="p-4 bg-zinc-950 rounded border border-amber-500/30 flex items-center gap-4">
            <div className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-mono font-bold rounded">
              TRIGGER
            </div>
            <div className="text-xs text-white">
              <span className="font-semibold">{workflow.triggerType}</span>: Configured trigger criteria
            </div>
          </div>

          {workflow.steps?.map((step: any, idx: number) => (
            <React.Fragment key={step.id}>
              <div className="text-center text-zinc-600 text-sm font-bold">↓</div>
              <div className="p-4 bg-zinc-950 rounded border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-zinc-800 text-white font-mono text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{step.type}</div>
                    <div className="text-xs text-zinc-500 font-mono truncate max-w-md">
                      {step.configurationJson}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">Sequence {step.sequence}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
