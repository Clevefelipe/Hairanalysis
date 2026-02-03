import { evolucoes } from "./evolucoes.store";

export class EvolucoesRepository {
  listar() {
    return evolucoes;
  }

  criar(evolucao: any) {
    evolucoes.push(evolucao);
    return evolucao;
  }

  listarPorCliente(clienteId: string) {
    return evolucoes.filter(
      (e) => e.clienteId === clienteId
    );
  }
}
