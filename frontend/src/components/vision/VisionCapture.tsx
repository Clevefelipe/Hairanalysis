import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button";

interface VisionCaptureProps {
  onCapture: (imageBase64: string) => void;
}

export default function VisionCapture({ onCapture }: VisionCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((allDevices) => {
      const videoDevices = allDevices.filter(
        (d) => d.kind === "videoinput"
      );
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedDeviceId) return;

    navigator.mediaDevices
      .getUserMedia({
        video: {
          deviceId: { exact: selectedDeviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
  }, [selectedDeviceId]);

  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/png");

    onCapture(base64);
  }

  return (
    <div className="space-y-4">
      {/* Seleção de dispositivo */}
      <div>
        <label className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          Dispositivo de captura:
        </label>
        <select
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
          className="clientes-input mt-2 w-full"
        >
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || "Dispositivo de vídeo"}
            </option>
          ))}
        </select>
      </div>

      {/* Vídeo */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full rounded-2xl bg-black shadow-inner"
      />

      <canvas ref={canvasRef} className="hidden" />

      <div>
        <Button
          variant="primary"
          onClick={handleCapture}
          className="shadow-lg hover:shadow-xl"
        >
          Capturar Imagem
        </Button>
      </div>
    </div>
  );
}
