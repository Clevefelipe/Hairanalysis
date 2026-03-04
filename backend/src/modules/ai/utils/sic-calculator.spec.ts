import { calculateSic } from './sic-calculator';
import type { SicInput, SicResult } from '../types/ai.types';

const baseInput: SicInput = {
  porosidade: 70,
  elasticidade: 80,
  resistencia: 90,
  historico_quimico: 60,
  dano_termico: 50,
  dano_mecanico: 50,
  instabilidade_pos_quimica: 70,
  quimicas_incompativeis: 1,
};

describe('calculateSic', () => {
  it('aplica pesos e não penaliza quando condições são saudáveis', () => {
    const result = calculateSic(baseInput);
    // (70*0.15) + (80*0.2) + (90*0.2) + (60*0.15) + (50*0.1) + (50*0.1) + (70*0.1) = 70.5
    expect(result).toEqual({
      score_final: 70.5,
      classificacao: 'Leve comprometimento',
      penalidade_aplicada: false,
    });
  });

  it('aplica penalidade uma única vez quando algum critério é crítico', () => {
    const result = calculateSic({ ...baseInput, elasticidade: 30 });
    // Base: 60.5 -> penalidade 15% = 51.43 (arredondado para 2 casas)
    expect(result).toEqual({
      score_final: 51.43,
      classificacao: 'Comprometimento moderado',
      penalidade_aplicada: true,
    });
  });

  it('clampa para 100 quando valores altos excedem limite e arredonda 2 casas', () => {
    const result = calculateSic({
      porosidade: 150,
      elasticidade: 150,
      resistencia: 150,
      historico_quimico: 150,
      dano_termico: 150,
      dano_mecanico: 150,
      instabilidade_pos_quimica: 150,
      quimicas_incompativeis: 0,
    });
    expect(result).toEqual({
      score_final: 100,
      classificacao: 'Saudável',
      penalidade_aplicada: false,
    });
  });

  it('classifica corretamente faixas típicas sem penalidade', () => {
    const cases: Array<{
      input: SicInput;
      expected: SicResult['classificacao'];
    }> = [
      {
        input: {
          porosidade: 90,
          elasticidade: 90,
          resistencia: 90,
          historico_quimico: 90,
          dano_termico: 80,
          dano_mecanico: 80,
          instabilidade_pos_quimica: 90,
          quimicas_incompativeis: 0,
        },
        expected: 'Saudável',
      },
      {
        input: {
          porosidade: 78,
          elasticidade: 78,
          resistencia: 78,
          historico_quimico: 70,
          dano_termico: 70,
          dano_mecanico: 70,
          instabilidade_pos_quimica: 78,
          quimicas_incompativeis: 0,
        },
        expected: 'Leve comprometimento',
      },
      {
        input: {
          porosidade: 55,
          elasticidade: 55,
          resistencia: 55,
          historico_quimico: 55,
          dano_termico: 50,
          dano_mecanico: 50,
          instabilidade_pos_quimica: 55,
          quimicas_incompativeis: 0,
        },
        expected: 'Comprometimento moderado',
      },
      {
        input: {
          porosidade: 40,
          elasticidade: 50,
          resistencia: 50,
          historico_quimico: 40,
          dano_termico: 40,
          dano_mecanico: 40,
          instabilidade_pos_quimica: 50,
          quimicas_incompativeis: 0,
        },
        expected: 'Alto risco',
      },
      {
        input: {
          porosidade: 5,
          elasticidade: 5,
          resistencia: 5,
          historico_quimico: 5,
          dano_termico: 5,
          dano_mecanico: 5,
          instabilidade_pos_quimica: 5,
          quimicas_incompativeis: 5,
        },
        expected: 'Crítico',
      },
    ];

    cases.forEach(({ input, expected }) => {
      const result = calculateSic(input);
      expect(result.classificacao).toBe(expected);
    });
  });

  it('considera quimicas_incompativeis > 3 para penalidade mesmo com demais variáveis altas', () => {
    const result = calculateSic({
      porosidade: 90,
      elasticidade: 90,
      resistencia: 90,
      historico_quimico: 90,
      dano_termico: 90,
      dano_mecanico: 90,
      instabilidade_pos_quimica: 90,
      quimicas_incompativeis: 4,
    });
    // Base 90 -> penalidade 76.5
    expect(result).toEqual({
      score_final: 76.5,
      classificacao: 'Leve comprometimento',
      penalidade_aplicada: true,
    });
  });
});
