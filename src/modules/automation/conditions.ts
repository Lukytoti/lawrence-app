import { ConditionGroup, ConditionRule } from './types';

/**
 * Gets nested property from object using dot notation (e.g., 'invoice.amountDue') safely
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj || typeof obj !== 'object' || !path || typeof path !== 'string') return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Evaluates single ConditionRule against context payload safely
 */
export function evaluateRule(rule: ConditionRule, context: any): boolean {
  if (!rule || !rule.operator || !rule.field) return false;

  try {
    const actualValue = getNestedValue(context, rule.field);
    const targetValue = rule.value;

    switch (rule.operator) {
      case 'equals':
        return actualValue === targetValue;
      case 'notEquals':
        return actualValue !== targetValue;
      case 'greaterThan':
        return actualValue !== undefined && actualValue !== null && Number(actualValue) > Number(targetValue);
      case 'lessThan':
        return actualValue !== undefined && actualValue !== null && Number(actualValue) < Number(targetValue);
      case 'greaterThanOrEqual':
        return actualValue !== undefined && actualValue !== null && Number(actualValue) >= Number(targetValue);
      case 'lessThanOrEqual':
        return actualValue !== undefined && actualValue !== null && Number(actualValue) <= Number(targetValue);
      case 'contains':
        if (typeof actualValue === 'string') {
          return actualValue.includes(String(targetValue));
        }
        if (Array.isArray(actualValue)) {
          return actualValue.includes(targetValue);
        }
        return false;
      case 'in':
        if (Array.isArray(targetValue)) {
          return targetValue.includes(actualValue);
        }
        return false;
      case 'notIn':
        if (Array.isArray(targetValue)) {
          return !targetValue.includes(actualValue);
        }
        return true;
      case 'exists':
        return actualValue !== undefined && actualValue !== null;
      case 'isEmpty':
        if (actualValue === undefined || actualValue === null || actualValue === '') return true;
        if (Array.isArray(actualValue) && actualValue.length === 0) return true;
        if (typeof actualValue === 'object' && Object.keys(actualValue).length === 0) return true;
        return false;
      default:
        return false;
    }
  } catch (err) {
    return false;
  }
}

/**
 * Evaluates ConditionGroup tree recursively safely
 */
export function evaluateConditionGroup(group: ConditionGroup | any, context: any): boolean {
  if (!group || typeof group !== 'object') return true;
  if (!group.rules || !Array.isArray(group.rules) || group.rules.length === 0) return true;

  try {
    if (group.logicalOperator === 'OR') {
      return group.rules.some((ruleOrGroup: any) => {
        if (ruleOrGroup && 'logicalOperator' in ruleOrGroup) {
          return evaluateConditionGroup(ruleOrGroup as ConditionGroup, context);
        }
        return evaluateRule(ruleOrGroup as ConditionRule, context);
      });
    } else {
      // Default AND
      return group.rules.every((ruleOrGroup: any) => {
        if (ruleOrGroup && 'logicalOperator' in ruleOrGroup) {
          return evaluateConditionGroup(ruleOrGroup as ConditionGroup, context);
        }
        return evaluateRule(ruleOrGroup as ConditionRule, context);
      });
    }
  } catch (err) {
    return false;
  }
}
