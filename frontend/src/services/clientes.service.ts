import api from './api';

export async function listarClientes() {
  const response = await api.get('/clientes');
  return response.data;
}

export async function obterHistoricoCliente(clienteId: string | number) {
  const response = await api.get(`/clientes/${clienteId}/historico`);
  return response.data;
}
