import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import PrivateRoute from "./PrivateRoute";
import Layout from "@/components/layout/Layout";

const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const AnalisesHub = lazy(() => import("@/pages/AnalisesHub"));
const AnaliseTricologica = lazy(() => import("@/pages/AnaliseTricologica"));
const AnaliseCapilar = lazy(() => import("@/pages/AnaliseCapilar"));
const AnaliseTricologicaRelatorio = lazy(
  () => import("@/pages/AnaliseTricologicaRelatorio"),
);
const HistoryPage = lazy(() => import("@/pages/HistoryPage"));
const HistoryDetailPage = lazy(() => import("@/pages/HistoryDetailPage"));
const HistoryEvolutionPage = lazy(() => import("@/pages/HistoryEvolutionPage"));
const AuditLogs = lazy(() => import("@/pages/AuditLogs"));
const ListagemClientes = lazy(() => import("@/pages/cliente/Listagem"));
const SaudeBaseClientes = lazy(() => import("@/pages/cliente/SaudeBase"));
const PublicHistoryReport = lazy(() => import("@/pages/PublicHistoryReport"));
const Alisamentos = lazy(() => import("@/pages/Alisamentos"));
const KnowledgeBase = lazy(() => import("@/pages/KnowledgeBase"));
const Profissionais = lazy(() => import("@/pages/Profissionais"));
const SalonBranding = lazy(() => import("@/pages/SalonBranding"));

export default function AppRoutes() {
  const { token, isReady } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const splashFallback = (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <img
          src="/Sistema-de-Análise-Capilar.png"
          alt="Sistema de Análise Capilar"
          className="h-24 w-auto drop-shadow-sm"
        />
        <p className="text-lg md:text-xl font-semibold text-slate-600 animate-pulse">
          Carregando página...
        </p>
      </div>
    </div>
  );

  // ⛔ NÃO renderiza rotas até o auth estar pronto
  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <p className="text-sm font-medium text-slate-600">Carregando autenticação...</p>
      </div>
    );
  }

  if (showSplash) {
    return splashFallback;
  }

  return (
    <Suspense
      fallback={
        splashFallback
      }
    >
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
          <Route path="/analise-tricologica/relatorio" element={<AnaliseTricologicaRelatorio />} />
          <Route path="/analise-capilar" element={<AnaliseCapilar />} />
          <Route path="/clientes" element={<ListagemClientes />} />
          <Route path="/clientes/saude" element={<SaudeBaseClientes />} />
          <Route path="/historico" element={<HistoryPage />} />
          <Route path="/historico/:id" element={<HistoryDetailPage />} />
          <Route path="/historico/evolucao" element={<HistoryEvolutionPage />} />
          <Route path="/alisamentos" element={<Alisamentos />} />
          <Route
            path="/admin/conhecimento"
            element={
              <PrivateRoute requiredRole="ADMIN">
                <KnowledgeBase />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/profissionais"
            element={
              <PrivateRoute requiredRole="ADMIN">
                <Profissionais />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/branding"
            element={
              <PrivateRoute requiredRole="ADMIN">
                <SalonBranding />
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
        </Route>

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
    </Suspense>
  );
}
