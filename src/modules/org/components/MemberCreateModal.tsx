'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createMemberAction } from '../actions';
import { NetworkMemberSummary } from '../types';
import { UserPlus, Search, AlertCircle } from 'lucide-react';

export interface MemberCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  allSponsors: NetworkMemberSummary[];
  onSuccess?: () => void;
}

export const MemberCreateModal: React.FC<MemberCreateModalProps> = ({
  isOpen,
  onClose,
  allSponsors,
  onSuccess,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sponsorId, setSponsorId] = useState(allSponsors[0]?.id || '');
  const [status, setStatus] = useState('ACTIVE');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorId) {
      setError('Please select an existing network sponsor.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      await createMemberAction({
        firstName,
        lastName,
        email,
        phone,
        sponsorId,
        status: status as any,
      });

      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Network Member" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>

        <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Phone Number (Optional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <div className="w-full flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-txt-muted uppercase tracking-wide">
            Assigned Sponsor (Required)
          </label>
          <select
            value={sponsorId}
            onChange={(e) => setSponsorId(e.target.value)}
            required
            className="w-full bg-bg-surface border border-border-subtle text-txt-primary text-sm rounded-md px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-wine-primary"
          >
            <option value="" disabled>
              Select an existing sponsor...
            </option>
            {allSponsors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.memberCode}) — {s.email}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-txt-muted uppercase tracking-wide">Initial Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-bg-surface border border-border-subtle text-txt-primary text-sm rounded-md px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-wine-primary"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="PROSPECT">PROSPECT</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border-subtle">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading} leftIcon={<UserPlus className="w-4 h-4" />}>
            Create Member
          </Button>
        </div>
      </form>
    </Modal>
  );
};
