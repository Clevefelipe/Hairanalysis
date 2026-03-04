import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Palette, Save, Trash2, Type } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSalonBrandingTheme } from "@/context/SalonBrandingThemeContext";
import { useToast } from "@/components/ui/ToastProvider";
import Section from "@/components/ui/Section";
import {
  applyMySalonBrandingPreset,
  getMySalonBranding,
  getSalonBrandingPresets,
  removeMySalonLogo,
  SalonBrandingConfig,
  SalonBrandingPreset,
  SalonBrandingResponse,
  updateMySalonBranding,
  uploadMySalonLogo,
} from "@/services/salonBranding.service";

const DEFAULT_BRANDING: SalonBrandingConfig = {
  logoUrl: null,
  primaryColor: "#0F172A",
  secondaryColor: "#E2E8F0",
  accentColor: "#0EA5A4",
  fontFamily: "helvetica",
};

const FONT_OPTIONS = [
  { value: "helvetica", label: "Helvetica (Sans)" },
  { value: "times", label: "Times (Serif)" },
  { value: "courier", label: "Courier (Mono)" },
  { value: "manrope", label: "Manrope (Sans)" },
  { value: "sora", label: "Sora (Sans)" },
  { value: "inter", label: "Inter (Sans)" },
  { value: "playfair", label: "Playfair (Serif)" },
] as const;

function fontPreviewFamily(fontFamily: string) {
  if (fontFamily === "times") {
    return 'Georgia, "Times New Roman", Times, serif';
  }
  if (fontFamily === "courier") {
    return '"Courier New", Courier, monospace';
  }
  if (fontFamily === "manrope") {
    return '"Manrope", "Helvetica Neue", Helvetica, Arial, sans-serif';
  }
  if (fontFamily === "sora") {
    return '"Sora", "Helvetica Neue", Helvetica, Arial, sans-serif';
  }
  if (fontFamily === "inter") {
    return '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif';
  }
  if (fontFamily === "playfair") {
    return '"Playfair Display", "Times New Roman", serif';
  }
  return '"Helvetica Neue", Helvetica, Arial, sans-serif';
}

function normalizeHexInput(value: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("#")
    ? trimmed.toUpperCase()
    : `#${trimmed.toUpperCase()}`;
}

function safeHex(value: string, fallback: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(String(value || "")) ? value : fallback;
}

function normalizeBranding(data: SalonBrandingResponse): SalonBrandingConfig {
  return {
    logoUrl: data.branding?.logoUrl || null,
    primaryColor: data.branding?.primaryColor || DEFAULT_BRANDING.primaryColor,
    secondaryColor:
      data.branding?.secondaryColor || DEFAULT_BRANDING.secondaryColor,
    accentColor: data.branding?.accentColor || DEFAULT_BRANDING.accentColor,
    fontFamily:
      (data.branding?.fontFamily as SalonBrandingConfig["fontFamily"]) ||
      DEFAULT_BRANDING.fontFamily,
  };
}

export default function SalonBranding() {
  const { role, user } = useAuth();
  const { refreshBranding } = useSalonBrandingTheme();
  const { notify } = useToast();
  const salonId = user?.salonId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [presetLoadingId, setPresetLoadingId] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removeLogoLoading, setRemoveLogoLoading] = useState(false);
  const [salonName, setSalonName] = useState("Sal\u00e3o");
  const [currentPresetId, setCurrentPresetId] = useState("custom");
  const [presets, setPresets] = useState<SalonBrandingPreset[]>([]);
  const [supportedFonts, setSupportedFonts] = useState<string[]>([
    "helvetica",
    "times",
    "courier",
    "manrope",
    "sora",
    "inter",
    "playfair",
  ]);
  const [form, setForm] = useState<SalonBrandingConfig>(DEFAULT_BRANDING);
  const [initialForm, setInitialForm] =
    useState<SalonBrandingConfig>(DEFAULT_BRANDING);

  useEffect(() => {
    if (role !== "ADMIN" || !salonId) {
      setLoading(false);
      return;
    }

    Promise.all([getMySalonBranding(), getSalonBrandingPresets()])
      .then(([brandingResponse, presetList]) => {
        const data = brandingResponse as SalonBrandingResponse;
        setSalonName(data.salonName || "Sal\u00e3o");
        setCurrentPresetId(data.currentPresetId || "custom");
        setPresets(Array.isArray(presetList) ? presetList : []);
        setSupportedFonts(
          Array.isArray(data.supportedFonts) && data.supportedFonts.length
            ? data.supportedFonts
            : ["helvetica", "times", "courier", "manrope", "sora", "inter", "playfair"],
        );
        const next = normalizeBranding(data);
        setForm(next);
        setInitialForm(next);
      })
      .catch(() => {
        notify("Nao foi possivel carregar o branding do salão.", "error");
      })
      .finally(() => setLoading(false));
  }, [notify, role, salonId]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  }, [form, initialForm]);

  const activePresetLabel = useMemo(() => {
    if (currentPresetId === "custom") return "Customizado";
    const activePreset = presets.find((preset) => preset.id === currentPresetId);
    if (activePreset?.label) return activePreset.label;
    return currentPresetId.replace(/_/g, " ");
  }, [currentPresetId, presets]);

  function updateField<K extends keyof SalonBrandingConfig>(
    key: K,
    value: SalonBrandingConfig[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        primaryColor: safeHex(normalizeHexInput(form.primaryColor), DEFAULT_BRANDING.primaryColor),
        secondaryColor: safeHex(normalizeHexInput(form.secondaryColor), DEFAULT_BRANDING.secondaryColor),
        accentColor: safeHex(normalizeHexInput(form.accentColor), DEFAULT_BRANDING.accentColor),
        fontFamily: form.fontFamily,
      };
      const updated = await updateMySalonBranding(payload);
      const normalized = normalizeBranding(updated);
      setForm(normalized);
      setInitialForm(normalized);
      setCurrentPresetId(updated.currentPresetId || "custom");
      await refreshBranding();
      notify("Branding atualizado com sucesso.", "success");
    } catch (error: any) {
      const status = error?.response?.status;
      const axiosMsg = error?.response?.data?.message;
      let message = axiosMsg || error?.message || "Falha ao salvar branding.";
      if (status === 413) {
        message = "Logo muito grande. Envie a logo pelo botão dedicado ou use arquivo menor.";
      }
      notify(String(message), "error");
    } finally {
      setSaving(false);
    }
  }

  function handleResetDefaults() {
    setForm((prev) => ({
      ...DEFAULT_BRANDING,
      logoUrl: prev.logoUrl,
    }));
  }

  async function handleApplyPreset(presetId: string) {
    setPresetLoadingId(presetId);
    try {
      const updated = await applyMySalonBrandingPreset(presetId);
      const normalized = normalizeBranding(updated);
      setForm(normalized);
      setInitialForm(normalized);
      setCurrentPresetId(updated.currentPresetId || "custom");
      await refreshBranding();
      notify("Preset aplicado com sucesso.", "success");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Falha ao aplicar preset.";
      notify(String(message), "error");
    } finally {
      setPresetLoadingId(null);
    }
  }

  async function handleLogoUpload(file: File | null) {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const updated = await uploadMySalonLogo(file);
      const logoUrl = updated.branding?.logoUrl || null;
      setForm((prev) => ({ ...prev, logoUrl }));
      setInitialForm((prev) => ({ ...prev, logoUrl }));
      setCurrentPresetId(updated.currentPresetId || "custom");
      await refreshBranding();
      notify("Logo atualizado com sucesso.", "success");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Falha ao enviar logo.";
      notify(String(message), "error");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleRemoveLogo() {
    setRemoveLogoLoading(true);
    try {
      const updated = await removeMySalonLogo();
      setForm((prev) => ({ ...prev, logoUrl: updated.branding.logoUrl || null }));
      setInitialForm((prev) => ({
        ...prev,
        logoUrl: updated.branding.logoUrl || null,
      }));
      setCurrentPresetId(updated.currentPresetId || "custom");
      await refreshBranding();
      notify("Logo removido com sucesso.", "success");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Falha ao remover logo.";
      notify(String(message), "error");
    } finally {
      setRemoveLogoLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="section-stack animate-page-in w-full">
        <Section className="h-40 animate-pulse bg-slate-100" />
      </section>
    );
  }

  if (role !== "ADMIN") {
    return (
      <section className="section-stack animate-page-in w-full">
        <Section className="border-rose-100 bg-rose-50 text-sm text-rose-700">
          Apenas administradores podem configurar branding por tenant.
        </Section>
      </section>
    );
  }

  if (!salonId) {
    return (
      <section className="section-stack animate-page-in w-full">
        <Section className="border-amber-100 bg-amber-50 text-sm text-amber-800">
          Seu usuário não possui salão vinculado.
        </Section>
      </section>
    );
  }

  return (
    <section className="section-stack animate-page-in w-full">
      <Section>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
          Administracao
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Branding do Salão
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Personalize paleta, tipografia e logo para os PDFs executivos e identidade visual
          por tenant.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-100">
          <Palette size={14} className="text-[color:var(--color-success-600)]" />
          {salonName}
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
          Segmento ativo: {activePresetLabel}
        </div>
      </Section>

      {presets.length > 0 && (
        <Section>
          <h2 className="text-lg font-semibold text-slate-900">Presets por segmento</h2>
          <p className="mt-1 text-sm text-slate-500">
            Aplique um tema pronto em 1 clique para clínica estética ou salão.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {presets.map((preset) => {
              const active = currentPresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  className={`rounded-2xl border p-4 ${
                    active
                      ? "border-[color:var(--color-success-300)] bg-[color:var(--color-success-50)]/60"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{preset.label}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {preset.segment.replace(/_/g, " ")}
                      </p>
                    </div>
                    {active && (
                      <span className="rounded-full bg-[color:var(--color-success-600)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{preset.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full border border-slate-200" style={{ backgroundColor: preset.primaryColor }} />
                    <span className="h-6 w-6 rounded-full border border-slate-200" style={{ backgroundColor: preset.secondaryColor }} />
                    <span className="h-6 w-6 rounded-full border border-slate-200" style={{ backgroundColor: preset.accentColor }} />
                    <span className="ml-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {preset.fontFamily}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    disabled={presetLoadingId === preset.id}
                    className="btn-secondary mt-4"
                  >
                    {presetLoadingId === preset.id ? "Aplicando..." : "Aplicar"}
                  </button>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <Section>
          <h2 className="text-lg font-semibold text-slate-900">Configuracao visual</h2>

          <div className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-600">Cor primaria</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={safeHex(form.primaryColor, DEFAULT_BRANDING.primaryColor)}
                    onChange={(e) => updateField("primaryColor", e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                  />
                  <input
                    className="clientes-input w-full"
                    value={form.primaryColor}
                    onChange={(e) => updateField("primaryColor", normalizeHexInput(e.target.value))}
                    placeholder="#0F172A"
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-600">Cor secundaria</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={safeHex(form.secondaryColor, DEFAULT_BRANDING.secondaryColor)}
                    onChange={(e) => updateField("secondaryColor", e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                  />
                  <input
                    className="clientes-input w-full"
                    value={form.secondaryColor}
                    onChange={(e) => updateField("secondaryColor", normalizeHexInput(e.target.value))}
                    placeholder="#E2E8F0"
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-600">Cor de acento</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={safeHex(form.accentColor, DEFAULT_BRANDING.accentColor)}
                    onChange={(e) => updateField("accentColor", e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                  />
                  <input
                    className="clientes-input w-full"
                    value={form.accentColor}
                    onChange={(e) => updateField("accentColor", normalizeHexInput(e.target.value))}
                    placeholder="#0EA5A4"
                  />
                </div>
              </label>
            </div>

            <label className="space-y-2">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                <Type size={14} /> Tipografia do PDF
              </span>
              <select
                value={form.fontFamily}
                onChange={(e) => updateField("fontFamily", e.target.value as SalonBrandingConfig["fontFamily"])}
                className="clientes-input w-full"
              >
                {FONT_OPTIONS.filter((font) => supportedFonts.includes(font.value)).map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <span className="text-sm font-medium text-slate-600">Logo</span>
              <div className="flex flex-wrap items-center gap-3">
                <label className="btn-secondary inline-flex cursor-pointer items-center gap-2 text-sm">
                  <ImagePlus size={16} />
                  {uploadingLogo ? "Enviando..." : "Enviar logo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    disabled={uploadingLogo}
                    onChange={(e) => handleLogoUpload(e.target.files?.[0] || null)}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={!form.logoUrl || removeLogoLoading}
                  className="btn-danger inline-flex items-center gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  {removeLogoLoading ? "Removendo..." : "Remover logo"}
                </button>
              </div>
              <input
                className="clientes-input w-full"
                value={form.logoUrl || ""}
                onChange={(e) => updateField("logoUrl", e.target.value || null)}
                placeholder="https://cdn.salao.com/logo.png ou data:image/..."
              />
              <p className="text-xs text-slate-500">Formatos suportados no upload: PNG, JPG e WEBP (max. 2MB).</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="btn-primary"
              >
                <Save size={16} />
                {saving ? "Salvando..." : "Salvar branding"}
              </button>
              <button type="button" onClick={handleResetDefaults} className="btn-secondary">
                Restaurar padrao visual
              </button>
            </div>
          </div>
        </Section>

        <Section>
          <h2 className="text-lg font-semibold text-slate-900">Preview executivo</h2>
          <p className="mt-1 text-sm text-slate-500">Pre-visualizacao do cabecalho aplicado no PDF.</p>

          <div
            className="mt-5 rounded-2xl border p-4"
            style={{ borderColor: safeHex(form.accentColor, DEFAULT_BRANDING.accentColor) }}
          >
            <div
              className="rounded-xl border p-4"
              style={{
                backgroundColor: safeHex(form.secondaryColor, DEFAULT_BRANDING.secondaryColor),
                borderColor: safeHex(form.accentColor, DEFAULT_BRANDING.accentColor),
                fontFamily: fontPreviewFamily(form.fontFamily),
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full"
                  style={{ backgroundColor: safeHex(form.primaryColor, DEFAULT_BRANDING.primaryColor) }}
                >
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo" className="h-14 w-14 object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {String(salonName || "S")
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p
                    className="text-lg font-semibold"
                    style={{ color: safeHex(form.primaryColor, DEFAULT_BRANDING.primaryColor) }}
                  >
                    {salonName}
                  </p>
                  <p className="text-sm" style={{ color: safeHex(form.primaryColor, DEFAULT_BRANDING.primaryColor) }}>
                    Relatorio tecnico estetico de analise capilar
                  </p>
                  <p className="text-xs" style={{ color: safeHex(form.primaryColor, DEFAULT_BRANDING.primaryColor) }}>
                    Escala PDF 1:1 (A4 210 x 297 mm)
                  </p>
                </div>
              </div>
            </div>

            <div
              className="mt-4 rounded-xl border p-3 text-sm"
              style={{
                borderColor: safeHex(form.secondaryColor, DEFAULT_BRANDING.secondaryColor),
                fontFamily: fontPreviewFamily(form.fontFamily),
              }}
            >
              <p className="font-semibold" style={{ color: safeHex(form.primaryColor, DEFAULT_BRANDING.primaryColor) }}>
                Bloco executivo de protocolo
              </p>
              <p className="mt-1 text-slate-600">
                Layout e estrutura tecnica preservados, com identidade do tenant aplicada.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </section>
  );
}
