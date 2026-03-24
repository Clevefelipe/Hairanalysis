import { createContext, useContext, useState } from "react";

type FeedbackType = "success" | "error";

interface FeedbackItem {
  id: string;
  message: string;
  type: FeedbackType;
}

interface FeedbackContextData {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const FeedbackContext = createContext<FeedbackContextData | undefined>(
  undefined
);

export function FeedbackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);

  function addFeedback(message: string, type: FeedbackType) {
    const id = crypto.randomUUID();
    setFeedbacks((prev) => [...prev, { id, message, type }]);
  }

  function removeFeedback(id: string) {
    setFeedbacks((prev) => prev.filter((f) => f.id !== id));
  }

  function showSuccess(message: string) {
    addFeedback(message, "success");
  }

  function showError(message: string) {
    addFeedback(message, "error");
  }

  return (
    <FeedbackContext.Provider value={{ showSuccess, showError }}>
      {children}

      {/* STACK DE TOASTS */}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
        }}
      >
        {feedbacks.map((feedback) => (
          <button
            key={feedback.id}
            onClick={() => removeFeedback(feedback.id)}
            className={[
              "mb-2 block w-full rounded-lg border px-4 py-3 text-left text-sm shadow-sm",
              feedback.type === "success"
                ? "border-[color:var(--color-success-200)] bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)]"
                : "border-rose-200 bg-rose-50 text-rose-700",
            ].join(" ")}
            type="button"
          >
            {feedback.message}
          </button>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error(
      "useFeedback deve ser usado dentro de FeedbackProvider"
    );
  }
  return context;
}
