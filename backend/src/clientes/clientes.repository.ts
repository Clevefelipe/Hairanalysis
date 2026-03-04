import { clientes, Cliente } from './clientes.store';

export class ClientesRepository {
  listar(): Cliente[] {
    return clientes;
  }

  criar(cliente: Cliente): Cliente {
    clientes.push(cliente);
    return cliente;
  }

  obterPorId(id: string): Cliente | undefined {
    return clientes.find((c) => c.id === id);
  }

  remover(id: string): void {
    const index = clientes.findIndex((c) => c.id === id);
    if (index >= 0) {
      clientes.splice(index, 1);
    }
  }
}
