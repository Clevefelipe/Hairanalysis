import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface Props {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  fullScreen?: boolean;
}

export default function Modal({
  title,
  isOpen,
  onClose,
  children,
  fullScreen = false,
}: Props) {
  if (!isOpen) return null;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex bg-slate-900/55 backdrop-blur-[2px] animate-page-in ${
        fullScreen ? "px-0 py-0" : "items-center justify-center px-4 py-6"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative flex w-full flex-col overflow-hidden shadow-2xl ${
          fullScreen
            ? "h-full max-h-screen max-w-screen rounded-none border-0"
            : "max-w-4xl max-h-[90vh] rounded-xl"
        }`}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        style={{ backgroundColor: "var(--color-modal-surface, var(--color-surface, #f8f6f0))" }}
      >
        <div
          className={`flex items-center justify-between gap-3 border-b border-slate-900/45 bg-slate-900 px-4 py-2 sm:px-5 sm:py-2.5 ${
            fullScreen ? "rounded-none" : "rounded-t-xl"
          }`}
        >
          <h3
            className="text-[16px] font-medium leading-tight uppercase tracking-[0.22em]"
            style={{ color: "var(--color-text-on-strong, #f8fafc)" }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md focus-ring-strong text-white transition"
            style={{
              backgroundColor: "var(--color-error-600, #dc2626)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-error-700, #b91c1c)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-error-600, #dc2626)")}
            aria-label="Fechar"
          >
            <X size={18} className="text-white" />
          </button>
        </div>

        <div
          className="flex-1 overflow-auto px-5 py-5 sm:px-6 sm:py-6"
          style={{ backgroundColor: "var(--color-modal-surface, var(--color-surface, #f8f6f0))" }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
