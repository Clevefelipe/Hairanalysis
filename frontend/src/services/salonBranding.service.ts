import api from "./api";

export type SupportedFontFamily =
  | "helvetica"
  | "times"
  | "courier"
  | "manrope"
  | "sora"
  | "inter"
  | "playfair";

export type SalonBrandingConfig = {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: SupportedFontFamily;
};

export type SalonBrandingResponse = {
  salonId: string;
  salonName: string;
  branding: SalonBrandingConfig;
  currentPresetId?: string;
  supportedFonts: SupportedFontFamily[];
};

export type UpdateSalonBrandingPayload = Partial<{
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
}>;

export type SalonBrandingPreset = {
  id: string;
  segment: "clinica_estetica" | "salao_beleza";
  label: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: SupportedFontFamily;
};

async function withRouteFallback<T>(
  primaryPath: string,
  fallbackPath: string,
  request: (path: string) => Promise<T>,
): Promise<T> {
  try {
    return await request(primaryPath);
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return request(fallbackPath);
    }
    throw error;
  }
}

export async function getMySalonBranding(): Promise<SalonBrandingResponse> {
  return withRouteFallback(
    "/salon/me/branding",
    "/salons/me/branding",
    async (path) => {
      const { data } = await api.get(path);
      return data as SalonBrandingResponse;
    },
  );
}

export async function updateMySalonBranding(
  payload: UpdateSalonBrandingPayload,
): Promise<SalonBrandingResponse> {
  return withRouteFallback(
    "/salon/me/branding",
    "/salons/me/branding",
    async (path) => {
      const { data } = await api.patch(path, payload);
      return data as SalonBrandingResponse;
    },
  );
}

export async function uploadMySalonLogo(
  file: File,
): Promise<SalonBrandingResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return withRouteFallback(
    "/salon/me/branding/logo",
    "/salons/me/branding/logo",
    async (path) => {
      const { data } = await api.post(path, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data as SalonBrandingResponse;
    },
  );
}

export async function removeMySalonLogo(): Promise<SalonBrandingResponse> {
  return withRouteFallback(
    "/salon/me/branding/logo",
    "/salons/me/branding/logo",
    async (path) => {
      const { data } = await api.delete(path);
      return data as SalonBrandingResponse;
    },
  );
}

export async function getSalonBrandingPresets(): Promise<SalonBrandingPreset[]> {
  return withRouteFallback(
    "/salon/branding/presets",
    "/salons/branding/presets",
    async (path) => {
      const { data } = await api.get(path);
      return Array.isArray(data) ? (data as SalonBrandingPreset[]) : [];
    },
  );
}

export async function applyMySalonBrandingPreset(
  presetId: string,
): Promise<SalonBrandingResponse> {
  return withRouteFallback(
    "/salon/me/branding/preset",
    "/salons/me/branding/preset",
    async (path) => {
      const { data } = await api.post(path, { presetId });
      return data as SalonBrandingResponse;
    },
  );
}
