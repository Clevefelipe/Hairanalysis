import { createContext, useCallback, useContext, useState, type JSX } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  notify: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            className="toast-stack"
            style={{ position: "fixed", bottom: 16, right: 16, zIndex: 9999, pointerEvents: "none" }}
          >
            {toasts.map((toast) => {
              const tone = toast.type;
              const toneClasses: Record<ToastType, string> = {
                success: "toast-card toast-success",
                error: "toast-card toast-error",
                warning: "toast-card toast-warning",
                info: "toast-card toast-info",
              };
              const toneStyles: Record<ToastType, React.CSSProperties> = {
                success: {
                  background: "linear-gradient(135deg, #16a34a, #22c55e)",
                  color: "#f8fff5",
                  borderColor: "rgba(255,255,255,0.16)",
                },
                error: {
                  background: "linear-gradient(135deg, #dc2626, #ef4444)",
                  color: "#fff8f8",
                  borderColor: "rgba(255,255,255,0.16)",
                },
                warning: {
                  background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                  color: "#2d1c07",
                  borderColor: "rgba(255,255,255,0.2)",
                },
                info: {
                  background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                  color: "#f6f8ff",
                  borderColor: "rgba(255,255,255,0.16)",
                },
              };
              const icons: Record<ToastType, JSX.Element> = {
                success: <CheckCircle2 size={18} />,
                error: <XCircle size={18} />,
                warning: <TriangleAlert size={18} />,
                info: <Info size={18} />,
              };

              return (
                <div
                  key={toast.id}
                  className={toneClasses[tone]}
                  style={{ pointerEvents: "auto", ...toneStyles[tone] }}
                >
                  <div className="toast-icon">{icons[tone]}</div>
                  <div className="toast-body">
                    <p>{toast.message}</p>
                  </div>
                  <button
                    className="toast-close"
                    onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                    aria-label="Fechar aviso"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
