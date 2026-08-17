'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  Play,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  RefreshCw,
  Sliders,
  Shield,
  FileText,
  Award,
} from 'lucide-react';
import {
  initiateRunAction,
  calculateRunAction,
  previewRunAction,
  approveRunAction,
  postRunAction,
  createAdjustmentAction,
} from '../actions';

interface CompensationCockpitClientProps {
  runs: any[];
  periods: any[];
  planVersions: any[];
  currentUserId: string;
}

export function CompensationCockpitClient({
  runs: initialRuns,
  periods,
  planVersions,
  currentUserId,
}: CompensationCockpitClientProps) {
  const [runs, setRuns] = useState<any[]>(initialRuns);
  const [selectedPeriodId, setSelectedPeriodId] = useState(periods[0]?.id || '');
  const [selectedPlanVersionId, setSelectedPlanVersionId] = useState(planVersions[0]?.id || '');
  const [previewData, setPreviewData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedResultForAdj, setSelectedResultForAdj] = useState<any>(null);
  const [adjAmount, setAdjAmount] = useState<number>(0);
  const [adjReason, setAdjReason] = useState<string>('');

  const activeRun = runs[0];

  const handleInitiateAndCalculate = async () => {
    if (!selectedPeriodId || !selectedPlanVersionId) return;
    setIsProcessing(true);
    try {
      const initRes = await initiateRunAction(selectedPeriodId, selectedPlanVersionId);
      if (initRes.success && initRes.run) {
        const calcRes = await calculateRunAction(initRes.run.id);
        if (calcRes.success && calcRes.run) {
          setRuns([calcRes.run, ...runs.filter((r) => r.id !== calcRes.run.id)]);
          alert('Compensation run calculated successfully!');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to execute compensation run');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedPeriodId || !selectedPlanVersionId) return;
    setIsProcessing(true);
    try {
      const res = await previewRunAction(selectedPeriodId, selectedPlanVersionId);
      if (res.success) {
        setPreviewData(res.preview);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate preview');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async (runId: string) => {
    setIsProcessing(true);
    try {
      const res = await approveRunAction(runId);
      if (res.success && res.run) {
        setRuns(runs.map((r) => (r.id === runId ? res.run : r)));
        alert('Compensation run approved successfully!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve run');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePostToLedger = async (runId: string) => {
    setIsProcessing(true);
    try {
      const res = await postRunAction(runId);
      if (res.success && res.run) {
        setRuns(runs.map((r) => (r.id === runId ? res.run : r)));
        alert('Compensation posted to double-entry financial ledger successfully!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to post compensation to ledger');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResultForAdj || !adjReason) return;
    setIsProcessing(true);
    try {
      const res = await createAdjustmentAction(selectedResultForAdj.id, adjAmount, adjReason);
      if (res.success) {
        alert('Compensation adjustment posted successfully to double-entry ledger!');
        setSelectedResultForAdj(null);
        setAdjAmount(0);
        setAdjReason('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create adjustment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-white/10 p-6 rounded-xl backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-rose-500" />
            Executive Compensation Engine Cockpit
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Data-driven calculation, safety controls, review & approval workflows, and double-entry ledger posting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePreview}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            Preview Run
          </button>
          <button
            onClick={handleInitiateAndCalculate}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-900 to-wine-800 hover:from-red-800 text-xs font-semibold text-white shadow-lg flex items-center gap-1.5"
          >
            <Play className="w-4 h-4" />
            Calculate Run
          </button>
        </div>
      </div>

      {/* Control Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-xl border border-white/5 text-xs">
        <div>
          <label className="block text-slate-300 mb-1 font-medium">Qualification Period</label>
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-white font-mono"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                Period: {p.year}/{String(p.month).padStart(2, '0')} ({p.status})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-slate-300 mb-1 font-medium">Compensation Plan Version</label>
          <select
            value={selectedPlanVersionId}
            onChange={(e) => setSelectedPlanVersionId(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-white font-mono"
          >
            {planVersions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plan?.name || 'NeoLife Plan'} — Version {v.versionName} ({v.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preview Result Modal / Display */}
      {previewData && (
        <div className="bg-slate-950/80 border border-cyan-800/50 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Calculation Preview Summary (No Ledger Changes Written)
            </h2>
            <button
              onClick={() => setPreviewData(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-slate-900 p-3 rounded border border-white/5">
              <span className="text-slate-400">Total Members:</span>
              <p className="text-base font-bold text-white mt-0.5">{previewData.totalMembersCount}</p>
            </div>
            <div className="bg-slate-900 p-3 rounded border border-white/5">
              <span className="text-slate-400">Total Gross:</span>
              <p className="text-base font-bold text-emerald-400 mt-0.5">
                {previewData.totalGrossAmount.toLocaleString()} {previewData.currency}
              </p>
            </div>
            <div className="bg-slate-900 p-3 rounded border border-white/5">
              <span className="text-slate-400">Safety Status:</span>
              <p className="text-base font-bold text-amber-400 mt-0.5">UNCONFIGURED Rules Skipped</p>
            </div>
          </div>
        </div>
      )}

      {/* Calculation Runs Table */}
      <div className="bg-slate-900/70 border border-white/10 rounded-xl p-6 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-rose-500" />
          Compensation Calculation Runs
        </h2>

        {runs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 bg-slate-950/40 rounded-lg">
            No compensation calculation runs recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {runs.map((run) => {
              const isDraft = run.status === 'DRAFT' || run.status === 'CALCULATED';
              const isReviewNeeded = run.status === 'REVIEW_REQUIRED';
              const isApproved = run.status === 'APPROVED';
              const isPosted = run.status === 'POSTED';

              return (
                <div
                  key={run.id}
                  className="bg-slate-950/60 border border-white/10 rounded-xl p-5 space-y-4 hover:border-white/20 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-mono">
                          Run Period: {run.period?.year}/{String(run.period?.month).padStart(2, '0')}
                        </span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-bold ${
                            isPosted
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              : isApproved
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                              : isReviewNeeded
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {run.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        Evaluated {run.totalMembersCount} members | Version {run.calculationVersion}
                      </p>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2">
                      {(isDraft || isReviewNeeded) && (
                        <button
                          onClick={() => handleApprove(run.id)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-xs font-semibold text-white flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve Run
                        </button>
                      )}

                      {isApproved && (
                        <button
                          onClick={() => handlePostToLedger(run.id)}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded bg-gradient-to-r from-red-900 to-wine-800 hover:from-red-800 text-xs font-semibold text-white flex items-center gap-1.5 shadow-md"
                        >
                          <Send className="w-3.5 h-3.5" /> Post to Ledger
                        </button>
                      )}

                      {isPosted && (
                        <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" /> Ledger Posted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Totals Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-900/80 p-3 rounded-lg border border-white/5 font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px]">Total Gross Amount:</span>
                      <p className="text-sm font-bold text-white mt-0.5">
                        {Number(run.totalGrossAmount).toLocaleString()} {run.currency}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">SVB Calculated:</span>
                      <p className="text-sm font-bold text-emerald-400 mt-0.5">
                        {JSON.parse(run.resultSummaryJson || '{}')?.SVB?.toLocaleString() || '0'} {run.currency}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">LDB Status:</span>
                      <p className="text-sm font-bold text-amber-400 mt-0.5">UNCONFIGURED ($0)</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">NDB Status:</span>
                      <p className="text-sm font-bold text-amber-400 mt-0.5">UNCONFIGURED ($0)</p>
                    </div>
                  </div>

                  {/* Warning Log Banner */}
                  {run.errorSummaryJson && (
                    <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-lg text-xs text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>{JSON.parse(run.errorSummaryJson)?.warning || 'Contains unconfigured rules'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
