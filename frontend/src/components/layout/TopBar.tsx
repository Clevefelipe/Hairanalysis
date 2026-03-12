import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronRight, LogOut, Menu, MessageCircle, Search, Send } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useSalonBrandingTheme } from "@/context/SalonBrandingThemeContext";
import { DashboardNotification, getHistoryNotifications, markHistoryNotificationsAsRead } from "@/services/history.service";
import { formatDateShortBr } from "@/utils/date";
import ClientLookupModal from "@/components/clientes/ClientLookupModal";
import { listarClientes } from "@/core/cliente/cliente.service";
import { askAiAssistant } from "@/services/aiAssistant.service";

type TopBarProps = {
  onOpenSidebar?: () => void;
  fullWidth?: boolean;
};

const ALERTS_DROPDOWN_ID = "topbar-alerts-menu";
const PROFILE_DROPDOWN_ID = "topbar-profile-menu";

function formatRole(role: string | null | undefined) {
  if (role === "ADMIN") return "Administrador";
  if (role === "PROFESSIONAL") return "Profissional";
  return "Usuario";
}

function normalizeSegment(segment: string) {
  if (!segment) return "Dashboard";
  if (/^[0-9a-f-]{8,}$/i.test(segment)) return "Detalhe";
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function TopBar({ onOpenSidebar, fullWidth = false }: TopBarProps) {
  const { logout, role, user } = useAuth();
  const { branding } = useSalonBrandingTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [clients, setClients] = useState<{ id: string; nome: string; telefone?: string; cpf?: string }[]>([]);
  const [showAssistant, setShowAssistant] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ from: "user" | "assistant"; text: string }[]>([
    {
      from: "assistant",
      text: "Olá! Sou o assistente da Hair Analysis. Como posso ajudar hoje?",
    },
  ]);

  const displayName = user?.fullName || user?.name || formatRole(role);
  const brandLogoSrc = (branding.logoUrl || "").trim() || "/icone.png";

  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const items = [{ label: "Painel", path: "/dashboard" }];

    let current = "";
    segments.forEach((segment) => {
      current += `/${segment}`;
      items.push({
        label: normalizeSegment(segment),
        path: current,
      });
    });

    return items.filter((item, index, array) => {
      if (index === 0) return true;
      return array.findIndex((entry) => entry.path === item.path) === index;
    });
  }, [location.pathname]);

  useEffect(() => {
    let active = true;

    const fetchNotifications = async () => {
      try {
        const data = await getHistoryNotifications(20);
        if (!active) return;
        const visibleNotifications = Array.isArray(data.notifications) ? data.notifications : [];
        setNotifications(visibleNotifications);
        setNotificationsCount(visibleNotifications.length);
      } catch {
        if (active) {
          setNotifications([]);
          setNotificationsCount(0);
        }
      }
    };

    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 60_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user?.email, user?.id, user?.name]);

  const markNotificationAsRead = async (notificationId: string) => {
    setNotifications((prev) => {
      const next = prev.filter((item) => item.id !== notificationId);
      setNotificationsCount(next.length);
      return next;
    });
    await markHistoryNotificationsAsRead([notificationId]);
  };

  const markAllVisibleNotificationsAsRead = async () => {
    if (!notifications.length) return;
    const ids = notifications.map((item) => item.id).filter(Boolean);
    setNotifications([]);
    setNotificationsCount(0);
    await markHistoryNotificationsAsRead(ids);
  };

  useEffect(() => {
    setShowProfileMenu(false);
    setShowAlerts(false);
    setShowSearch(false);
    setShowAssistant(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showSearch || clients.length > 0 || searchLoading) return;
    setSearchLoading(true);
    listarClientes()
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]))
      .finally(() => setSearchLoading(false));
  }, [clients.length, showSearch, searchLoading]);

  const filteredClients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return clients.slice(0, 6);
    return clients
      .filter((c) => {
        const nome = String(c.nome || "").toLowerCase();
        const telefone = String(c.telefone || "").toLowerCase();
        const cpf = String(c.cpf || "").toLowerCase();
        return nome.includes(term) || telefone.includes(term) || cpf.includes(term);
      })
      .slice(0, 6);
  }, [clients, searchTerm]);

  const sendChatMessage = async () => {
    const question = chatInput.trim();
    if (!question || chatLoading) return;

    setChatMessages((prev) => [...prev, { from: "user", text: question }]);
    setChatInput("");
    setChatError(null);
    setChatLoading(true);

    try {
      const response = await askAiAssistant({ question });
      setChatMessages((prev) => [...prev, { from: "assistant", text: response.answer }]);
    } catch (error) {
      console.error(error);
      setChatError("Não foi possível obter resposta agora. Tente novamente em instantes.");
    } finally {
      setChatLoading(false);
    }
  };

  const headerClasses = fullWidth
    ? "sticky top-0 z-[60] h-[64px] border-b px-4 sm:px-5 lg:px-6"
    : "sticky top-0 z-[55] border-b px-3 py-1 sm:px-4 lg:px-6";

  const dropdownTopClass = fullWidth ? "top-[76px]" : "top-[76px]";

  return (
    <>
      <header
        className={`relative overflow-hidden backdrop-blur-xl ${headerClasses}`}
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "color-mix(in srgb, var(--color-surface) 88%, rgba(255,255,255,0.12))",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
          style={{ backgroundColor: "var(--color-primary)", opacity: 0.7 }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px]"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in srgb, var(--color-primary) 78%, transparent) 0%, color-mix(in srgb, var(--color-success-400, #34d399) 55%, transparent) 45%, transparent 100%)",
            boxShadow: "0 -1px 8px color-mix(in srgb, var(--color-primary) 28%, transparent)",
            opacity: 0.9,
          }}
        />
        <span aria-hidden="true" className="noise-layer pointer-events-none absolute inset-0 opacity-[0.22]" />
        <div className={`flex items-center justify-between gap-3 ${fullWidth ? "h-full" : ""}`}>
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:ring-offset-2 lg:hidden"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              aria-label="Abrir menu lateral"
            >
              <Menu size={18} />
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="relative inline-flex min-h-20 items-center gap-3 overflow-hidden rounded-lg px-2 py-1 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:ring-offset-2"
              style={{ backgroundColor: "transparent", color: "var(--color-text)" }}
              aria-label="Ir para o painel"
            >
              <span
                className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-md"
              >
                <img
                  src="/Logo - 2.png"
                  alt="Hair Analysis System"
                  className="h-12 w-12 object-contain"
                  onError={(event) => {
                    const target = event.currentTarget;
                    if (!target.src.endsWith("/Logo - 2.png")) {
                      target.src = "/Logo - 2.png";
                    }
                  }}
                />
              </span>
              <span className="hidden sm:inline leading-tight text-left self-center">
                <span
                  className="block text-lg font-semibold uppercase tracking-[0.22em]"
                  style={{ color: "var(--color-text)", letterSpacing: "0.2em" }}
                >
                  Hair Analysis
                </span>
                <span
                  className="block text-xs font-semibold uppercase tracking-[0.26em] opacity-80"
                  style={{ color: "var(--color-success-500, #22c55e)" }}
                >
                  System
                </span>
              </span>
            </button>

            <span className="hidden h-6 w-px md:inline-flex max-[380px]:hidden ml-4" aria-hidden="true" style={{ backgroundColor: "var(--color-border)" }} />

            <nav className="scrollbar-none flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap max-[380px]:hidden">
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <div key={`${crumb.path}-${index}`} className="flex items-center gap-1">
                    {index > 0 && <ChevronRight size={13} style={{ color: "var(--color-text-muted)" }} />}
                    {isLast ? (
                      <span
                        className="inline-flex min-h-8 items-center rounded-md border px-2 text-[14px] font-semibold md:text-[15px]"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "transparent", color: "var(--color-text)" }}
                      >
                        {crumb.label}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex min-h-8 items-center rounded-md border px-2 text-[14px] transition md:text-[15px]"
                        style={{
                          color: "var(--color-text-muted)",
                          borderColor: "var(--color-border)",
                          backgroundColor: "transparent",
                        }}
                        onClick={() => navigate(crumb.path)}
                      >
                        {crumb.label}
                      </button>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setShowAlerts(false);
                setShowProfileMenu(false);
                setShowSearch(false);
                setLookupOpen(false);
                setShowAssistant((prev) => !prev);
              }}
              className="relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:ring-offset-2"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              aria-label="Abrir chat com assistente IA"
              aria-expanded={showAssistant}
            >
              <MessageCircle size={18} />
              <span
                className="absolute -right-1 -top-1 inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 py-[2px] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-on-strong,white)] shadow-sm"
                aria-hidden="true"
              >
                IA
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAlerts(false);
                setShowProfileMenu(false);
                setShowSearch((prev) => !prev);
                setLookupOpen(false);
              }}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:ring-offset-2 max-[380px]:hidden"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              aria-label="Buscar clientes"
            >
              <Search size={18} />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowProfileMenu(false);
                setShowAlerts((prev) => !prev);
              }}
              className="relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:ring-offset-2"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              aria-label="Alertas"
              aria-haspopup="menu"
              aria-expanded={showAlerts}
              aria-controls={showAlerts ? ALERTS_DROPDOWN_ID : undefined}
            >
              <Bell size={18} />
              {notificationsCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 animate-[pulse_2.2s_ease-in-out_infinite] items-center justify-center rounded-full border border-rose-400/40 bg-rose-500 px-1 text-[9px] font-bold leading-none text-white">
                  {notificationsCount > 9 ? "9+" : notificationsCount}
                </span>
              )}
            </button>
            <span className="hidden h-6 w-px sm:inline-flex" style={{ backgroundColor: "var(--color-border)" }} aria-hidden="true" />
            <button
              type="button"
              onClick={() => {
                setShowAlerts(false);
                setShowProfileMenu((prev) => !prev);
              }}
              className="inline-flex min-h-10 items-center gap-2.5 rounded-lg border px-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:ring-offset-2"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              aria-label="Perfil do usuario"
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
              aria-controls={showProfileMenu ? PROFILE_DROPDOWN_ID : undefined}
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
                <img
                  src={brandLogoSrc}
                  alt="Hair Analysis System"
                  className="h-7 w-7 object-contain"
                  onError={(event) => {
                    const target = event.currentTarget;
                    if (!target.src.endsWith("/Logo.png")) {
                      target.src = "/Logo.png";
                    }
                  }}
                />
              </span>
              <span className="hidden max-w-[140px] truncate text-sm font-medium leading-tight md:inline">{displayName}</span>
            </button>
          </div>
        </div>
      </header>

      <ClientLookupModal
        isOpen={lookupOpen}
        onClose={() => setLookupOpen(false)}
        onSelect={(cliente) => {
          setLookupOpen(false);
          if (cliente?.id) {
            navigate(`/clientes?clientId=${cliente.id}`);
          }
        }}
      />

      <AnimatePresence>
        {showSearch && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-[65] bg-transparent"
              aria-label="Fechar busca rápida"
              onClick={() => setShowSearch(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
            />
            <motion.div
              id="topbar-search-menu"
              role="dialog"
              className={`fixed right-3 z-[70] w-[min(92vw,320px)] rounded-xl border p-3 sm:right-4 lg:right-6 ${dropdownTopClass}`}
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>
                  Busca rápida
                </p>
                <button
                  type="button"
                  className="text-[11px] font-semibold underline decoration-dotted underline-offset-2"
                  style={{ color: "var(--color-text-muted)" }}
                  onClick={() => setLookupOpen(true)}
                >
                  Avançada
                </button>
              </div>

              <div className="mt-2 flex items-center gap-2 rounded-lg border px-2 py-1.5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <Search size={16} className="text-[var(--color-text-muted)]" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nome, telefone ou CPF"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)]"
                  style={{ color: "var(--color-text)" }}
                  autoFocus
                />
              </div>

              <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto pr-0.5">
                {searchLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <div key={`skeleton-${idx}`} className="h-10 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-border)" }} />
                  ))
                ) : filteredClients.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    Nenhum cliente encontrado.
                  </p>
                ) : (
                  filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition hover:bg-[var(--bg-primary)]"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                      onClick={() => {
                        setShowSearch(false);
                        navigate(`/clientes?clientId=${c.id}`);
                      }}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{c.nome}</p>
                        <p className="truncate text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {c.telefone || c.cpf || "Sem contato"}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-[var(--color-text-muted)]" aria-hidden="true" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAssistant && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-[65] bg-transparent"
              aria-label="Fechar chat do assistente"
              onClick={() => setShowAssistant(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
            />

            <motion.div
              id="topbar-assistant"
              role="dialog"
              aria-label="Chat com assistente IA"
              className={`fixed right-3 z-[70] w-[min(92vw,360px)] rounded-xl border p-3 sm:right-4 lg:right-6 ${dropdownTopClass}`}
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>
                    Assistente IA
                  </p>
                  <p className="text-sm" style={{ color: "var(--color-text)" }}>
                    Tire dúvidas rápidas sobre o sistema.
                  </p>
                </div>
              </div>

              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1" style={{ backgroundColor: "var(--bg-primary)" }}>
                {chatMessages.map((msg, idx) => (
                  <div
                    key={`msg-${idx}`}
                    className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`rounded-lg border px-3 py-2 text-sm shadow-sm ${msg.from === "user" ? "rounded-br-none" : "rounded-bl-none"}`}
                      style={{
                        borderColor: "var(--color-border)",
                        backgroundColor: msg.from === "user" ? "var(--accent-soft)" : "var(--bg-primary)",
                        color: "var(--color-text)",
                        maxWidth: "90%",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {chatError && (
                <p className="mt-2 text-[12px] font-semibold" style={{ color: "var(--color-danger, #b91c1c)" }}>
                  {chatError}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2 rounded-lg border px-2 py-1.5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)" }}>
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Pergunte algo..."
                  className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)]"
                  style={{ color: "var(--color-text)" }}
                  rows={2}
                />
                <button
                  type="button"
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border text-[13px] font-semibold transition disabled:opacity-60"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
                  aria-label="Enviar pergunta"
                >
                  {chatLoading ? "..." : <Send size={16} />}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAlerts && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-[65] bg-transparent"
              aria-label="Fechar alertas"
              onClick={() => setShowAlerts(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
            />
            <motion.div
              id={ALERTS_DROPDOWN_ID}
              role="menu"
              className={`fixed right-3 z-[70] w-[min(92vw,280px)] rounded-xl border p-2.5 sm:right-4 lg:right-6 ${dropdownTopClass}`}
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--color-text-muted)" }}>Alertas</p>
                  <p className="text-[11px] font-semibold" style={{ color: "var(--color-text)" }}>
                    {notificationsCount > 0 ? `${notificationsCount} pendente(s)` : "Atualizado"}
                  </p>
                </div>
                {notificationsCount > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-[11px] font-semibold underline decoration-dotted underline-offset-2"
                      style={{ color: "var(--color-text-muted)" }}
                      onClick={markAllVisibleNotificationsAsRead}
                    >
                      Marcar todas como lidas
                    </button>
                  </div>
                )}
              </div>
              {notificationsCount > 0 ? (
                <ul className="mt-2.5 max-h-56 space-y-1.5 overflow-auto pr-0.5">
                  {notifications.slice(0, 8).map((notification) => (
                    <li
                      key={notification.id}
                      className="rounded-md border p-2"
                      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--accent-soft)" }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold leading-snug" style={{ color: "var(--color-text)" }}>
                          {notification.title}
                        </p>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--color-text-muted)" }}>
                          {formatDateShortBr(notification.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                        {notification.clientName ? `Cliente: ${notification.clientName}` : "Ação pendente registrada no histórico."}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[10px] font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                          ID {notification.id}
                        </span>
                        <button
                          type="button"
                          className="text-[11px] font-semibold"
                          style={{ color: "var(--color-primary)" }}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          Marcar como lida
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-3 rounded-lg border px-3 py-3 text-sm" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--bg-primary)", color: "var(--color-text-muted)" }}>
                  Nenhuma notificação pendente. Assim que houver atualizações, elas aparecerão aqui.
                </div>
              )}
              <button
                type="button"
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-md border text-sm font-semibold transition"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                onClick={() => navigate("/historico")}
              >
                Abrir historico
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfileMenu && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-[65] bg-transparent"
              aria-label="Fechar perfil"
              onClick={() => setShowProfileMenu(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
            />

            <motion.div
              id={PROFILE_DROPDOWN_ID}
              role="menu"
              className={`fixed right-3 z-[70] w-[min(92vw,280px)] rounded-xl border p-2.5 sm:right-4 lg:right-6 ${dropdownTopClass}`}
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", boxShadow: "var(--shadow-card)" }}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              <div className="border-b pb-2.5" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{displayName}</p>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--color-text-muted)" }}>{formatRole(role)}</p>
              </div>
              <div className="mt-2.5 space-y-2">
                <button
                  type="button"
                  role="menuitem"
                  className="inline-flex min-h-10 w-full items-center gap-2 rounded-md border px-3 text-sm transition"
                  style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2", color: "#b91c1c" }}
                  onClick={logout}
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
