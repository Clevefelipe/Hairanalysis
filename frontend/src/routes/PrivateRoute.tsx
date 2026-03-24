import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = {
  requiredRole?: "ADMIN" | "PROFESSIONAL";
  children?: React.ReactNode;
};

export default function PrivateRoute({
  requiredRole,
  children,
}: Props) {
  const { token, user, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-sm font-medium text-slate-600">Validando sessão...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const currentRole = (user as any)?.role;
    if (currentRole !== requiredRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}
