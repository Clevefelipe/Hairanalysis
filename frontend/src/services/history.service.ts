import api from "./api";

export type AnalysisType = "capilar" | "tricologica";

export type DashboardResponse = {
  total: number;
  capilar: number;
  tricologia: number;
  latest: {
    id: string;
    domain: AnalysisType;
    createdAt: string;
  }[];
};

export interface AnalysisHistory {
  id: string;
  createdAt: string;
  // Legacy/alternate fields used across screens
  domain?: AnalysisType;
  analysisType?: AnalysisType;
  score?: number;
  flags?: string[];
  interpretation?: string;
  signals?: Record<string, string>;
}

export type HistoryFilters = {
  domain?: AnalysisType;
  q?: string;
};

async function fetchHistoryFromPrimary(
  clientId: string,
  filters?: HistoryFilters
): Promise<AnalysisHistory[]> {
  const res = await api.get(
    `/clients/${clientId}/history`,
    { params: filters }
  );
  return res.data;
}

async function fetchHistoryFromFallback(
  clientId: string,
  filters?: HistoryFilters
): Promise<AnalysisHistory[]> {
  const res = await api.get(`/history/${clientId}`, {
    params: filters,
  });
  return res.data;
}

export async function getHistoryByClient(
  clientId: string,
  filters?: HistoryFilters
): Promise<AnalysisHistory[]> {
  try {
    return await fetchHistoryFromPrimary(
      clientId,
      filters
    );
  } catch {
    try {
      return await fetchHistoryFromFallback(
        clientId,
        filters
      );
    } catch {
      return [];
    }
  }
}

export const historyService = {
  async getDashboard(salonId?: string): Promise<DashboardResponse> {
    const res = await api.get("/history/dashboard", {
      params: salonId ? { salonId } : undefined,
    });
    return res.data;
  },

  async list(): Promise<AnalysisHistory[]> {
    // Sem rota global estavel ainda.
    return [];
  },

  
  async getByClient(
    clientId: string,
    filters?: HistoryFilters
  ): Promise<AnalysisHistory[]> {
    return getHistoryByClient(clientId, filters);
  },

  async downloadPdf(
    historyId: string,
    domain: AnalysisType = "capilar"
  ): Promise<Blob> {
    const response = await api.get(
      `/history/${historyId}/pdf`,
      {
        params: { domain },
        responseType: "blob",
      }
    );
    return response.data as Blob;
  },
};
