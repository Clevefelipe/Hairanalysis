import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ClientSessionProvider } from "./context/ClientSessionContext";
import { SalonBrandingThemeProvider } from "./context/SalonBrandingThemeContext";
import { ToastProvider } from "./components/ui/ToastProvider";
import { ServiceProvider } from "./core/services/ServiceContext";
import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SalonBrandingThemeProvider>
          <ToastProvider>
            <ClientSessionProvider>
              <ServiceProvider>
                <App />
              </ServiceProvider>
            </ClientSessionProvider>
          </ToastProvider>
        </SalonBrandingThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
