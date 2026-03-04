import { useState } from "react";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import VisualStatusBadge from "@/components/ui/VisualStatusBadge";

import {
  listarVisionHistory,
} from "@/vision/VisionHistoryStorage";
import { compararVision } from "@/vision/compareVision";
import { VisionHistoryItem } from "@/vision/VisionHistory.types";

export default function ComparacaoVisual() {
  const lista = listarVisionHistory();

  const [idxAntes, setIdxAntes] = useState<number | null>(null);
  const [idxDepois, setIdxDepois] = useState<number | null>(null);

  if (lista.length < 2) {
    return (
      <section className="section-stack animate-page-in w-full">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Comparação Visual (Antes × Depois)</h1>
          <p className="text-slate-600">Compare registros visuais para analisar evoluções</p>
        </div>
        <div className="text-center py-12">
          <div className="panel-tight max-w-md mx-auto text-center hover:shadow-md transition-shadow">
            <p className="text-slate-500">É necessário ter pelo menos dois registros visuais salvos.</p>
          </div>
        </div>
      </section>
    );
  }

  const antes: VisionHistoryItem | null =
    idxAntes !== null ? lista[idxAntes] : null;

  const depois: VisionHistoryItem | null =
    idxDepois !== null ? lista[idxDepois] : null;

  const resultado =
    antes && depois ? compararVision(antes, depois) : null;

  return (
    <section className="section-stack animate-page-in w-full">
      <div className="panel-tight">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Comparação Visual (Antes × Depois)</h1>
          <p className="text-slate-600">Compare registros visuais para analisar evoluções</p>
        </div>
      </div>

      <div className="panel-tight hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Selecionar registros</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Antes</label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20 shadow-sm focus:shadow-md transition-shadow"
              onChange={(e) => setIdxAntes(Number(e.target.value))}
            >
              <option value="">Selecione</option>
              {lista.map((item, i) => (
                <option key={item.id} value={i}>
                  {new Date(item.createdAt).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Depois</label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20 shadow-sm focus:shadow-md transition-shadow"
              onChange={(e) => setIdxDepois(Number(e.target.value))}
            >
              <option value="">Selecione</option>
              {lista.map((item, i) => (
                <option key={item.id} value={i}>
                  {new Date(item.createdAt).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {antes && depois && (
        <>
          <div className="panel-tight hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Resultado da comparação</h3>
            <VisualStatusBadge status={resultado!.status} />
            <p className="mt-2 text-sm text-slate-600">{resultado!.resumo}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="panel-tight hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Antes</h3>
              <img
                src={antes.annotationBase64 || antes.imageBase64}
                alt="Antes"
                className="w-full rounded-xl"
              />
              {antes.findings.length > 0 && (
                <div className="mt-4">
                  <strong className="text-sm text-slate-700">Achados:</strong>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {antes.findings.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="panel-tight hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Depois</h3>
              <img
                src={depois.annotationBase64 || depois.imageBase64}
                alt="Depois"
                className="w-full rounded-xl"
              />
              {depois.findings.length > 0 && (
                <div className="mt-4">
                  <strong className="text-sm text-slate-700">Achados:</strong>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {depois.findings.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="text-center">
        <Button 
          variant="secondary" 
          onClick={() => history.back()}
          className="shadow-sm hover:shadow-md transition-shadow"
        >
          Voltar
        </Button>
      </div>
    </section>
  );
}
