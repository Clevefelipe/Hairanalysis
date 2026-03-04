import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const { token, isReady } = useAuth();

  // ⏳ Aguarda o AuthContext carregar
  if (!isReady) {
    return null;
  }

  // 🔒 Sem token → login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
