'use client';

import React, { useState } from 'react';
import {
  History,
  Upload,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { createDocumentVersionAction, restoreVersionAction } from '../actions';

interface DocumentVersionProps {
  document: any;
  versions: any[];
  currentUserId: string;
}

export default function DocumentVersionClient({
  document: doc,
  versions: initialVersions,
  currentUserId,
}: DocumentVersionProps) {
  const [versions, setVersions] = useState(initialVersions);
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !fileContent) {
      setErrorMsg('File name and content are required');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const newVer = await createDocumentVersionAction(
        {
          documentId: doc.id,
          fileName,
          fileContent,
          changeSummary,
        },
        currentUserId
      );

      setVersions([newVer, ...versions]);
      setSuccessMsg(`Successfully created version ${newVer.versionNumber}`);
      setFileName('');
      setFileContent('');
      setChangeSummary('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload version');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!confirm('Restoring this version will create a new sequential version. Proceed?')) return;
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const restored = await restoreVersionAction(doc.id, versionId, currentUserId);
      setVersions([restored, ...versions]);
      setSuccessMsg(`Restored version successfully as version ${restored.versionNumber}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to restore version');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111113] border border-white/10 rounded-xl p-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link href={`/documents/${doc.id}`} className="hover:text-white">
              {doc.title}
            </Link>
            <span>/</span>
            <span className="text-gray-200 font-mono">{doc.documentCode}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-red-500" />
            Version History & Sequential Releases
          </h1>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg text-xs">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg text-xs">
          {successMsg}
        </div>
      )}

      {/* Upload New Version Card */}
      <div className="bg-[#111113] border border-white/10 rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-red-500" />
          Upload New Version
        </h2>
        <form onSubmit={handleUploadVersion} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                File Name *
              </label>
              <input
                type="text"
                required
                placeholder="updated_contract_v2.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                Change Summary
              </label>
              <input
                type="text"
                placeholder="Added indemnification clause section 4"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                className="w-full bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
              File Content (Text / Data) *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Enter new version content..."
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="w-full bg-[#18181B] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
          >
            {isSubmitting ? 'Uploading Version...' : 'Publish Version'}
          </button>
        </form>
      </div>

      {/* Version Table */}
      <div className="bg-[#111113] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#18181B] text-xs uppercase font-semibold text-gray-400 border-b border-white/10">
            <tr>
              <th className="px-5 py-3">Version</th>
              <th className="px-5 py-3">Version Code</th>
              <th className="px-5 py-3">Change Summary</th>
              <th className="px-5 py-3">Checksum</th>
              <th className="px-5 py-3">Author</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {versions.map((ver) => (
              <tr key={ver.id} className="hover:bg-white/[0.02] transition">
                <td className="px-5 py-3.5 font-bold text-white">v{ver.versionNumber}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{ver.versionCode}</td>
                <td className="px-5 py-3.5 text-gray-300">{ver.changeSummary || 'Initial'}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-gray-500 truncate max-w-xs">
                  {ver.checksum}
                </td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">{ver.createdBy?.name || 'System'}</td>
                <td className="px-5 py-3.5 text-gray-400 text-xs">
                  {new Date(ver.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => handleRestore(ver.id)}
                    disabled={isSubmitting}
                    className="p-1.5 hover:bg-white/10 rounded text-amber-400 hover:text-amber-300 transition text-xs flex items-center gap-1 ml-auto"
                    title="Restore as New Version"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restore
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
