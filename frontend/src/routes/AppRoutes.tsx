import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PrivateRoute from "./PrivateRoute";
import Layout from "../components/layout/Layout";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import AnalisesHub from "../pages/AnalisesHub";
import AnaliseTricologica from "../pages/AnaliseTricologica";
import AnaliseCapilar from "../pages/AnaliseCapilar";
import HistoryPage from "../pages/HistoryPage";
import HistoryDetailPage from "../pages/HistoryDetailPage";
import HistoryEvolutionPage from "../pages/HistoryEvolutionPage";
import HistoricoAnalises from "../pages/HistoricoAnalises";
import HistoricoVision from "../pages/HistoricoVision";
import AuditLogs from "../pages/AuditLogs";
import ListagemClientes from "../pages/cliente/Listagem";
import PublicHistoryReport from "../pages/PublicHistoryReport";
import Alisamentos from "../pages/Alisamentos";
import Services from "../pages/Services";
import SalonBranding from "../pages/SalonBranding";
import RelatorioVisionPDF from "../pages/RelatorioVisionPDF";
import RelatorioVisionCliente from "../pages/RelatorioVisionCliente";
import ValidateReport from "../pages/ValidateReport";

function ClientHistoryRedirect() {
  const { id } = useParams<{ id: string }>();
  const target = id ? `/historico?clientId=${id}` : "/historico";
  return <Navigate to={target} replace />;
}

export default function AppRoutes() {
  const { token, isReady } = useAuth();

  // ⛔ NÃO renderiza rotas até o auth estar pronto
  if (!isReady) {
    return null; // ou loading
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/publico/:token" element={<PublicHistoryReport />} />

      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analises" element={<AnalisesHub />} />
        <Route path="/analise-tricologica" element={<AnaliseTricologica />} />
        <Route path="/analise-capilar" element={<AnaliseCapilar />} />
        <Route path="/clientes" element={<ListagemClientes />} />
        <Route path="/historico" element={<HistoryPage />} />
        <Route path="/historico/:id" element={<HistoryDetailPage />} />
        <Route path="/historico/evolucao" element={<HistoryEvolutionPage />} />
        <Route path="/historico-analises" element={<HistoricoAnalises />} />
        <Route path="/historico-vision" element={<HistoricoVision />} />
        <Route path="/clientes/:id/historico" element={<ClientHistoryRedirect />} />
        <Route path="/alisamentos" element={<Alisamentos />} />
        <Route path="/servicos" element={<Services />} />
        <Route path="/branding" element={<SalonBranding />} />
        <Route path="/relatorio-vision/:id" element={<RelatorioVisionPDF />} />
        <Route path="/relatorio-vision-cliente/:id" element={<RelatorioVisionCliente />} />
        <Route path="/verificar-relatorio/:id" element={<ValidateReport />} />
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
