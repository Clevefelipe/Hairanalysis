import { legalTermsSanitizerMiddleware } from './legal-terms-sanitizer.middleware';

describe('legalTermsSanitizerMiddleware', () => {
  it('sanitizes forbidden clinical terms', () => {
    const req = {
      body: {
        texto: 'Diagnóstico com queda acentuada percebida e sensibilidade aparente. Prescrição para tratar doença e melhora estética percebida.',
      },
    } as any;

    const responsePayloads: any[] = [];
    const res = {
      json: jest.fn((payload: unknown) => {
        responsePayloads.push(payload);
        return payload;
      }),
    } as any;

    const next = jest.fn();
    legalTermsSanitizerMiddleware(req, res, next);
    res.json({ message: req.body.texto });

    expect(next).toHaveBeenCalled();
    const output = String(responsePayloads[0].message).normalize('NFC').toLowerCase();
    expect(output).toContain('avaliação estética');
    expect(output).toContain('queda acentuada percebida');
    expect(output).toContain('sensibilidade aparente');
  });
});
