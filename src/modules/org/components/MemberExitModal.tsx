'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { exitMemberAction } from '../actions';
import { NetworkMemberSummary } from '../types';
import { UserX, AlertCircle } from 'lucide-react';

export interface MemberExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: NetworkMemberSummary | null;
  onSuccess?: () => void;
}

export const MemberExitModal: React.FC<MemberExitModalProps> = ({
  isOpen,
  onClose,
  member,
  onSuccess,
}) => {
  const [exitReason, setExitReason] = useState('Resigned / Voluntary Exit');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await exitMemberAction({
        memberId: member.id,
        exitReason,
      });

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to mark member as exited');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Mark Exited — ${member.name}`} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/50 text-xs text-red-200">
          This action sets member status to <strong>EXITED</strong> and preserves historical organization relationships. User account, profile, and history will NOT be deleted.
        </div>

        <Input
          label="Exit Reason"
          value={exitReason}
          onChange={(e) => setExitReason(e.target.value)}
          required
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-border-subtle">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" size="sm" isLoading={isLoading} leftIcon={<UserX className="w-4 h-4" />}>
            Confirm Member Exit
          </Button>
        </div>
      </form>
    </Modal>
  );
};
