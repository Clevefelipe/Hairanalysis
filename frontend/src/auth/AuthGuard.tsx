import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthGuard({
  children,
}: {
  children: ReactNode;
}) {
  const { token, isReady } = useAuth();

  if (!isReady) return null;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
