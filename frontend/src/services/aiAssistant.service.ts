import api from "./api";

export type AiAssistantRequest = {
  question: string;
  context?: Record<string, unknown>;
};

export type AiAssistantResponse = {
  answer: string;
  sources?: { label: string; reference?: string }[];
};

export async function askAiAssistant(
  payload: AiAssistantRequest,
): Promise<AiAssistantResponse> {
  const { data } = await api.post<AiAssistantResponse>("/assistant/chat", payload);
  if (!data || typeof data.answer !== "string") {
    throw new Error("Resposta inválida da IA");
  }
  return data;
}
