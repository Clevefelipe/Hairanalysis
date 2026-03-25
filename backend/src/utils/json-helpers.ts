/**
 * Helper utilities for handling JSON fields stored as text
 */

export function parseJsonField<T = any>(
  field: unknown,
  defaultValue: T = {} as T,
): T {
  if (field === null || typeof field === 'undefined' || field === '') {
    return defaultValue;
  }

  if (typeof field !== 'string') {
    return field as T;
  }

  try {
    return JSON.parse(field);
  } catch {
    return defaultValue;
  }
}

export function stringifyJsonField(obj: any): string {
  if (!obj) return '';
  try {
    return JSON.stringify(obj);
  } catch {
    return '';
  }
}
