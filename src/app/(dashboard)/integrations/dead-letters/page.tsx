import React from 'react';
import DeadLetterClient from '@/modules/integrations/components/DeadLetterClient';
import { listDeadLetters } from '@/modules/integrations/dead-letter';

export const metadata = {
  title: 'Dead-Letter Queue | Lawrence Operating System',
  description: 'Inspect, retry, or discard failed integration events.',
};

export default async function DeadLettersPage() {
  const { deadEvents, deadJobs } = await listDeadLetters(50);
  return <DeadLetterClient deadEvents={deadEvents} deadJobs={deadJobs} />;
}
