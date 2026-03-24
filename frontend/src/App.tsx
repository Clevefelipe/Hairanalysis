import AppRoutes from "./routes/AppRoutes";
import { ToastProvider } from "./components/ui/ToastProvider";
import { ClientSessionProvider } from "./context/ClientSessionContext";
import { SalonBrandingThemeProvider } from "./context/SalonBrandingThemeContext";
import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SalonBrandingThemeProvider>
          <ClientSessionProvider>
            <AppRoutes />
          </ClientSessionProvider>
        </SalonBrandingThemeProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
