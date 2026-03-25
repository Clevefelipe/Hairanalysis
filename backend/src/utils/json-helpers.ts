/**
 * Helper utilities for handling JSON fields stored as text
 */

export function parseJsonField<T = any>(field: string | null | undefined, defaultValue: T = {} as T): T {
  if (!field) return defaultValue;
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
