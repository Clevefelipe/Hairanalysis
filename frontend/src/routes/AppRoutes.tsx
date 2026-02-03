import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PrivateRoute from "./PrivateRoute";
import Layout from "../components/layout/Layout";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import AnaliseTricologica from "../pages/AnaliseTricologica";
import AnaliseCapilar from "../pages/AnaliseCapilar";
import HistoryPage from "../pages/HistoryPage";
import HistoryDetailPage from "../pages/HistoryDetailPage";
import HistoryEvolutionPage from "../pages/HistoryEvolutionPage";
import AuditLogs from "../pages/AuditLogs";
import ListagemClientes from "../pages/cliente/Listagem";

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
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analise-tricologica" element={<AnaliseTricologica />} />
        <Route path="/analise-capilar" element={<AnaliseCapilar />} />
        <Route path="/clientes" element={<ListagemClientes />} />
        <Route path="/historico" element={<HistoryPage />} />
        <Route path="/historico/:id" element={<HistoryDetailPage />} />
        <Route path="/historico/evolucao" element={<HistoryEvolutionPage />} />
      </Route>

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
            to={token ? "/clientes" : "/login"}
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to={token ? "/clientes" : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}
