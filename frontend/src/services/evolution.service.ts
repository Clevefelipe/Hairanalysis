import api from './api';

export async function criarEvolucao(
  clienteId: string | number,
  payload: any
) {
  const response = await api.post(`/clientes/${clienteId}/evolucoes`, payload);
  return response.data;
}

export async function listarEvolucoes(
  clienteId: string | number
) {
  const response = await api.get(`/clientes/${clienteId}/evolucoes`);
  return response.data;
}
