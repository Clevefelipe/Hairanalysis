import { clientes } from "./clientes.store";

export class ClientesRepository {
  listar() {
    return clientes;
  }

  criar(cliente: any) {
    clientes.push(cliente);
    return cliente;
  }

  obterPorId(id: string) {
    return clientes.find((c) => c.id === id);
  }

  remover(id: string) {
    const index = clientes.findIndex((c) => c.id === id);
    if (index >= 0) {
      clientes.splice(index, 1);
    }
  }
}
