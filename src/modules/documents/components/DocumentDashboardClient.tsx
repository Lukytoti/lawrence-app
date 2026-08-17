'use client';

import React, { useState } from 'react';
import {
  FileText,
  Folder,
  CheckCircle2,
  Clock,
  ShieldAlert,
  BookOpen,
  Plus,
  Search,
  Upload,
  ArrowRight,
  Shield,
  FileCheck
} from 'lucide-react';
import Link from 'next/link';

interface DocumentDashboardProps {
  overview: {
    metrics: {
      totalDocuments: number;
      pendingApprovals: number;
      activeLegalHolds: number;
      publishedKnowledgeArticles: number;
    };
    recentDocuments: Array<{
      id: string;
      documentCode: string;
      title: string;
      documentType: string;
      classification: string;
      status: string;
      createdAt: string | Date;
      owner?: { name?: string | null; email?: string } | null;
      folder?: { name?: string | null } | null;
    }>;
  };
}

export default function DocumentDashboardClient({ overview }: DocumentDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const metrics = overview?.metrics || {
    totalDocuments: 0,
    pendingApprovals: 0,
    activeLegalHolds: 0,
    publishedKnowledgeArticles: 0,
  };

  const recentDocs = overview?.recentDocuments || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111113] border border-white/10 rounded-xl p-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <FileText className="w-7 h-7 text-red-500" />
            Enterprise Document & Knowledge Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Centralized document vault, multi-version records, knowledge base, approval workflows & retention compliance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/documents/library"
            className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </Link>
          <Link
            href="/documents/knowledge"
            className="flex items-center gap-2 px-4 py-2 bg-[#18181B] hover:bg-[#222226] text-gray-200 border border-white/10 rounded-lg text-sm font-medium transition"
          >
            <BookOpen className="w-4 h-4" />
            Knowledge Base
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111113] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Documents</span>
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-3">{metrics.totalDocuments}</div>
          <p className="text-xs text-gray-500 mt-1">Active files & contracts</p>
        </div>

        <div className="bg-[#111113] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pending Approvals</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-3">{metrics.pendingApprovals}</div>
          <p className="text-xs text-gray-500 mt-1">Awaiting compliance review</p>
        </div>

        <div className="bg-[#111113] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Legal Holds</span>
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-3">{metrics.activeLegalHolds}</div>
          <p className="text-xs text-gray-500 mt-1">Active deletion-lock holds</p>
        </div>

        <div className="bg-[#111113] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Published Knowledge</span>
            <BookOpen className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-3">{metrics.publishedKnowledgeArticles}</div>
          <p className="text-xs text-gray-500 mt-1">AI-verified knowledge articles</p>
        </div>
      </div>

      {/* Quick Navigation Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/documents/library"
          className="bg-[#111113] hover:bg-[#18181B] border border-white/10 rounded-xl p-4 transition flex flex-col items-center text-center group"
        >
          <Folder className="w-8 h-8 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium text-white">Document Library</span>
          <span className="text-xs text-gray-500 mt-0.5">Explore folders & tags</span>
        </Link>

        <Link
          href="/documents/knowledge"
          className="bg-[#111113] hover:bg-[#18181B] border border-white/10 rounded-xl p-4 transition flex flex-col items-center text-center group"
        >
          <BookOpen className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium text-white">Knowledge Hub</span>
          <span className="text-xs text-gray-500 mt-0.5">Articles & SOPs</span>
        </Link>

        <Link
          href="/documents/retention"
          className="bg-[#111113] hover:bg-[#18181B] border border-white/10 rounded-xl p-4 transition flex flex-col items-center text-center group"
        >
          <FileCheck className="w-8 h-8 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium text-white">Retention Policies</span>
          <span className="text-xs text-gray-500 mt-0.5">Lifecycle compliance</span>
        </Link>

        <Link
          href="/documents/legal-holds"
          className="bg-[#111113] hover:bg-[#18181B] border border-white/10 rounded-xl p-4 transition flex flex-col items-center text-center group"
        >
          <Shield className="w-8 h-8 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium text-white">Legal Holds</span>
          <span className="text-xs text-gray-500 mt-0.5">Preservation rules</span>
        </Link>
      </div>

      {/* Recent Documents Table */}
      <div className="bg-[#111113] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-base font-semibold text-white">Recent Documents</h2>
          <Link
            href="/documents/library"
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-medium"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#18181B] text-xs uppercase font-semibold text-gray-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3">Document</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Classification</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Owner</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                    No documents uploaded yet.
                  </td>
                </tr>
              ) : (
                recentDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <Link
                            href={`/documents/${doc.id}`}
                            className="font-medium text-white hover:text-red-400 transition"
                          >
                            {doc.title}
                          </Link>
                          <div className="text-xs text-gray-500 font-mono">{doc.documentCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-white/5 text-gray-300">
                        {doc.documentType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          doc.classification === 'RESTRICTED'
                            ? 'bg-red-500/20 text-red-300'
                            : doc.classification === 'CONFIDENTIAL'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {doc.classification}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          doc.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : doc.status === 'UNDER_REVIEW'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400">
                      {doc.owner?.name || 'System'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="text-xs text-red-400 hover:text-red-300 font-medium"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
