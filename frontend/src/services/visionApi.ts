import api from "./api";

export async function salvarVisionBackend(clientId: string, payload: any) {
  try {
    const res = await api.post("/vision/process", {
      clientId,
      ...payload,
    });
    return res.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Erro ao salvar no histórico";
    throw new Error(message);
  }
}
