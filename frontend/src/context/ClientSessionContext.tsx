import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type SessionClient = {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  cpf?: string;
};

export type AnalysisFlowMode =
  | "completo"
  | "capilar_individual"
  | "tricologica_individual";

export type AnalysisKind = "capilar" | "tricologica";

export type AnalysisFlowState = {
  mode: AnalysisFlowMode;
  tricologicaDone: boolean;
  capilarDone: boolean;
  tricologicaOverride: boolean;
  tricologicaHistoryId?: string | null;
  capilarHistoryId?: string | null;
  updatedAt?: string;
};

type ClientSessionContextValue = {
  activeClient: SessionClient | null;
  hasSession: boolean;
  startSession: (client: SessionClient, mode?: AnalysisFlowMode) => void;
  endSession: () => void;
  flowState: AnalysisFlowState;
  setFlowMode: (mode: AnalysisFlowMode) => void;
  setTricologicaOverride: (active: boolean) => void;
  markAnalysisCompleted: (kind: AnalysisKind, historyId?: string | null) => void;
  resetFlowProgress: () => void;
  isCompleteProtocolReady: boolean;
  nextRequiredStep: "tricologica" | "capilar" | "protocolo";
};

const SESSION_STORAGE_KEY = "has_active_client_session_v1";
const FLOW_STORAGE_KEY = "has_active_client_flow_v1";

const ClientSessionContext = createContext<ClientSessionContextValue | undefined>(undefined);

function createDefaultFlowState(mode: AnalysisFlowMode = "completo"): AnalysisFlowState {
  return {
    mode,
    tricologicaDone: false,
    capilarDone: false,
    tricologicaOverride: false,
    tricologicaHistoryId: null,
    capilarHistoryId: null,
    updatedAt: new Date().toISOString(),
  };
}

export function ClientSessionProvider({ children }: { children: React.ReactNode }) {
  const [activeClient, setActiveClient] = useState<SessionClient | null>(null);
  const [flowByClient, setFlowByClient] = useState<Record<string, AnalysisFlowState>>({});

  useEffect(() => {
    try {
      const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (rawSession) {
        const parsedSession = JSON.parse(rawSession);
        if (parsedSession && parsedSession.id && parsedSession.nome) {
          setActiveClient(parsedSession);
        }
      }
    } catch {
      setActiveClient(null);
    }

    try {
      const rawFlow = localStorage.getItem(FLOW_STORAGE_KEY);
      if (!rawFlow) return;
      const parsedFlow = JSON.parse(rawFlow);
      if (parsedFlow && typeof parsedFlow === "object") {
        setFlowByClient(parsedFlow);
      }
    } catch {
      setFlowByClient({});
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(flowByClient));
    } catch {
      // no-op
    }
  }, [flowByClient]);

  const startSession = (client: SessionClient, mode: AnalysisFlowMode = "completo") => {
    setActiveClient(client);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(client));
    setFlowByClient((prev) => {
      const current = prev[client.id];
      if (!current) {
        return {
          ...prev,
          [client.id]: createDefaultFlowState(mode),
        };
      }

      if (current.mode === mode) {
        return prev;
      }

      return {
        ...prev,
        [client.id]: {
          ...current,
          mode,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const endSession = () => {
    setActiveClient(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const activeFlow = useMemo(() => {
    if (!activeClient?.id) return createDefaultFlowState();
    return flowByClient[activeClient.id] || createDefaultFlowState();
  }, [activeClient?.id, flowByClient]);

  const setFlowMode = (mode: AnalysisFlowMode) => {
    const clientId = activeClient?.id;
    if (!clientId) return;
    setFlowByClient((prev) => {
      const current = prev[clientId] || createDefaultFlowState();
      return {
        ...prev,
        [clientId]: {
          ...current,
          mode,
          tricologicaOverride: mode === "completo" ? current.tricologicaOverride : false,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const setTricologicaOverride = (active: boolean) => {
    const clientId = activeClient?.id;
    if (!clientId) return;
    setFlowByClient((prev) => {
      const current = prev[clientId] || createDefaultFlowState();
      return {
        ...prev,
        [clientId]: {
          ...current,
          tricologicaOverride: active,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const markAnalysisCompleted = (kind: AnalysisKind, historyId?: string | null) => {
    const clientId = activeClient?.id;
    if (!clientId) return;
    setFlowByClient((prev) => {
      const current = prev[clientId] || createDefaultFlowState();
      return {
        ...prev,
        [clientId]: {
          ...current,
          tricologicaDone: kind === "tricologica" ? true : current.tricologicaDone,
          capilarDone: kind === "capilar" ? true : current.capilarDone,
          tricologicaOverride: kind === "tricologica" ? false : current.tricologicaOverride,
          tricologicaHistoryId:
            kind === "tricologica" ? historyId ?? current.tricologicaHistoryId : current.tricologicaHistoryId,
          capilarHistoryId:
            kind === "capilar" ? historyId ?? current.capilarHistoryId : current.capilarHistoryId,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  const resetFlowProgress = () => {
    const clientId = activeClient?.id;
    if (!clientId) return;
    setFlowByClient((prev) => {
      const current = prev[clientId] || createDefaultFlowState();
      return {
        ...prev,
        [clientId]: createDefaultFlowState(current.mode),
      };
    });
  };

  const isCompleteProtocolReady = activeFlow.tricologicaDone && activeFlow.capilarDone;
  const nextRequiredStep: "tricologica" | "capilar" | "protocolo" = !activeFlow.tricologicaDone
    ? "tricologica"
    : !activeFlow.capilarDone
      ? "capilar"
      : "protocolo";

  const value = useMemo(
    () => ({
      activeClient,
      hasSession: Boolean(activeClient?.id),
      startSession,
      endSession,
      flowState: activeFlow,
      setFlowMode,
      setTricologicaOverride,
      markAnalysisCompleted,
      resetFlowProgress,
      isCompleteProtocolReady,
      nextRequiredStep,
    }),
    [activeClient, activeFlow, isCompleteProtocolReady, nextRequiredStep],
  );

  return (
    <ClientSessionContext.Provider value={value}>
      {children}
    </ClientSessionContext.Provider>
  );
}

export function useClientSession() {
  const ctx = useContext(ClientSessionContext);
  if (!ctx) {
    throw new Error("useClientSession must be used within ClientSessionProvider");
  }
  return ctx;
}
