import api from "./api";

export type Protocolo = {
  id?: string;
  titulo: string;
  descricao: string;
  indicacoes: string[];
  clienteId: string;
  analiseId?: string;
  sugeridoIA?: boolean;
};

export const protocoloService = {
  async getByCliente(clienteId: string): Promise<Protocolo[]> {
    const res = await api.get(`/protocolos/cliente/${clienteId}`);
    return res.data;
  },

  async create(data: Partial<Protocolo>): Promise<Protocolo> {
    const res = await api.post(`/protocolos`, data);
    return res.data;
  },

  async update(id: string, data: Partial<Protocolo>): Promise<Protocolo> {
    const res = await api.put(`/protocolos/${id}`, data);
    return res.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/protocolos/${id}`);
  },
};
