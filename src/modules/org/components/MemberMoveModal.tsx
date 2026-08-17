'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { moveMemberAction } from '../actions';
import { NetworkMemberSummary } from '../types';
import { GitBranch, AlertCircle } from 'lucide-react';

export interface MemberMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: NetworkMemberSummary | null;
  allSponsors: NetworkMemberSummary[];
  onSuccess?: () => void;
}

export const MemberMoveModal: React.FC<MemberMoveModalProps> = ({
  isOpen,
  onClose,
  member,
  allSponsors,
  onSuccess,
}) => {
  const [newSponsorId, setNewSponsorId] = useState('');
  const [reason, setReason] = useState('Organizational Restructuring');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!member) return null;

  // Exclude current member and current sponsor from selection list to prevent direct duplicates
  const availableSponsors = allSponsors.filter(
    (s) => s.id !== member.id && s.id !== member.sponsor?.id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSponsorId) {
      setError('Please select a new sponsor.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      await moveMemberAction({
        memberId: member.id,
        newSponsorId,
        reason,
      });

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to transfer sponsor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Transfer Sponsor — ${member.name}`} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 rounded-lg bg-bg-surface-elevated/40 border border-border-subtle text-xs space-y-1">
          <div><span className="text-txt-muted">Current Member:</span> <strong className="text-txt-primary">{member.name} ({member.memberCode})</strong></div>
          <div><span className="text-txt-muted">Current Sponsor:</span> <strong className="text-wine-text">{member.sponsor?.name || 'Root Admin'}</strong></div>
        </div>

        <div className="w-full flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-txt-muted uppercase tracking-wide">
            Select New Sponsor (Required)
          </label>
          <select
            value={newSponsorId}
            onChange={(e) => setNewSponsorId(e.target.value)}
            required
            className="w-full bg-bg-surface border border-border-subtle text-txt-primary text-sm rounded-md px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-wine-primary"
          >
            <option value="" disabled>
              Select candidate sponsor...
            </option>
            {availableSponsors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.memberCode}) — {s.email}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Transfer Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          helperText="Historical relationship changes are preserved in the organization log."
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-border-subtle">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading} leftIcon={<GitBranch className="w-4 h-4" />}>
            Confirm Transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
};
