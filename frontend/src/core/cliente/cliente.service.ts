import { api } from "../../lib/api";

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuidV4(id?: string | null) {
  return typeof id === "string" && UUID_V4_REGEX.test(id.trim());
}

export interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  cpf?: string;
  codigo?: string;
  dataNascimento?: string;
  observacoes?: string;
}

export interface CriarClienteDTO {
  nome: string;
  telefone?: string;
  email?: string;
  cpf?: string;
  codigo?: string;
  dataNascimento?: string;
  observacoes?: string;
}

export interface AtualizarClienteDTO {
  nome: string;
  telefone?: string;
  email?: string;
  cpf?: string;
  codigo?: string;
  dataNascimento?: string;
  observacoes?: string;
}

export type ClienteSearchScope = "nome" | "telefone" | "cpf" | "email" | "codigo";

type ListarClientesParams = {
  q?: string;
  scope?: ClienteSearchScope;
};

export async function listarClientes(params?: ListarClientesParams): Promise<Cliente[]> {
  try {
    const response = await api.get("/clientes", {
      params: {
        q: params?.q?.trim() || undefined,
        scope: params?.scope,
      },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch {
    return [];
  }
}

export async function obterClientePorId(id: string): Promise<Cliente> {
  if (!isValidUuidV4(id)) {
    return Promise.reject(new Error("ID de cliente inválido"));
  }
  try {
    const response = await api.get(`/clientes/${id}`);
    if (!response.data || typeof response.data !== "object") {
      throw new Error("Cliente não encontrado");
    }
    return response.data as Cliente;
  } catch (error) {
    // fallback seguro para não quebrar a UI
    return Promise.reject(error);
  }
}

export async function criarCliente(
  payload: CriarClienteDTO
): Promise<Cliente> {
  const response = await api.post("/clientes", payload);
  return response.data;
}

export async function atualizarCliente(
  id: string,
  payload: AtualizarClienteDTO
): Promise<Cliente> {
  const response = await api.put(`/clientes/${id}`, payload);
  return response.data;
}

export async function excluirCliente(id: string): Promise<void> {
  await api.delete(`/clientes/${id}`);
}
