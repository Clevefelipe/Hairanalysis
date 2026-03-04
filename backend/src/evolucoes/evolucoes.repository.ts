import { evolucoes, Evolucao } from './evolucoes.store';

export class EvolucoesRepository {
  listar(): Evolucao[] {
    return evolucoes;
  }

  criar(evolucao: Evolucao): Evolucao {
    evolucoes.push(evolucao);
    return evolucao;
  }

  listarPorCliente(clienteId: string): Evolucao[] {
    return evolucoes.filter((e) => e.clienteId === clienteId);
  }
}
