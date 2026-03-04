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

export type HistoryShareResponse = {
  token: string;
  url: string;
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
  clientId?: string;
  domain?: AnalysisType;
  q?: string;
};

export async function getHistoryByClient(
  clientId: string,
  filters?: HistoryFilters
): Promise<AnalysisHistory[]> {
  const params = {
    ...(filters || {}),
    clientId,
    domain:
      filters?.domain === "tricologica"
        ? "tricologia"
        : filters?.domain,
  };
  const res = await api.get("/history", { params });
  return Array.isArray(res.data) ? res.data : [];
}

export async function listHistoryByClient(
  clientId: string,
  filters?: HistoryFilters
): Promise<AnalysisHistory[]> {
  return getHistoryByClient(clientId, filters);
}

export const historyService = {
  async getDashboard(salonId?: string): Promise<DashboardResponse> {
    const res = await api.get("/history/dashboard", {
      params: salonId ? { salonId } : undefined,
    });
    return res.data;
  },

  async list(): Promise<AnalysisHistory[]> {
    const res = await api.get("/history");
    return Array.isArray(res.data) ? res.data : [];
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

  async share(historyId: string): Promise<HistoryShareResponse> {
    const response = await api.post(`/history/share/${historyId}`);
    return response.data;
  },
};
