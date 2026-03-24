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

  const response = await api.get<AuditResponse | AuditLog[]>("/audit", {
    params,
  });

  const payload = response.data as any;
  if (Array.isArray(payload)) {
    return {
      page,
      limit,
      total: payload.length,
      items: payload,
    };
  }

  return {
    page: typeof payload?.page === "number" ? payload.page : page,
    limit: typeof payload?.limit === "number" ? payload.limit : limit,
    total: typeof payload?.total === "number" ? payload.total : 0,
    items: Array.isArray(payload?.items) ? payload.items : [],
  };
}
