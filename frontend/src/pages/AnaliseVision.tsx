import { useRef, useState } from "react";

import Card from "@/components/ui/Card";
import VisionCapture from "@/components/vision/VisionCapture";
import ImageAnnotator from "@/components/vision/ImageAnnotator";

import { VisionSession } from "@/vision/VisionSession";
import { analyzeFrame } from "@/vision/VisionAnalyzer";
import { VisionFrame } from "@/vision/types";

import { salvarVisionHistory } from "@/vision/VisionHistoryStorage";
import { salvarVisionBackend } from "@/services/visionApi";
import { useAuth } from "@/context/AuthContext";

export default function AnaliseVision() {
  const { token, user } = useAuth(); // 🔐 salonId REAL vem daqui
  const sessionRef = useRef(new VisionSession());

  const [frames, setFrames] = useState<VisionFrame[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<VisionFrame | null>(null);
  const [findings, setFindings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function handleCapture(imageBase64: string) {
    sessionRef.current.addFrame(imageBase64);
    const allFrames = sessionRef.current.getFrames();
    const safeFrames = Array.isArray(allFrames) ? allFrames : [];
    setFrames(safeFrames);

    const lastFrame = safeFrames[safeFrames.length - 1];
    if (!lastFrame) return;
    setSelectedFrame(lastFrame);

    const analysisResult = analyzeFrame(lastFrame);
    setFindings(analysisResult.findings.map((f) => f.label));
  }

  async function handleSaveAnnotation(annotationBase64: string) {
    if (!selectedFrame || !token || !user?.salonId) return;

    setSaving(true);

    // 1️⃣ Atualiza sessão local
    sessionRef.current.setAnnotation(
      selectedFrame.id,
      annotationBase64
    );

    // 2️⃣ Salva offline (localStorage)
    salvarVisionHistory({
      id: selectedFrame.id,
      createdAt: Date.now(),
      imageBase64: selectedFrame.imageBase64,
      annotationBase64,
      findings,
    });

    // 3️⃣ Salva no backend com salonId REAL
    try {
      await salvarVisionBackend(selectedFrame.id, {
        imageBase64: selectedFrame.imageBase64,
        annotationBase64,
        findings,
      });
    } catch (error) {
      alert(
        "A imagem foi salva localmente, mas não foi possível sincronizar com o servidor."
      );
    }

    setSaving(false);
    alert("Imagem e anotação salvas com sucesso.");
  }

  return (
    <div className="space-y-8 p-6 animate-page-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
          Análise Visual (IA Vision Assistiva)
        </h1>
        <p style={{ color: "var(--color-text-muted)" }}>Captura e análise assistida por inteligência artificial</p>
      </div>

      <Card title="Captura por câmera ou microscópio">
        <VisionCapture onCapture={handleCapture} />
      </Card>

      {selectedFrame && (
        <Card title="Anotar imagem capturada">
          <ImageAnnotator
            imageBase64={selectedFrame.imageBase64}
            onSave={handleSaveAnnotation}
          />
        </Card>
      )}

      <Card title="Achados automáticos" variant="attention">
        {findings.length === 0 ? (
          <p>Nenhum achado visual automático relevante.</p>
        ) : (
          <ul>
            {findings.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
      </Card>

      {saving && (
        <Card title="Salvando dados" variant="attention">
          Salvando dados… aguarde.
        </Card>
      )}

      <Card title="Aviso importante" variant="attention">
        Esta análise visual é um recurso de apoio técnico-estético.
        Não substitui avaliação profissional nem diagnóstico clínico.
      </Card>
    </div>
  );
}
