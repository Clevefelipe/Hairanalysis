import api from "./api";

/* =====================
 * TIPOS
 * ===================== */

export type HistoryEntityDTO = {
  id: string;
  clientId: string;
  clientName?: string;
  salonId?: string;
  professionalId: string;
  visionResult: any;
  aiExplanation?: any;
  recommendations?: any;
  createdAt: string;
};

export type AnalysisHistory = {
  id: string;
  clientId: string;
  clientName?: string;
  createdAt: string;
  analysisType: "capilar" | "tricologica" | "geral";
  score: number;
  flags: string[];
  interpretation: string;
  aiExplanation?: any;
  aiExplanationText?: string;
  recommendations?: any;
  source?: "imagem" | "video" | "tempo-real" | "microscopio";
  sourceLabel?: string;
};

export type DashboardMetrics = {
  totalAnalyses: number;
  safeAnalyses: number;
  flaggedAnalyses: number;
  avgScore: number;
  today: {
    count: number;
    delta: number;
    yesterday: number;
  };
  score: {
    currentWeekAvg: number;
    previousWeekAvg: number;
  };
  upcoming: {
    next7d: number;
  };
  alertsByType?: Record<string, number>;
  week: {
    current: {
      total: number;
      capilar: number;
      tricologica: number;
      alerts: number;
    };
    previous: {
      total: number;
      capilar: number;
      tricologica: number;
      alerts: number;
    };
  };
};

type DashboardHistoryDTO = {
  id: string;
  clientId: string;
  clientName?: string;
  createdAt: string;
  analysisType: "capilar" | "tricologica" | "geral";
  visionResult?: any;
  score: number;
  flags: string[];
  interpretation: string;
  aiExplanation?: any;
  recommendations?: any;
};

type DashboardNextVisitDTO = {
  id: string;
  clientId: string;
  clientName?: string;
  analysisType: "capilar" | "tricologica" | "geral";
  interval: number;
  nextDate: string;
};

type DashboardResponseDTO = {
  items?: DashboardHistoryDTO[];
  alerts?: DashboardHistoryDTO[];
  nextVisits?: DashboardNextVisitDTO[];
  metrics?: DashboardMetrics;
};

export type DashboardNextVisit = {
  id: string;
  clientId: string;
  clientName?: string;
  analysisType: "capilar" | "tricologica" | "geral";
  interval: number;
  nextDate: Date;
};

export type DashboardResponse = {
  items: AnalysisHistory[];
  alerts: AnalysisHistory[];
  nextVisits: DashboardNextVisit[];
  metrics: DashboardMetrics;
};

type DashboardQuery = {
  salonId?: string;
  period?: "7d" | "30d" | "90d";
  professionalScope?: "all" | "me";
};

export type DashboardNotification = {
  id: string;
  type: "alert" | "visit";
  title: string;
  createdAt: string;
  relatedId: string;
  clientId?: string;
  clientName?: string;
  analysisType?: "capilar" | "tricologica" | "geral";
};

export type HistoryNotificationsResponse = {
  notifications: DashboardNotification[];
  readIds: string[];
};

function resolveAnalysisType(vision: any, recommendations?: any): "capilar" | "tricologica" | "geral" {
  const rawType = String(vision?.analysisType || vision?.type || "").toLowerCase();

  if (rawType.includes("geral") || rawType.includes("completo") || rawType.includes("combin")) {
    return "geral";
  }

  const hasScalpTreatments = Array.isArray(recommendations?.scalpTreatments)
    ? recommendations.scalpTreatments.length > 0
    : false;
  const hasHairTreatments =
    (Array.isArray(recommendations?.treatments) ? recommendations.treatments.length : 0) > 0 ||
    (Array.isArray(recommendations?.homeCare) ? recommendations.homeCare.length : 0) > 0;

  if (hasScalpTreatments && hasHairTreatments) return "geral";
  if (rawType.includes("tricolog")) return "tricologica";
  if (rawType.includes("capilar")) return "capilar";
  return hasScalpTreatments ? "tricologica" : "capilar";
}

function normalizeClientName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export async function getHistoryNotifications(limit = 10): Promise<HistoryNotificationsResponse> {
  try {
    const { data } = await api.get("/history/notifications", {
      params: { limit },
    });

    if (!data || typeof data !== "object") {
      return { notifications: [], readIds: [] };
    }

    const readIds = Array.isArray((data as any).readIds)
      ? (data as any).readIds.map((id: any) => String(id)).filter(Boolean)
      : [];

    const notificationsRaw = Array.isArray((data as any).notifications)
      ? (data as any).notifications
      : Array.isArray(data)
        ? data
        : [];

    const notifications = notificationsRaw
      .filter((item: any) => item && item.id && item.title)
      .map((item: any) => ({
        id: item.id,
        type: item.type === "visit" ? "visit" : "alert",
        title: item.title,
        createdAt: item.createdAt,
        relatedId: item.relatedId,
        clientId: item.clientId,
        clientName: normalizeClientName(item.clientName),
        analysisType:
          item.analysisType === "tricologica"
            ? "tricologica"
            : item.analysisType === "geral"
              ? "geral"
              : "capilar",
      }));

    return { notifications, readIds };
  } catch (error) {
    return { notifications: [], readIds: [] };
  }
}

export async function markHistoryNotificationsAsRead(
  notificationIds: string[],
): Promise<{ updated: number }> {
  try {
    const { data } = await api.post("/history/notifications/mark-read", {
      notificationIds,
    });
    return data || { updated: 0 };
  } catch {
    return { updated: 0 };
  }
}

function normalizeHistoryItem(item: HistoryEntityDTO): AnalysisHistory {
  const vision = item?.visionResult || {};
  const analysisType = resolveAnalysisType(vision, item?.recommendations);
  const sourceRaw = String(
    vision?.source ||
      item?.visionResult?.source ||
      "",
  ).trim().toLowerCase();
  const source =
    sourceRaw === "video"
      ? "video"
      : sourceRaw === "tempo-real"
        ? "tempo-real"
        : sourceRaw === "microscopio"
          ? "microscopio"
          : sourceRaw === "imagem"
            ? "imagem"
            : undefined;
  const sourceLabel =
    typeof vision?.sourceLabel === "string" && vision.sourceLabel.trim()
      ? vision.sourceLabel.trim()
      : source === "video"
        ? "Frame em vídeo"
        : source === "tempo-real"
          ? "Tempo real"
          : source === "microscopio"
            ? "Microscópio"
            : source === "imagem"
              ? "Captura fotográfica"
              : undefined;

  const score = extractScore(item, vision);
  const flags = Array.isArray(vision?.flags) ? vision.flags : [];

  const premiumSummary =
    typeof item?.aiExplanation?.summary === "string" ? item.aiExplanation.summary : undefined;

  const ragText =
    typeof item?.aiExplanation?.ragSupport === "string" ? item.aiExplanation.ragSupport : undefined;

  const interpretation =
    premiumSummary ||
    (typeof vision?.interpretation === "string" ? vision.interpretation : "");

  const aiExplanationText = ragText;

  return {
    id: item.id,
    clientId: item.clientId,
    clientName: normalizeClientName(item.clientName),
    createdAt: item.createdAt,
    analysisType,
    score,
    flags,
    interpretation,
    aiExplanation: item.aiExplanation,
    aiExplanationText,
    recommendations: item.recommendations,
    source,
    sourceLabel,
  };
}

function mapDashboardHistory(item: DashboardHistoryDTO): AnalysisHistory {
  const sourceRaw = String(item?.visionResult?.source || "").trim().toLowerCase();
  const source =
    sourceRaw === "video"
      ? "video"
      : sourceRaw === "tempo-real"
        ? "tempo-real"
        : sourceRaw === "microscopio"
          ? "microscopio"
          : sourceRaw === "imagem"
            ? "imagem"
            : undefined;
  const sourceLabel =
    typeof item?.visionResult?.sourceLabel === "string" &&
    item.visionResult.sourceLabel.trim()
      ? item.visionResult.sourceLabel.trim()
      : source === "video"
        ? "Frame em vídeo"
        : source === "tempo-real"
          ? "Tempo real"
          : source === "microscopio"
            ? "Microscópio"
            : source === "imagem"
              ? "Captura fotográfica"
              : undefined;
  return {
    id: item.id,
    clientId: item.clientId,
    clientName: normalizeClientName(item.clientName),
    createdAt: item.createdAt,
    analysisType: item.analysisType,
    score: extractScore(item, item.visionResult),
    flags: Array.isArray(item.flags) ? item.flags : [],
    interpretation: item.interpretation ?? "",
    aiExplanation: item.aiExplanation,
    recommendations: item.recommendations,
    aiExplanationText:
      typeof item.aiExplanation?.ragSupport === "string"
        ? item.aiExplanation.ragSupport
        : undefined,
    source,
    sourceLabel,
  };
}

function extractScore(item: any, vision?: any): number {
  const recommendationScore = item?.recommendation?.score ?? item?.recommendations?.score;
  if (typeof recommendationScore === "number") return recommendationScore;
  const visionScore = vision?.score;
  if (typeof visionScore === "number") return visionScore;
  const numericVision = Number(visionScore);
  if (!Number.isNaN(numericVision) && numericVision !== 0) return numericVision;
  const numericItem = Number(item?.score);
  if (!Number.isNaN(numericItem)) return numericItem;
  return 0;
}

/* =====================
 * DASHBOARD
 * ===================== */

export async function getHistoryDashboard(
  query?: DashboardQuery,
): Promise<DashboardResponse> {
  try {
    const config = query ? { params: query } : undefined;
    const { data } = await api.get("/history/dashboard", config);

    if (!data || typeof data !== "object") {
      return {
        items: [],
        alerts: [],
        nextVisits: [],
        metrics: defaultMetrics,
      };
    }

    const payload = data as DashboardResponseDTO;

    return {
      items: (payload.items || []).map(mapDashboardHistory),
      alerts: (payload.alerts || []).map(mapDashboardHistory),
      nextVisits: (payload.nextVisits || []).map((visit) => ({
        ...visit,
        nextDate: new Date(visit.nextDate),
      })),
      metrics: payload.metrics || defaultMetrics,
    };
  } catch (error) {
    return {
      items: [],
      alerts: [],
      nextVisits: [],
      metrics: defaultMetrics,
    };
  }
}

const defaultMetrics: DashboardMetrics = {
  totalAnalyses: 0,
  safeAnalyses: 0,
  flaggedAnalyses: 0,
  avgScore: 0,
  today: {
    count: 0,
    delta: 0,
    yesterday: 0,
  },
  score: {
    currentWeekAvg: 0,
    previousWeekAvg: 0,
  },
  upcoming: {
    next7d: 0,
  },
  alertsByType: {},
  week: {
    current: {
      total: 0,
      capilar: 0,
      tricologica: 0,
      alerts: 0,
    },
    previous: {
      total: 0,
      capilar: 0,
      tricologica: 0,
      alerts: 0,
    },
  },
};

/* =====================
 * LISTAGENS
 * ===================== */

export async function listHistoryByClient(
  clientId: string
): Promise<AnalysisHistory[]> {
  try {
    const { data } = await api.get(`/history/client/${clientId}`);
    return Array.isArray(data)
      ? (data as HistoryEntityDTO[]).map(normalizeHistoryItem)
      : [];
  } catch (error) {
    console.error("listHistoryByClient failed", error);
    return [];
  }
}

export async function getHistoryById(
  historyId: string
): Promise<AnalysisHistory | null> {
  const { data } = await api.get(`/history/${historyId}`);
  return data ? normalizeHistoryItem(data as HistoryEntityDTO) : null;
}

/* =====================
 * COMPARAÇÃO / EVOLUÇÃO
 * ===================== */

export async function compareHistory(
  firstId: string,
  secondId: string
): Promise<any | null> {
  try {
    const { data } = await api.get(`/history/compare`, {
      params: {
        baseId: firstId,
        targetId: secondId,
      },
    });

    const items = Array.isArray(data) ? data : [];
    if (items.length < 2) return null;

    // normaliza para garantir score/interpretation calculados como no restante da aplicação
    const normalized = items
      .map((item) => normalizeHistoryItem(item as HistoryEntityDTO))
      .sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    const from = normalized[0];
    const to = normalized[normalized.length - 1];

    const scoreDelta =
      typeof from.score === "number" && typeof to.score === "number"
        ? Number((to.score - from.score).toFixed(1))
        : undefined;

    return {
      from,
      to,
      scoreDelta,
      summary: to?.interpretation || from?.interpretation,
      details: [],
    };
  } catch (error: any) {
    return null;
  }
}

/* =====================
 * RECOMENDAÇÕES IA
 * ===================== */

export async function getHistoryRecommendations(
  historyId: string
): Promise<any | null> {
  const { data } = await api.get(
    `/history/${historyId}/recommendations`
  );
  return data ?? null;
}

/* =====================
 * PDF
 * ===================== */

export async function getHistoryPdf(
  historyId: string
): Promise<Blob> {
  const response = await api.get(
    `/history/${historyId}/pdf`,
    {
      responseType: "blob",
    }
  );
  return response.data;
}

/* =====================
 * COMPARTILHAMENTO
 * ===================== */

export async function shareHistory(
  historyId: string
): Promise<{ url: string }> {
  const { data } = await api.post(
    `/history/${historyId}/share`
  );
  return data;
}

export async function updateNextVisit(
  historyId: string,
  payload: {
    action: "confirm" | "reschedule";
    nextDate?: string;
    notes?: string;
  },
) {
  const { data } = await api.patch(`/history/${historyId}/next-visit`, payload);
  return data as AnalysisHistory;
}
