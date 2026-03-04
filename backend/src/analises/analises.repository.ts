import { analises, Analise } from './analises.store';

export class AnalisesRepository {
  listar(): Analise[] {
    return analises;
  }

  criar(analise: Analise): Analise {
    analises.push(analise);
    return analise;
  }

  listarPorCliente(clienteId: string): Analise[] {
    return analises.filter((a) => a.clienteId === clienteId);
  }
}
