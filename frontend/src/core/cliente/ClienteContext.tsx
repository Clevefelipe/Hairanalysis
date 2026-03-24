import { createContext, useContext, useEffect, useState } from "react";
import { listarClientes, type Cliente } from "./cliente.service";

interface ClienteContextData {
  clientes: Cliente[];
  carregarClientes: () => Promise<void>;
}

const ClienteContext = createContext<ClienteContextData | undefined>(undefined);

export function ClienteProvider({ children }: { children: React.ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([]); // ✅ NUNCA undefined

  async function carregarClientes() {
    try {
      const data = await listarClientes();

      // ✅ GARANTIA ABSOLUTA DE ARRAY
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      setClientes([]); // ✅ fallback seguro
    }
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  return (
    <ClienteContext.Provider value={{ clientes, carregarClientes }}>
      {children}
    </ClienteContext.Provider>
  );
}

export function useCliente() {
  const context = useContext(ClienteContext);
  if (!context) {
    throw new Error("useCliente deve ser usado dentro de ClienteProvider");
  }
  return context;
}
