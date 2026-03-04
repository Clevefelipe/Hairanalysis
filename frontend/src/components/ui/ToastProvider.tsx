import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastType = "success" | "warning" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  notify: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const notify = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[9999] flex w-[320px] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border px-3 py-2 text-sm shadow-sm"
            style={{
              backgroundColor:
                item.type === "error"
                  ? "#fee2e2"
                  : item.type === "warning"
                    ? "#fef3c7"
                    : item.type === "success"
                      ? "#dcfce7"
                      : "#e0f2fe",
              borderColor:
                item.type === "error"
                  ? "#fecaca"
                  : item.type === "warning"
                    ? "#fde68a"
                    : item.type === "success"
                      ? "#bbf7d0"
                      : "#bae6fd",
              color:
                item.type === "error"
                  ? "#7f1d1d"
                  : item.type === "warning"
                    ? "#92400e"
                    : item.type === "success"
                      ? "#166534"
                      : "#0c4a6e",
            }}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

