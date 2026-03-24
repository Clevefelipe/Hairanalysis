export interface AnaliseCapilarRegistro {
  id: string;
  data: string;
  resumo: string;
  score?: number;
  nivel?: string;
  flags: string[];
  recomendacoes: string[];
}

const STORAGE_KEY = "has_analises_capilares";

export function listarAnalises(): AnaliseCapilarRegistro[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function salvarAnalise(registro: AnaliseCapilarRegistro) {
  const atuais = listarAnalises();
  const atualizadas = [registro, ...atuais];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizadas));
}
