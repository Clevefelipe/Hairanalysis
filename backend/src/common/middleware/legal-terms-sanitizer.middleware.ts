import type { NextFunction, Request, Response } from 'express';

const REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bcura\b/gi, replacement: 'melhora estética percebida' },
  { pattern: /\btratar\s+doen[cç]a\b/gi, replacement: 'cuidar esteticamente' },
  { pattern: /\bdiagn[oó]stic[oa]s?\b/gi, replacement: 'avaliação estética' },
  { pattern: /\bprescri[cç][aã]o\b/gi, replacement: 'orientação estética' },
  { pattern: /\bpatologi(?:a|as)\b/gi, replacement: 'alteração estética' },
  {
    pattern: /\binflama[cç][aã]o\s+sever[ao]\b/gi,
    replacement: 'sensibilidade aparente importante',
  },
  {
    pattern: /\balopeci(?:a|as)\b/gi,
    replacement: 'queda acentuada percebida',
  },
  {
    pattern: /\bdermatites?\b/gi,
    replacement: 'sensibilidade aparente',
  },
];

function sanitizeText(text: string): string {
  return REPLACEMENTS.reduce(
    (acc, rule) => acc.replace(rule.pattern, rule.replacement),
    text,
  );
}

function sanitizePayload(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizePayload(item));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce(
      (acc, [key, nested]) => {
        acc[key] = sanitizePayload(nested);
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }

  return value;
}

export function legalTermsSanitizerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    return originalJson(sanitizePayload(body));
  }) as Response['json'];

  if (req.body && typeof req.body === 'object') {
    req.body = sanitizePayload(req.body);
  }

  next();
}
