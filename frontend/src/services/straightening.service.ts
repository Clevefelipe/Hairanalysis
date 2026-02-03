import api from "./api";

export interface StraighteningOption {
  id: string;
  name: string;
  description?: string;
  criteria?: Record<string, any>;
  createdAt?: string;
}

export interface CreateStraighteningPayload {
  name: string;
  description?: string;
  criteria?: Record<string, any>;
}

export async function listStraightenings(): Promise<StraighteningOption[]> {
  const res = await api.get("/straightenings");
  return res.data ?? [];
}

export async function createStraightening(
  payload: CreateStraighteningPayload
): Promise<StraighteningOption> {
  const res = await api.post("/straightenings", payload);
  return res.data;
}
