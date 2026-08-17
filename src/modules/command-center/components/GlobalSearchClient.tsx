'use client';

import React, { useState } from 'react';
import { SearchDomain, SearchResultItem } from '../types';
import { searchAllAction } from '../actions';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface GlobalSearchClientProps {
  actorUserId: string;
  initialDomain?: SearchDomain;
}

export const GlobalSearchClient: React.FC<GlobalSearchClientProps> = ({ actorUserId, initialDomain }) => {
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState<SearchDomain | undefined>(initialDomain);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const domainsList: { label: string; value?: SearchDomain }[] = [
    { label: 'All Domains' },
    { label: 'Members', value: 'MEMBERS' },
    { label: 'CRM Leads', value: 'CRM_LEADS' },
    { label: 'Clients', value: 'CLIENTS' },
    { label: 'Projects', value: 'PROJECTS' },
    { label: 'Invoices', value: 'INVOICES' },
    { label: 'Tasks', value: 'TASKS' },
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await searchAllAction({ query, domain, limit: 30 }, actorUserId);
      setResults(res.results);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all business domains (e.g. member name, client code, invoice #, project title)..."
            className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-400 focus:border-wine-500 focus:outline-none"
          />
        </div>

        <select
          value={domain || ''}
          onChange={(e) => setDomain((e.target.value as SearchDomain) || undefined)}
          className="w-full md:w-48 py-3 px-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none"
        >
          {domainsList.map((d, idx) => (
            <option key={idx} value={d.value || ''}>
              {d.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="w-full md:w-auto px-6 py-3 bg-wine-800 hover:bg-wine-700 text-white font-semibold text-sm rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span>Search</span>
        </button>
      </form>

      {/* Results Header */}
      {results.length > 0 && (
        <div className="text-xs text-slate-400">
          Found {totalCount} matching records for "{query}"
        </div>
      )}

      {/* Results Grid */}
      <div className="space-y-3">
        {results.map((item) => (
          <div
            key={`${item.domain}-${item.id}`}
            className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-wine-800/60 transition-all flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-wine-400">
                  {item.domain}
                </span>
                {item.status && (
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
                    {item.status}
                  </span>
                )}
              </div>
              <h4 className="text-base font-bold text-white">{item.title}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{item.subtitle}</p>
            </div>

            <Link
              href={item.route}
              className="flex items-center gap-1 text-xs font-semibold text-wine-400 hover:text-wine-300 px-3 py-2 rounded-lg bg-wine-950/40 border border-wine-800/40 hover:bg-wine-900/40 transition-colors"
            >
              <span>View Record</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
