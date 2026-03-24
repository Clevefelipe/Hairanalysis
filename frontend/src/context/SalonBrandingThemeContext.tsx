import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getMySalonBranding,
  type SalonBrandingConfig,
  type SupportedFontFamily,
} from "@/services/salonBranding.service";

type BrandingThemeState = {
  salonName: string;
  branding: SalonBrandingConfig;
  loading: boolean;
  refreshBranding: () => Promise<void>;
};

const DEFAULT_BRANDING: SalonBrandingConfig = {
  logoUrl: null,
  primaryColor: "#0F172A",
  secondaryColor: "#E2E8F0",
  accentColor: "#0EA5A4",
  fontFamily: "helvetica",
};

const DEFAULT_SALON_NAME = "Hair Analysis";

const STORAGE_KEY_PREFIX = "ha_branding_theme";

const SalonBrandingThemeContext = createContext<BrandingThemeState | null>(null);

function sanitizeHex(value: string | null | undefined, fallback: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(String(value || "")) ? String(value).toUpperCase() : fallback;
}

function fontFamilyFromBranding(fontFamily: SupportedFontFamily) {
  if (fontFamily === "times") return 'Georgia, "Times New Roman", Times, serif';
  if (fontFamily === "courier") return '"JetBrains Mono", "Courier New", Courier, monospace';
  if (fontFamily === "manrope") return '"Manrope", "Helvetica Neue", Helvetica, Arial, sans-serif';
  if (fontFamily === "sora") return '"Sora", "Helvetica Neue", Helvetica, Arial, sans-serif';
  if (fontFamily === "inter") return '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif';
  if (fontFamily === "playfair") return '"Playfair Display", "Times New Roman", serif';
  return '"Manrope", "Helvetica Neue", Helvetica, Arial, sans-serif';
}

function hexToRgbChannels(hex: string) {
  const clean = hex.replace("#", "");
  const normalized = clean.length === 3 ? clean.split("").map((c) => `${c}${c}`).join("") : clean;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) {
    return { r: 15, g: 23, b: 42 };
  }
  return { r, g, b };
}

function applyBrandingTokens(branding: SalonBrandingConfig) {
  const root = document.documentElement;
  const primaryColor = sanitizeHex(branding.primaryColor, DEFAULT_BRANDING.primaryColor);
  const secondaryColor = sanitizeHex(branding.secondaryColor, DEFAULT_BRANDING.secondaryColor);
  const accentColor = sanitizeHex(branding.accentColor, DEFAULT_BRANDING.accentColor);
  const primaryRgb = hexToRgbChannels(primaryColor);

  root.style.setProperty("--brand-primary", primaryColor);
  root.style.setProperty("--brand-secondary", secondaryColor);
  root.style.setProperty("--brand-primary-rgb", `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`);
  root.style.setProperty("--brand-font-family", fontFamilyFromBranding(branding.fontFamily));

  root.style.setProperty("--color-primary", primaryColor);
  root.style.setProperty("--color-primary-light", accentColor);
  root.style.setProperty("--color-surface", "#FFFFFF");
  root.style.setProperty("--color-border", secondaryColor);
}

export function SalonBrandingThemeProvider({ children }: { children: React.ReactNode }) {
  const { token, isReady, user } = useAuth();
  const [salonName, setSalonName] = useState(DEFAULT_SALON_NAME);
  const [branding, setBranding] = useState<SalonBrandingConfig>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(false);

  const persistInCache = useCallback((cacheKey: string, payload: { salonName: string; branding: SalonBrandingConfig }) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(payload));
    } catch {
      // ignore cache errors
    }
  }, []);

  const loadBranding = useCallback(async () => {
    if (!user?.salonId || !token) {
      setSalonName(DEFAULT_SALON_NAME);
      setBranding(DEFAULT_BRANDING);
      applyBrandingTokens(DEFAULT_BRANDING);
      return;
    }

    const cacheKey = `${STORAGE_KEY_PREFIX}:${user.salonId}`;
    setLoading(true);

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { salonName?: string; branding?: SalonBrandingConfig };
        if (parsed?.branding) {
          const merged = {
            ...DEFAULT_BRANDING,
            ...parsed.branding,
          } as SalonBrandingConfig;
          setBranding(merged);
          setSalonName(parsed.salonName || DEFAULT_SALON_NAME);
          applyBrandingTokens(merged);
        }
      }
    } catch {
      // ignore cache parsing errors
    }

    try {
      const response = await getMySalonBranding();
      const merged = {
        ...DEFAULT_BRANDING,
        ...response.branding,
      } as SalonBrandingConfig;
      setBranding(merged);
      setSalonName(response.salonName || DEFAULT_SALON_NAME);
      applyBrandingTokens(merged);
      persistInCache(cacheKey, {
        salonName: response.salonName || DEFAULT_SALON_NAME,
        branding: merged,
      });
    } catch {
      // keep cached/default theme
    } finally {
      setLoading(false);
    }
  }, [persistInCache, token, user?.salonId]);

  useEffect(() => {
    if (!isReady) return;
    loadBranding();
  }, [isReady, loadBranding]);

  const value = useMemo(
    () => ({
      salonName,
      branding,
      loading,
      refreshBranding: loadBranding,
    }),
    [branding, loadBranding, loading, salonName],
  );

  return <SalonBrandingThemeContext.Provider value={value}>{children}</SalonBrandingThemeContext.Provider>;
}

export function useSalonBrandingTheme() {
  const ctx = useContext(SalonBrandingThemeContext);
  if (!ctx) {
    return {
      salonName: DEFAULT_SALON_NAME,
      branding: DEFAULT_BRANDING,
      loading: false,
      refreshBranding: async () => {
        // no-op fallback for recovery mode
      },
    };
  }
  return ctx;
}
