import { Camera, ImagePlus, Loader2, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

interface Props {
  onCapture: (file: File) => void;
  isProcessing?: boolean;
  title?: string;
  subtitle?: string;
  allowQuickCapture?: boolean;
  quickCaptureLabel?: string;
  quickCaptureHint?: string;
  requiredShots?: Array<{
    key: string;
    label: string;
    hint?: string;
  }>;
}

export default function ImageCapture({
  onCapture,
  isProcessing = false,
  title = "Capture de alta precisão",
  subtitle = "Use câmera traseira ou envie imagem da galeria com foco técnico.",
  allowQuickCapture = false,
  quickCaptureLabel = "Modo rápido (1 captura)",
  quickCaptureHint = "Reduz a exigência da sequência, com precisão levemente menor.",
  requiredShots,
}: Props) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const [shotFiles, setShotFiles] = useState<Array<File | null>>([]);
  const [lastError, setLastError] = useState<string>("");
  const [quickMode, setQuickMode] = useState(false);
  const { notify } = useToast();

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

  const hasSequence = Array.isArray(requiredShots) && requiredShots.length > 1;

  const sequence = useMemo(() => {
    if (quickMode) return null;
    if (hasSequence) {
      return requiredShots;
    }
    return null;
  }, [hasSequence, quickMode, requiredShots]);

  useEffect(() => {
    if (!allowQuickCapture && quickMode) {
      setQuickMode(false);
    }
  }, [allowQuickCapture, quickMode]);

  useEffect(() => {
    if (!quickMode) return;
    setShotFiles([]);
    setSelectedFileName("");
    setLastError("");
  }, [quickMode]);

  const safeShotFiles = useMemo(() => {
    if (!sequence) return [];
    if (shotFiles.length === sequence.length) return shotFiles;
    return new Array(sequence.length).fill(null);
  }, [sequence, shotFiles]);

  const currentShotIndex = sequence
    ? safeShotFiles.findIndex((file) => !file) === -1
      ? sequence.length
      : safeShotFiles.findIndex((file) => !file)
    : 0;

  const sequenceComplete = sequence
    ? safeShotFiles.every((file) => file instanceof File)
    : false;

  async function validateImageQuality(file: File): Promise<{ ok: boolean; message?: string }> {
    const minSize = quickMode ? 50 * 1024 : 90 * 1024;
    const minDim = quickMode ? 600 : 900;

    if (file.size < minSize) {
      return {
        ok: false,
        message:
          quickMode
            ? "Imagem muito pequena para o modo rápido. Capture com mais nitidez e luz frontal."
            : "Imagem com baixa qualidade (arquivo muito pequeno). Recapture com mais nitidez e iluminação frontal.",
      };
    }

    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      const loaded = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => reject(new Error("Falha ao ler dimensões da imagem"));
        img.src = url;
      });
      URL.revokeObjectURL(url);

      if (loaded.width < minDim || loaded.height < minDim) {
        return {
          ok: false,
          message:
            quickMode
              ? "Resolução insuficiente mesmo no modo rápido. Use pelo menos 600x600 px."
              : "Resolução insuficiente para análise precisa. Use imagem com pelo menos 900x900 px.",
        };
      }
    } catch {
      return {
        ok: false,
        message: "Não foi possível validar a qualidade da imagem. Tente outra captura.",
      };
    }

    return { ok: true };
  }

  async function mergeShots(files: File[]): Promise<File> {
    const loadImage = (file: File) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Falha ao carregar imagem para composição"));
        };
        img.src = url;
      });

    const images = await Promise.all(files.map((file) => loadImage(file)));

    const cellWidth = 780;
    const cellHeight = 780;
    const canvas = document.createElement("canvas");
    canvas.width = cellWidth * images.length;
    canvas.height = cellHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas não disponível para composição da sequência");
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    images.forEach((img, index) => {
      const scale = Math.min(cellWidth / img.width, cellHeight / img.height);
      const drawWidth = Math.round(img.width * scale);
      const drawHeight = Math.round(img.height * scale);
      const x = index * cellWidth + Math.round((cellWidth - drawWidth) / 2);
      const y = Math.round((cellHeight - drawHeight) / 2);
      ctx.drawImage(img, x, y, drawWidth, drawHeight);
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (!result) {
            reject(new Error("Falha ao gerar imagem composta"));
            return;
          }
          resolve(result);
        },
        "image/jpeg",
        0.92,
      );
    });

    return new File([blob], `sequência-captura-${Date.now()}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }

  async function handleFile(file: File) {
    if (isProcessing) return;

    const isAllowed =
      allowedTypes.includes(file.type) ||
      allowedTypes.some((type) => file.name.toLowerCase().endsWith(type.replace("image/", ".")));

    if (!isAllowed) {
      const msg = "Apenas imagens PNG ou JPG são permitidas. Escolha outra imagem.";
      setLastError(msg);
      notify(msg, "error");
      return;
    }

    const quality = await validateImageQuality(file);
    if (!quality.ok) {
      const msg = quality.message || "Imagem sem qualidade suficiente para leitura técnica.";
      setLastError(msg);
      notify(msg, "warning");
      return;
    }

    setLastError("");

    if (!sequence) {
      setSelectedFileName(file.name);
      onCapture(file);
      return;
    }

    const next = [...safeShotFiles];
    const targetIndex = currentShotIndex >= sequence.length ? sequence.length - 1 : currentShotIndex;
    next[targetIndex] = file;
    setShotFiles(next);

    const hasAll = next.every((item) => item instanceof File);
    if (!hasAll) return;

    try {
      const merged = await mergeShots(next as File[]);
      setSelectedFileName(`Sequência técnica (${sequence.length} capturas)`);
      onCapture(merged);
    } catch {
      const fallback = next[next.length - 1];
      if (fallback) {
        setSelectedFileName(fallback.name);
        onCapture(fallback);
      }
    }
  }

  return (
    <div className="space-y-4 capture-stage-enter capture-stage-enter-delay-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Captura</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>

      {lastError && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <Sparkles size={16} className="mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Ajuste necessário para a captura</p>
            <p className="leading-relaxed">{lastError}</p>
          </div>
        </div>
      )}

      <div
        className={[
          "rounded-3xl border border-dashed p-5 transition capture-dropzone-premium",
          isProcessing ? "pointer-events-none opacity-70" : "",
          dragging
            ? "border-[color:var(--color-success-400)] bg-[color:var(--color-success-50)]/70"
            : "border-slate-200 bg-white",
        ].join(" ")}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          if (isProcessing) return;
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file && file.type.startsWith("image/")) {
            void handleFile(file);
          }
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <ImagePlus size={20} />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">Arraste e solte uma imagem aqui</p>
          <p className="mt-1 text-xs text-slate-500">ou use os botões de captura abaixo para câmera/galeria.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 capture-chip-premium">
          <Sparkles size={12} />
          Nitidez alta
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 capture-chip-premium">
          Fundo neutro
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 capture-chip-premium">
          Sem reflexo forte
        </span>
      </div>

      {allowQuickCapture && hasSequence && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{quickCaptureLabel}</p>
            <p className="mt-1 text-[11px] text-slate-500">{quickCaptureHint}</p>
          </div>
          <button
            type="button"
            onClick={() => setQuickMode((prev) => !prev)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              quickMode
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            disabled={isProcessing}
          >
            {quickMode ? "Ativo" : "Ativar"}
          </button>
        </div>
      )}

      {sequence && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Sequência obrigatória ({sequence.length} capturas)
            </p>
            <p className="text-xs font-semibold text-slate-600">
              {Math.min(currentShotIndex, sequence.length)}/{sequence.length}
            </p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {sequence.map((shot, index) => {
              const done = safeShotFiles[index] instanceof File;
              const active = index === currentShotIndex && !sequenceComplete;
              return (
                <div
                  key={shot.key}
                  className={[
                    "rounded-xl border px-3 py-2",
                    done
                      ? "border-emerald-200 bg-emerald-50"
                      : active
                        ? "border-slate-400 bg-white"
                        : "border-slate-200 bg-white",
                  ].join(" ")}
                >
                  <p className="text-xs font-semibold text-slate-800">{shot.label}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{shot.hint || "Capture com foco e nitidez."}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              onClick={() => {
                const next = [...safeShotFiles];
                const target =
                  currentShotIndex > 0 && currentShotIndex <= sequence.length
                    ? currentShotIndex - 1
                    : sequence.length - 1;
                next[target] = null;
                setShotFiles(next);
              }}
              disabled={isProcessing}
            >
              Refazer etapa anterior
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              onClick={() => setShotFiles(new Array(sequence.length).fill(null))}
              disabled={isProcessing}
            >
              Reiniciar sequência
            </button>
          </div>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/png,image/jpeg"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isProcessing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 capture-button-primary focus-ring-strong"
        >
          <Camera size={16} />
          Capturar com câmera
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={isProcessing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 capture-button-secondary focus-ring-strong"
        >
          <Upload size={16} />
          Enviar da galeria
        </button>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        {isProcessing ? (
          <span className="inline-flex items-center gap-2" aria-live="polite">
            <Loader2 size={14} className="animate-spin" />
            Processando imagem e preparando leitura técnica...
          </span>
        ) : selectedFileName ? (
          `Arquivo selecionado: ${selectedFileName}`
        ) : quickMode ? (
          "Modo rápido ativo: 1 captura. Recomendado: luz frontal difusa, 20-30 cm e foco em áreas críticas."
        ) : (
          "Recomendado: luz frontal difusa, distância de 20-30 cm e foco em áreas críticas."
        )}
      </div>
    </div>
  );
}
