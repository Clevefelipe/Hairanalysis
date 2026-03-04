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

export async function getMySalonBranding(): Promise<SalonBrandingResponse> {
  const { data } = await api.get("/salon/me/branding");
  return data as SalonBrandingResponse;
}

export async function updateMySalonBranding(
  payload: UpdateSalonBrandingPayload,
): Promise<SalonBrandingResponse> {
  const { data } = await api.patch("/salon/me/branding", payload);
  return data as SalonBrandingResponse;
}

export async function uploadMySalonLogo(
  file: File,
): Promise<SalonBrandingResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/salon/me/branding/logo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data as SalonBrandingResponse;
}

export async function removeMySalonLogo(): Promise<SalonBrandingResponse> {
  const { data } = await api.delete("/salon/me/branding/logo");
  return data as SalonBrandingResponse;
}

export async function getSalonBrandingPresets(): Promise<SalonBrandingPreset[]> {
  const { data } = await api.get("/salon/branding/presets");
  return Array.isArray(data) ? (data as SalonBrandingPreset[]) : [];
}

export async function applyMySalonBrandingPreset(
  presetId: string,
): Promise<SalonBrandingResponse> {
  const { data } = await api.post("/salon/me/branding/preset", { presetId });
  return data as SalonBrandingResponse;
}
