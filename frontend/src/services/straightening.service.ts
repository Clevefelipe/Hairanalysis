import api from "./api";

export interface StraighteningCriteria {
  hairTypes?: string[];
  structures?: string[];
  volume?: string[];
  damageLevel?: string[];
  observations?: string;
}

export interface Straightening {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  criteria?: StraighteningCriteria;
}

export async function listStraightenings(
  includeInactive = false
): Promise<Straightening[]> {
  const { data } = await api.get("/straightening", {
    params: {
      includeInactive: includeInactive ? "true" : "false",
    },
  });
  return Array.isArray(data) ? data : [];
}

export async function createStraightening(
  payload: Partial<Straightening>
) {
  const { data } = await api.post("/straightening", payload);
  return data;
}

export async function updateStraightening(
  id: string,
  payload: Partial<Straightening>
) {
  const { data } = await api.patch(`/straightening/${id}` as const, payload);
  return data;
}

export async function deleteStraightening(id: string) {
  await api.delete(`/straightening/${id}` as const);
}

export async function toggleStraighteningStatus(id: string, active: boolean) {
  const { data } = await api.patch(`/straightening/${id}/status` as const, {
    active,
  });
  return data;
}
