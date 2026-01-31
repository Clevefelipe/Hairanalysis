import api from "./api";

export type AnalysisType = "tricologica" | "capilar";

export interface AnalysisHistory {
  id: string;
  clientId: string;
  domain: AnalysisType;
  baseResult: {
    score?: number;
    signals?: Record<string, string>;
  };
  ragResult: any;
  createdAt: string;
}

/**
 * Retorna o histórico de análises de um cliente
 * com filtros opcionais
 */
export async function getHistoryByClient(
  clientId: string,
  filters?: {
    domain?: AnalysisType;
    q?: string;
  }
): Promise<AnalysisHistory[]> {
  const response = await api.get<AnalysisHistory[]>(
    `/history/client/${clientId}`,
    {
      params: {
        domain: filters?.domain,
        q: filters?.q,
      },
    }
  );

  return response.data;
}

/**
 * Retorna uma análise específica pelo ID
 */
export async function getHistoryById(
  historyId: string
): Promise<AnalysisHistory> {
  const response = await api.get<AnalysisHistory>(
    `/history/${historyId}`
  );
  return response.data;
}
