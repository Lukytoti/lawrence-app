// src/modules/projects/errors.ts
export class DuplicateServiceCodeError extends Error {
  constructor(code: string) {
    super(`Digital service with code '${code}' already exists.`);
    this.name = 'DuplicateServiceCodeError';
  }
}
