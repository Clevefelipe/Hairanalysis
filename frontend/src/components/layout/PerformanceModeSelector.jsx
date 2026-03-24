import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import Button from "@/components/ui/Button";
import { Zap, Sparkles, Monitor, Smartphone } from "lucide-react";
import { useDeviceDetection } from "../utils/deviceDetection";

export default function PerformanceModeSelector() {
  const { shouldUseLiteMode, isMobile, isLowEnd, forcedMode, setPerformanceMode } = useDeviceDetection();

  if (forcedMode) return null; // Não mostra se usuário já escolheu

  return (
    <Card className="glass-effect border-blue-300 bg-blue-50 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {shouldUseLiteMode ? (
              <Smartphone className="w-8 h-8 text-blue-600" />
            ) : (
              <Monitor className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 mb-2">
              {shouldUseLiteMode ? "💡 Modo Leve Ativado Automaticamente" : "⚡ Modo Completo Ativo"}
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              {shouldUseLiteMode
                ? `Detectamos que você está usando ${isMobile ? 'dispositivo móvel' : 'hardware limitado'}. O modo leve otimiza performance e reduz o uso de dados.`
                : "Seu dispositivo suporta todas as funcionalidades avançadas do sistema."}
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={shouldUseLiteMode ? "secondary" : "ghost"}
                onClick={() => setPerformanceMode('lite')}
                className="h-10 px-3"
              >
                <Zap className="w-4 h-4 mr-2" />
                Modo Leve
              </Button>
              <Button
                variant={!shouldUseLiteMode ? "secondary" : "ghost"}
                onClick={() => setPerformanceMode('full')}
                className="h-10 px-3"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Modo Completo
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

