import { legalTermsSanitizerMiddleware } from './legal-terms-sanitizer.middleware';

describe('legalTermsSanitizerMiddleware', () => {
  it('sanitizes forbidden clinical terms', () => {
    const req = {
      body: {
        texto:
          'Diagnóstico com alopecia e dermatite. Prescrição para tratar doença e cura.',
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

    expect(next).toHaveBeenCalled();

    const sanitizedBody = String(req.body.texto).toLowerCase();
    expect(sanitizedBody).not.toContain('diagnóstico');
    expect(sanitizedBody).not.toContain('alopecia');
    expect(sanitizedBody).not.toContain('dermatite');

    res.json({ message: req.body.texto });
    const output = String(responsePayloads[0].message).toLowerCase();
    expect(output).toContain('avaliação estética');
    expect(output).toContain('queda acentuada percebida');
    expect(output).toContain('sensibilidade aparente');
  });
});
