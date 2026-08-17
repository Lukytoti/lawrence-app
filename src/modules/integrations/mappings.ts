export interface FieldMappingRule {
  sourceField: string;
  targetField: string;
  transformer?: 'UPPERCASE' | 'LOWERCASE' | 'TO_NUMBER' | 'TO_BOOLEAN' | 'TRIM';
  defaultValue?: any;
}

export function transformPayload(payload: Record<string, any>, rules: FieldMappingRule[]): Record<string, any> {
  const result: Record<string, any> = {};

  for (const rule of rules) {
    let rawVal = getNestedValue(payload, rule.sourceField);
    if (rawVal === undefined || rawVal === null) {
      rawVal = rule.defaultValue;
    }

    if (rawVal !== undefined && rawVal !== null && rule.transformer) {
      switch (rule.transformer) {
        case 'UPPERCASE':
          rawVal = String(rawVal).toUpperCase();
          break;
        case 'LOWERCASE':
          rawVal = String(rawVal).toLowerCase();
          break;
        case 'TRIM':
          rawVal = String(rawVal).trim();
          break;
        case 'TO_NUMBER':
          rawVal = Number(rawVal);
          break;
        case 'TO_BOOLEAN':
          rawVal = Boolean(rawVal);
          break;
      }
    }

    if (rawVal !== undefined) {
      setNestedValue(result, rule.targetField, rawVal);
    }
  }

  return result;
}

function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let curr = obj;
  for (const p of parts) {
    if (curr === undefined || curr === null) return undefined;
    curr = curr[p];
  }
  return curr;
}

function setNestedValue(obj: any, path: string, value: any) {
  const parts = path.split('.');
  let curr = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!curr[p] || typeof curr[p] !== 'object') {
      curr[p] = {};
    }
    curr = curr[p];
  }
  curr[parts[parts.length - 1]] = value;
}
