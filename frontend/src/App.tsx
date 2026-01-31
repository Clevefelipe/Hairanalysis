import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/layout/Layout";
import PrivateRoute from "./routes/PrivateRoute";
import AuditLogs from "./pages/AuditLogs";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Área protegida */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />

          {/* ADMIN */}
          <Route
            path="administracao/audit"
            element={
              <PrivateRoute requiredRole="ADMIN">
                <AuditLogs />
              </PrivateRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </AuthProvider>
  );
}
