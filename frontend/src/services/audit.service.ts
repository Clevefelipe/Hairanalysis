import api from "./api";

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  salonId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AuditResponse {
  page: number;
  limit: number;
  total: number;
  items: AuditLog[];
}

export async function getAuditLogs(
  page = 1,
  limit = 20,
  action?: string,
): Promise<AuditResponse> {
  const params: any = { page, limit };

  if (action) {
    params.action = action;
  }

  const response = await api.get<AuditResponse>("/audit", {
    params,
  });

  return response.data;
}
