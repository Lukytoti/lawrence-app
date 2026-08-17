'use client';

import React from 'react';
import { ExecutiveAlert } from '../types';
import Link from 'next/link';
import { AlertCircle, AlertTriangle, Info, ArrowUpRight } from 'lucide-react';

interface AlertCenterClientProps {
  alerts: ExecutiveAlert[];
}

export const AlertCenterClient: React.FC<AlertCenterClientProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="p-6 text-center border border-slate-800 rounded-xl bg-slate-900/40 text-slate-400">
        <Info className="w-8 h-8 text-blue-400 mx-auto mb-2" />
        <p className="font-medium">System Operating Normally</p>
        <p className="text-xs text-slate-500">No active critical or warning alerts detected across operational domains.</p>
      </div>
    );
  }

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-400 shrink-0" />;
    }
  };

  const getAlertBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800 rounded">CRITICAL</span>;
      case 'WARNING':
        return <span className="px-2 py-0.5 text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800 rounded">WARNING</span>;
      default:
        return <span className="px-2 py-0.5 text-xs bg-blue-950 text-blue-300 border border-blue-800 rounded">INFO</span>;
    }
  };

  return (
    <div className="border border-slate-800 rounded-xl bg-slate-900/60 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400" />
          <h3 className="text-base font-semibold text-white">Executive Alert Center</h3>
        </div>
        <span className="text-xs text-slate-400">{alerts.length} operational alerts</span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-3.5 rounded-lg border ${
              alert.severity === 'CRITICAL'
                ? 'border-rose-900/60 bg-rose-950/20'
                : alert.severity === 'WARNING'
                ? 'border-amber-900/60 bg-amber-950/20'
                : 'border-slate-800 bg-slate-950/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.severity)}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getAlertBadge(alert.severity)}
                    <span className="text-xs font-semibold text-slate-400 uppercase">{alert.domain}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{alert.title}</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{alert.message}</p>
                </div>
              </div>

              {alert.actionRoute && (
                <Link
                  href={alert.actionRoute}
                  className="p-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="View Target Entity"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
