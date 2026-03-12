import { NavLink } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Star, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { getSidebarGroups } from "@/config/navigation";

const FAVORITES_KEY = "ha_sidebar_favorites";
const SIDEBAR_COLLAPSE_KEY = "ha_sidebar_collapsed";
export const SIDEBAR_EXPANDED_WIDTH = 264;
export const SIDEBAR_COLLAPSED_WIDTH = 92;

const SIDEBAR_WIDTH_TRANSITION = {
  duration: 0.12,
  ease: [0.4, 0, 0.2, 1],
} as const;

const MOBILE_DRAWER_TRANSITION = {
  type: "spring",
  stiffness: 360,
  damping: 38,
} as const;

type Item = {
  label: string;
  path: string;
  icon?: LucideIcon;
  badge?: string | number;
};

type SidebarProps = {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  topOffset?: number;
};

export default function Sidebar({
  collapsed: collapsedProp,
  onToggleCollapsed,
  mobileOpen = false,
  onMobileClose,
  topOffset = 0,
}: SidebarProps) {
  const sidebarBackground = "#1A202C";
  const sidebarBorderColor = "rgba(255, 255, 255, 0.08)";
  const sidebarMutedColor = "rgba(226, 232, 240, 0.72)";
  const sidebarAccentColor = "var(--color-success-500, #22c55e)";
  const sidebarCategoryColor = "rgba(255, 255, 255, 0.45)";
  const sidebarDividerColor = "rgba(255, 255, 255, 0.1)";
  const activeItemBackground = "rgba(255, 255, 255, 0.09)";
  const hoverItemBackground = "rgba(255, 255, 255, 0.04)";
  const { role } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });
  const [compactMode, setCompactMode] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const collapsed = typeof collapsedProp === "boolean" ? collapsedProp : internalCollapsed;

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (typeof collapsedProp === "boolean") return;
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, JSON.stringify(internalCollapsed));
  }, [collapsedProp, internalCollapsed]);

  useEffect(() => {
    if (typeof collapsedProp === "boolean") return;

    const media = window.matchMedia("(max-width: 1366px)");
    const hasManualPreference = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
    const handle = (event: MediaQueryListEvent | MediaQueryList) => {
      setInternalCollapsed(event.matches);
    };

    if (!hasManualPreference) {
      handle(media);
    }

    media.addEventListener("change", handle as (e: MediaQueryListEvent) => void);
    return () => media.removeEventListener("change", handle as (e: MediaQueryListEvent) => void);
  }, [collapsedProp]);

  useEffect(() => {
    const handleResize = () => {
      setCompactMode(window.innerHeight < 900);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const groups = useMemo(() => {
    return getSidebarGroups(role as "ADMIN" | "PROFESSIONAL" | null | undefined) || [];
  }, [role]);

  const favoriteItems = useMemo(() => {
    return groups
      .flatMap((group) => group.items)
      .filter((item) => favorites.includes(item.path));
  }, [groups, favorites]);

  const toggleFavorite = (path: string) => {
    setFavorites((prev) =>
      prev.includes(path) ? prev.filter((fav) => fav !== path) : [...prev, path],
    );
  };

  const toggleCollapsed = () => {
    if (onToggleCollapsed) {
      onToggleCollapsed();
      return;
    }
    setInternalCollapsed((prev) => !prev);
  };

  const renderItem = (item: Item, isMobile = false) => {
    const shouldCollapse = collapsed && !isMobile;
    const isFavorite = favorites.includes(item.path);
    const paddingClasses = compactMode ? "px-3 py-1.5" : "px-3 py-2";
    const iconBoxClasses = compactMode ? "h-8 w-8" : "h-9 w-9";
    const labelClasses = compactMode ? "text-[12px]" : "text-[13px]";
    const badgeClasses = compactMode ? "text-[9px] tracking-[0.2em]" : "text-[10px] tracking-[0.26em]";

    return (
      <NavLink
        key={item.path}
        to={item.path}
        title={shouldCollapse ? item.label : undefined}
        className={({ isActive }) =>
          [
            "group relative flex min-h-10 items-center overflow-hidden rounded-lg border text-sm transition-all duration-200",
            paddingClasses,
            shouldCollapse ? "justify-center" : "gap-2.5",
            isActive ? "text-white" : "text-white hover:text-white",
          ].join(" ")
        }
        style={({ isActive }) => ({
          borderColor: "transparent",
          backgroundColor: isActive ? activeItemBackground : hoverItemBackground,
          color: "white",
          boxShadow: isActive ? "0 18px 32px -24px rgba(0,0,0,0.65)" : "none",
        })}
      >
        {({ isActive }) => (
          <>
            <motion.span
              className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-sm"
              style={{ backgroundColor: sidebarAccentColor }}
              initial={false}
              animate={{
                opacity: isActive ? 1 : 0,
                scaleY: isActive ? 1 : 0.65,
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              aria-hidden="true"
            />

            {item.icon && (
              <span
                className={`inline-flex ${iconBoxClasses} items-center justify-center rounded-lg border transition`}
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  backgroundColor: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                  color: isActive ? sidebarAccentColor : "rgba(226,232,240,0.9)",
                }}
              >
                <item.icon size={18} strokeWidth={1.5} />
              </span>
            )}

            <AnimatePresence initial={false}>
              {!shouldCollapse && (
                <motion.div
                  key={`${item.path}-expanded`}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className={`${labelClasses} truncate font-semibold tracking-tight text-white/90`}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className={`${badgeClasses} uppercase`} style={{ color: "white" }}>
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(item.path);
                    }}
                    className={`inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg border p-1 text-[11px] transition ${
                      isFavorite ? "text-[var(--color-primary)]" : "text-white"
                    }`}
                    style={{
                      color: isFavorite ? sidebarAccentColor : "white",
                      borderColor: isFavorite ? sidebarBorderColor : "transparent",
                      backgroundColor: isFavorite ? "rgba(248, 250, 252, 0.08)" : "transparent",
                    }}
                    aria-label="Favoritar atalho"
                  >
                    <Star size={12} strokeWidth={1.75} fill={isFavorite ? "currentColor" : "none"} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {shouldCollapse && (
                <motion.span
                  key={`${item.path}-tooltip`}
                  className="pointer-events-none absolute left-full z-20 ml-3 whitespace-nowrap rounded-md border px-2 py-1.5 text-xs opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  style={{ borderColor: sidebarBorderColor, backgroundColor: "rgba(248, 250, 252, 0.06)", color: "white", boxShadow: "var(--shadow-card)" }}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </>
        )}
      </NavLink>
    );
  };

  const stackSpacing = compactMode ? "space-y-2.5" : "space-y-4";
  const listScroll = compactMode ? "flex-1 space-y-2.5 overflow-y-auto pr-1 scrollbar-none" : "overflow-y-auto pr-0.5 scrollbar-none";

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => {
    const shouldCollapse = collapsed && !mobile;

    return (
      <div className="relative flex h-full flex-col gap-3 px-3 py-3 overflow-hidden">
        <span aria-hidden="true" className="noise-layer pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative flex min-h-10 items-center rounded-lg border px-2 py-1.5" style={{ borderColor: sidebarBorderColor, backgroundColor: "rgba(15, 23, 42, 0.35)" }}>
          <div
            className={`flex min-w-0 flex-1 items-center overflow-hidden pr-14 transition-all duration-200 ${
              shouldCollapse ? "justify-center gap-0" : "justify-start gap-2"
            }`}
          >
            <span
              className={`inline-block shrink-0 overflow-hidden whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-all duration-200 ${
                shouldCollapse ? "w-0 max-w-0 opacity-0 pointer-events-none" : "w-[11rem] max-w-[11rem] opacity-80 pointer-events-auto"
              }`}
              style={{ color: sidebarCategoryColor }}
            >
              NAVEGAÇÃO
            </span>
          </div>

          {mobile ? (
            <button
              onClick={onMobileClose}
              className="absolute right-2 top-1/2 inline-flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-lg border transition"
              style={{ borderColor: sidebarBorderColor, backgroundColor: "rgba(248, 250, 252, 0.06)", color: "white" }}
              aria-label="Fechar menu lateral"
            >
              <X size={17} />
            </button>
          ) : (
            <button
              onClick={toggleCollapsed}
              className={`absolute top-1/2 inline-flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-lg border transition ${
                shouldCollapse ? "left-1/2 -translate-x-1/2" : "right-2"
              }`}
              style={{ borderColor: sidebarBorderColor, backgroundColor: "rgba(248, 250, 252, 0.06)", color: "white" }}
              aria-label="Alternar tamanho do menu"
            >
              {shouldCollapse ? (
                <PanelLeftOpen size={17} strokeWidth={1.75} />
              ) : (
                <PanelLeftClose size={17} strokeWidth={1.75} />
              )}
            </button>
          )}
        </div>

        <div className={`flex-1 ${stackSpacing} ${listScroll}`}>
          <AnimatePresence initial={false}>
            {!shouldCollapse && favoriteItems.length > 0 && (
              <motion.div
                key="favorite-items"
                className="space-y-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em]" style={{ color: sidebarCategoryColor }}>
                  <span>Atalhos fixados</span>
                  <span className="text-[9px]" style={{ color: sidebarMutedColor }}>
                    {favoriteItems.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {favoriteItems.map((item) => renderItem(item, mobile))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {groups.map((group, index) => (
              <div key={group.title} className="space-y-2">
                {!shouldCollapse && (
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.28em]" style={{ color: sidebarCategoryColor }}>
                    <span className="opacity-70">{group.title}</span>
                    <span className="ml-3 h-px flex-1 rounded-full" style={{ backgroundColor: sidebarDividerColor }} />
                  </div>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => renderItem(item, mobile))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const desktopSidebarStyle =
    topOffset > 0 ? ({ top: `${topOffset}px`, height: `calc(100vh - ${topOffset}px)` } as const) : undefined;
  const mobileOverlayStyle = topOffset > 0 ? ({ top: `${topOffset}px` } as const) : undefined;

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH }}
        transition={{ width: SIDEBAR_WIDTH_TRANSITION }}
        className={`fixed left-0 z-40 hidden overflow-hidden border-r transition-all duration-200 lg:flex ${
          topOffset > 0 ? "" : "inset-y-0"
        }`}
        style={{
          ...desktopSidebarStyle,
          borderColor: sidebarBorderColor,
          backgroundColor: sidebarBackground,
          color: "#f8fafc",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
          style={{ backgroundColor: "var(--color-primary)", opacity: 0.7 }}
        />
        <span aria-hidden="true" className="noise-layer pointer-events-none absolute inset-0 opacity-[0.16]" />
        <SidebarContent />
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            style={mobileOverlayStyle}
            className={`fixed inset-x-0 bottom-0 z-[65] lg:hidden ${topOffset > 0 ? "" : "top-0"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <motion.button
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(15, 23, 42, 0.34)" }}
              onClick={onMobileClose}
              aria-label="Fechar menu lateral"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 w-[min(88vw,320px)] border-r overflow-hidden"
              style={{ borderColor: sidebarBorderColor, backgroundColor: sidebarBackground, color: "#f8fafc" }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={MOBILE_DRAWER_TRANSITION}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                style={{ backgroundColor: "var(--color-primary)", opacity: 0.7 }}
              />
              <span aria-hidden="true" className="noise-layer pointer-events-none absolute inset-0 opacity-[0.18]" />
              <SidebarContent mobile />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


