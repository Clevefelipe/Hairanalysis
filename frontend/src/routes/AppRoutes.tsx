import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PrivateRoute from "./PrivateRoute";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import AnaliseTricologica from "../pages/AnaliseTricologica";
import AnaliseCapilar from "../pages/AnaliseCapilar";
import HistoryPage from "../pages/HistoryPage";
import AuditLogs from "../pages/AuditLogs";

export default function AppRoutes() {
  const { token, isReady } = useAuth();

  // ⛔ NÃO renderiza rotas até o auth estar pronto
  if (!isReady) {
    return null; // ou loading
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/analise-tricologica"
        element={
          <PrivateRoute>
            <AnaliseTricologica />
          </PrivateRoute>
        }
      />

      <Route
        path="/analise-capilar"
        element={
          <PrivateRoute>
            <AnaliseCapilar />
          </PrivateRoute>
        }
      />

      <Route
        path="/historico"
        element={
          <PrivateRoute>
            <HistoryPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/administracao/audit"
        element={
          <PrivateRoute requiredRole="ADMIN">
            <AuditLogs />
          </PrivateRoute>
        }
      />

      <Route
        path="/"
        element={
          <Navigate
            to={token ? "/dashboard" : "/login"}
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to={token ? "/dashboard" : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}
