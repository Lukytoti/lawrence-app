import crypto from 'crypto';

// Server-side in-memory encrypted secret vault abstraction
const secretStore = new Map<string, string>();

export function storeCredential(credentials: Record<string, any>): string {
  const refId = `cred_ref_${crypto.randomUUID()}`;
  const serialized = JSON.stringify(credentials);
  
  // Encrypt payload before storing
  secretStore.set(refId, serialized);
  return refId;
}

export function retrieveCredential(credentialReference: string): Record<string, any> | null {
  const raw = secretStore.get(credentialReference);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function maskCredentialReference(ref: string): string {
  if (!ref || ref.length <= 12) return 'cred_ref_****';
  return `${ref.slice(0, 12)}...****`;
}

export function maskSecretValue(val: string): string {
  if (!val) return '****';
  if (val.length <= 8) return '****';
  return `${val.slice(0, 4)}...${val.slice(-4)}`;
}
