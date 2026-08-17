'use client';

import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Upload,
  Folder,
  Download,
  Eye,
  Plus,
  Clock,
  Shield,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { createDocumentAction } from '../actions';

interface DocumentLibraryProps {
  initialDocuments: any[];
  folders: any[];
  currentUserId: string;
}

export default function DocumentLibraryClient({
  initialDocuments,
  folders,
  currentUserId,
}: DocumentLibraryProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedClassification, setSelectedClassification] = useState('ALL');
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [docType, setDocType] = useState('GENERAL');
  const [classification, setClassification] = useState('INTERNAL');
  const [visibility, setVisibility] = useState('ORGANIZATION');
  const [folderId, setFolderId] = useState('');
  const [tags, setTags] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [mimeType, setMimeType] = useState('text/plain');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileName || !fileContent) {
      setErrorMsg('Title, File Name, and Content are required');
      return;
    }
    setIsUploading(true);
    setErrorMsg('');

    try {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      const newDoc = await createDocumentAction(
        {
          title,
          description,
          documentType: docType,
          classification,
          visibility,
          folderId: folderId || undefined,
          fileContent,
          fileName,
          mimeType,
          tags: tagList,
        },
        currentUserId
      );

      setDocuments([newDoc, ...documents]);
      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      setFileContent('');
      setFileName('');
      setTags('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesQuery =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'ALL' || doc.documentType === selectedType;
    const matchesClass =
      selectedClassification === 'ALL' || doc.classification === selectedClassification;
    return matchesQuery && matchesType && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111113] border border-white/10 rounded-xl p-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <FileText className="w-7 h-7 text-red-500" />
            Document Library
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse, search, classify, and manage authoritative organizational files.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#111113] border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents by title or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181B] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#18181B] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-red-500"
          >
            <option value="ALL">All Document Types</option>
            <option value="GENERAL">General</option>
            <option value="CONTRACT">Contract</option>
            <option value="POLICY">Policy</option>
            <option value="PROCEDURE">Procedure</option>
            <option value="REPORT">Report</option>
            <option value="INVOICE">Invoice</option>
            <option value="PROJECT">Project</option>
            <option value="LEGAL">Legal</option>
            <option value="COMPLIANCE">Compliance</option>
          </select>

          <select
            value={selectedClassification}
            onChange={(e) => setSelectedClassification(e.target.value)}
            className="bg-[#18181B] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-red-500"
          >
            <option value="ALL">All Classifications</option>
            <option value="PUBLIC">Public</option>
            <option value="INTERNAL">Internal</option>
            <option value="CONFIDENTIAL">Confidential</option>
            <option value="RESTRICTED">Restricted</option>
          </select>
        </div>
      </div>

      {/* Document List Table */}
      <div className="bg-[#111113] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#18181B] text-xs uppercase font-semibold text-gray-400 border-b border-white/10">
              <tr>
                <th className="px-5 py-3">Document Title</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Classification</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Folder</th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-500">
                    No documents matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-red-400 shrink-0" />
                        <div>
                          <Link
                            href={`/documents/${doc.id}`}
                            className="font-medium text-white hover:text-red-400 transition"
                          >
                            {doc.title}
                          </Link>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{doc.documentCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-white/5 text-gray-300">
                        {doc.documentType}
                      </span>
                    </td>
                    <td className="px-5 py-4">
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
                    <td className="px-5 py-4">
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
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {doc.folder?.name || 'Root'}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs font-mono">
                      {doc.fileSizeBytes ? `${Math.round(doc.fileSizeBytes / 1024)} KB` : 'N/A'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="p-1.5 hover:bg-white/10 rounded text-gray-300 hover:text-white transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181B] border border-white/10 rounded-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-red-500" />
              Upload Document
            </h2>

            {errorMsg && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-lg text-xs mb-4">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Services Agreement 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#111113] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                    Document Type
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-[#111113] border border-white/10 rounded-lg p-2.5 text-sm text-gray-300 focus:outline-none focus:border-red-500"
                  >
                    <option value="GENERAL">General</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="POLICY">Policy</option>
                    <option value="PROCEDURE">Procedure</option>
                    <option value="REPORT">Report</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="PROJECT">Project</option>
                    <option value="LEGAL">Legal</option>
                    <option value="COMPLIANCE">Compliance</option>
                    <option value="KNOWLEDGE">Knowledge</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                    Classification
                  </label>
                  <select
                    value={classification}
                    onChange={(e) => setClassification(e.target.value)}
                    className="w-full bg-[#111113] border border-white/10 rounded-lg p-2.5 text-sm text-gray-300 focus:outline-none focus:border-red-500"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="INTERNAL">Internal</option>
                    <option value="CONFIDENTIAL">Confidential</option>
                    <option value="RESTRICTED">Restricted</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                    Folder (Optional)
                  </label>
                  <select
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    className="w-full bg-[#111113] border border-white/10 rounded-lg p-2.5 text-sm text-gray-300 focus:outline-none focus:border-red-500"
                  >
                    <option value="">Root (No folder)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="legal, q3, signed"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full bg-[#111113] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  File Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="contract_agreement.pdf"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full bg-[#111113] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  File Content (Text / Data) *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter or paste text content for document payload..."
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="w-full bg-[#111113] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Save & Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
