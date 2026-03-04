import { legalTermsSanitizerMiddleware } from './legal-terms-sanitizer.middleware';

describe('sanitization', () => {
  it('replaces restricted terms with aesthetic-safe terms', () => {
    const req = {
      body: {
        note: 'Diagnóstico com alopecia e dermatite. Cura em andamento.',
      },
    } as any;

    const payloads: any[] = [];
    const res = {
      json: jest.fn((payload: unknown) => {
        payloads.push(payload);
        return payload;
      }),
    } as any;

    const next = jest.fn();
    legalTermsSanitizerMiddleware(req, res, next);
    res.json({ text: req.body.note });

    expect(next).toHaveBeenCalled();
    const text = String(payloads[0].text).toLowerCase();
    expect(text).toContain('avaliação estética');
    expect(text).toContain('queda acentuada percebida');
    expect(text).toContain('sensibilidade aparente');
    expect(text).toContain('cuidado estético');
  });
});
