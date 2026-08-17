import React from 'react';
import ObservabilityClient from '@/modules/governance/components/ObservabilityClient';
import { getServiceTelemetry } from '@/modules/governance/observability';

export const metadata = {
  title: 'System Observability | Lawrence Operating System',
  description: 'Service health metrics, error rates & latency telemetry.',
};

export default async function ObservabilityPage() {
  const telemetry = await getServiceTelemetry();
  return <ObservabilityClient telemetry={telemetry} />;
}
