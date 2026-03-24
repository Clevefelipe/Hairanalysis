import api from './api';

export interface AnaliseCapilarPayload {
  couroCabeludo: string;
  fio: string;
  observacoes?: string;
  profissional?: string;
}

export async function criarAnaliseCapilar(
  clienteId: string | number,
  payload: AnaliseCapilarPayload
) {
  const response = await api.post(
    `/clientes/${clienteId}/analises`,
    payload
  );
  return response.data;
}

export async function listarAnalisesCapilares(
  clienteId: string | number
) {
  const response = await api.get(`/clientes/${clienteId}/analises`);
  return response.data;
}

export async function submitClinicalAnalysis(payload: Record<string, unknown>) {
  const response = await api.post("/analysis/clinical", payload);
  return response.data;
}
