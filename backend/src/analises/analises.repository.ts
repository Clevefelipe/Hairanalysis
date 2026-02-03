import { analises } from "./analises.store";

export class AnalisesRepository {
  listar() {
    return analises;
  }

  criar(analise: any) {
    analises.push(analise);
    return analise;
  }

  listarPorCliente(clienteId: string) {
    return analises.filter(
      (a) => a.clienteId === clienteId
    );
  }
}
