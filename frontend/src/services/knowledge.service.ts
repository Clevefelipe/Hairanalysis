import api from "./api";

export async function ingestKnowledgeText(payload: {
  content: string;
  domain: "tricologia" | "capilar";
  language: "pt" | "en";
  title?: string;
}) {
  const response = await api.post("/knowledge/ingest-text", payload);
  return response.data;
}

export async function ingestKnowledgeFile(params: {
  file: File;
  domain: "tricologia" | "capilar";
  title?: string;
}) {
  const formData = new FormData();
  formData.append("file", params.file);
  const query = new URLSearchParams({
    domain: params.domain,
  });
  if (params.title) query.set("title", params.title);

  const response = await api.post(
    `/knowledge/ingest-file?${query.toString()}`,
    formData
  );
  return response.data;
}

export async function searchKnowledge(query: string, domain: "tricologia" | "capilar") {
  const response = await api.get("/knowledge/search", {
    params: { q: query, domain },
  });
  return response.data;
}

export type KnowledgeDocumentGroupRow = {
  groupId: string;
  domain: "tricologia" | "capilar";
  title?: string;
  sourceType: string;
  sourceName?: string;
  createdAt: string;
  chunks: string | number;
  language?: string;
};

export async function listKnowledgeDocuments(domain?: "tricologia" | "capilar") {
  const response = await api.get("/knowledge/documents", {
    params: domain ? { domain } : undefined,
  });
  return response.data as KnowledgeDocumentGroupRow[];
}

export type KnowledgeDocumentChunk = {
  id: string;
  groupId?: string;
  chunkIndex?: number;
  domain: "tricologia" | "capilar";
  title?: string;
  content: string;
  sourceType: string;
  createdAt: string;
};

export type KnowledgeDocumentGroupPreview = {
  groupId: string;
  domain: "tricologia" | "capilar";
  title?: string;
  sourceType: string;
  createdAt: string;
  chunks: number;
  previewText: string;
};

export async function getKnowledgeDocumentGroup(groupId: string) {
  const response = await api.get(`/knowledge/documents/${groupId}`);
  return response.data as KnowledgeDocumentChunk[];
}

export async function getKnowledgeDocumentGroupPreview(
  groupId: string,
  maxChars?: number,
) {
  const response = await api.get(
    `/knowledge/documents/${groupId}/preview`,
    {
      params: typeof maxChars === "number" ? { maxChars } : undefined,
    },
  );
  return response.data as KnowledgeDocumentGroupPreview;
}

export async function deleteKnowledgeDocumentGroup(groupId: string) {
  const response = await api.delete(`/knowledge/documents/${groupId}`);
  return response.data as { success: boolean; deleted?: number };
}
