"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Check, ImageIcon, RefreshCw, Sun, Upload } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────

type Mode = "camera" | "gallery";
type UploadState = "IDLE" | "CAPTURED" | "UPLOADING" | "UPLOADED" | "ERROR";

interface Props {
  type: "PASSPORT" | "DRIVING_LICENSE";
  reservationId: string | null;
  onComplete: () => void;
}

// ── Constants ─────────────────────────────────────────────────

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "application/pdf",
];

// ── S3 XHR upload with progress ───────────────────────────────

function uploadToS3WithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 upload failed: ${xhr.status}`));
    });
    xhr.addEventListener("error", () =>
      reject(new Error("Network error during S3 upload")),
    );
    xhr.send(file);
  });
}

// ── Brightness check ──────────────────────────────────────────

function getAverageBrightness(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext("2d");
  if (!ctx) return 255;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let sum = 0;
  // Sample every 20th pixel for speed
  for (let i = 0; i < data.length; i += 80) {
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  return sum / (data.length / 80);
}

// ── File validation ───────────────────────────────────────────

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) return "El archivo supera el límite de 5 MB.";
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Formato no permitido. Usa JPG, PNG, HEIC o PDF.";
  }
  return null;
}

// ── Component ─────────────────────────────────────────────────

export default function DocumentUploadStep({
  type,
  reservationId,
  onComplete,
}: Props) {
  const [mode, setMode] = useState<Mode>("camera");
  const [state, setState] = useState<UploadState>("IDLE");
  const [preview, setPreview] = useState<string | null>(null);
  const [lowLight, setLowLight] = useState(false);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);

  const label = type === "PASSPORT" ? "Pasaporte" : "Carnet de Conducir";

  // ── Camera lifecycle ──────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      toast.error("No se pudo acceder a la cámara. Usa la galería.");
      setMode("gallery");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (mode === "camera" && state === "IDLE") {
      queueMicrotask(() => {
        if (!cancelled) void startCamera();
      });
    }
    return () => {
      cancelled = true;
      if (mode === "camera") stopCamera();
    };
  }, [mode, state, startCamera, stopCamera]);

  // ── Capture from camera ────────────────────────────────────

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);

    const brightness = getAverageBrightness(canvas);
    if (brightness < 40) {
      setLowLight(true);
      return;
    }
    setLowLight(false);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Error al capturar la imagen. Inténtalo de nuevo.");
          return;
        }
        const file = new File([blob], "document.jpg", { type: "image/jpeg" });
        fileRef.current = file;
        const dataUrl = URL.createObjectURL(file);
        setPreview(dataUrl);
        setState("CAPTURED");
        stopCamera();
      },
      "image/jpeg",
      0.85,
    );
  }

  // ── Select from gallery ────────────────────────────────────

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      e.target.value = "";
      return;
    }

    fileRef.current = file;
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setLowLight(false);
    setState("CAPTURED");
  }

  // ── Upload ─────────────────────────────────────────────────

  async function handleUpload() {
    const file = fileRef.current;
    if (!file) {
      toast.error("No hay ningún archivo seleccionado.");
      return;
    }
    if (!reservationId) {
      toast.error("ID de reserva no disponible. Recarga la página.");
      return;
    }

    setState("UPLOADING");
    setProgress(0);

    // Check online status
    if (!navigator.onLine) {
      toast.info("Sin conexión. Guardando localmente...");
      if (preview) {
        try {
          localStorage.setItem(`nexus-pending-${type}`, preview);
        } catch {
          // Storage full — proceed anyway
        }
      }

      // Wait for reconnect
      const onOnline = async () => {
        toast.success("Conexión restaurada. Subiendo tu foto...");
        window.removeEventListener("online", onOnline);
        await doUpload(file, reservationId);
      };
      window.addEventListener("online", onOnline);
      return;
    }

    await doUpload(file, reservationId);
  }

  async function doUpload(file: File, resId: string) {
    try {
      // Step 1: Get presigned URL (backend returns uploadUrl='bypass' when BYPASS_S3=true)
      const presign = await apiFetch<{ uploadUrl: string; fileKey: string }>(
        "/documents/presign",
        {
          method: "POST",
          auth: true,
          body: JSON.stringify({ reservationId: resId, type }),
        },
      );

      // Step 2: PUT directly to S3 — skipped in dev bypass mode
      if (presign.uploadUrl !== "bypass") {
        await uploadToS3WithProgress(presign.uploadUrl, file, setProgress);
      } else {
        setProgress(100);
      }

      // Step 3: Confirm upload to backend
      await apiFetch("/documents/confirm", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          reservationId: resId,
          type,
          fileKey: presign.fileKey,
        }),
      });

      setState("UPLOADED");
      localStorage.removeItem(`nexus-pending-${type}`);
      // Auto-advance after brief success state
      setTimeout(() => onComplete(), 800);
    } catch (err) {
      setState("ERROR");
      const message =
        err instanceof Error ? err.message : "Error al subir el documento.";
      toast.error(message);
    }
  }

  // ── Retry ──────────────────────────────────────────────────

  function handleRetry() {
    setPreview(null);
    setLowLight(false);
    setState("IDLE");
    setProgress(0);
    fileRef.current = null;
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Mode tabs */}
      {state === "IDLE" && (
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          <ModeTab
            active={mode === "camera"}
            icon={Camera}
            label="Cámara"
            onClick={() => setMode("camera")}
          />
          <ModeTab
            active={mode === "gallery"}
            icon={ImageIcon}
            label="Galería"
            onClick={() => setMode("gallery")}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── IDLE: Camera viewfinder ─────────────────── */}
        {state === "IDLE" && mode === "camera" && (
          <motion.div
            key="viewfinder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Animated guide frame */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  className="w-[80%] h-[60%] relative"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {/* Corner indicators */}
                  <span className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-brand-primary rounded-tl-lg" />
                  <span className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-brand-primary rounded-tr-lg" />
                  <span className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-brand-primary rounded-bl-lg" />
                  <span className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-brand-primary rounded-br-lg" />
                </motion.div>
              </div>
              <p className="absolute bottom-4 inset-x-0 text-center text-white/80 text-xs font-medium">
                Centra tu {label.toLowerCase()} en el marco
              </p>
            </div>

            {/* Low light warning */}
            {lowLight && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-2.5 text-sm font-medium w-full"
              >
                <Sun className="w-4 h-4 shrink-0" />
                Necesita más luz. Acércate a una ventana.
              </motion.div>
            )}

            <button
              type="button"
              onClick={capturePhoto}
              className="w-full min-h-[50px] bg-brand-primary text-white font-bold text-sm rounded-full
                         flex items-center justify-center gap-2
                         hover:bg-brand-primary-hover active:scale-[0.98]
                         shadow-[0_4px_20px_rgba(37,99,235,0.28)] transition-all"
            >
              <Camera className="w-4 h-4" />
              Capturar
            </button>
          </motion.div>
        )}

        {/* ── IDLE: Gallery selector ──────────────────── */}
        {state === "IDLE" && mode === "gallery" && (
          <motion.div
            key="gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] bg-slate-50 border-2 border-dashed border-slate-300
                         rounded-2xl flex flex-col items-center justify-center gap-3
                         hover:border-brand-primary hover:bg-brand-primary/5 transition-colors cursor-pointer"
            >
              <Upload className="w-10 h-10 text-brand-muted" />
              <p className="text-sm font-semibold text-brand-muted">
                Toca para subir tu {label.toLowerCase()}
              </p>
              <p className="text-xs text-brand-muted/60">
                JPG, PNG, HEIC, PDF · máx 5 MB
              </p>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />

            {lowLight && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-2.5 text-sm font-medium w-full"
              >
                <Sun className="w-4 h-4 shrink-0" />
                La imagen es demasiado oscura. Intenta con otra foto.
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── CAPTURED: Preview ───────────────────────── */}
        {state === "CAPTURED" && preview && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={`Preview ${label}`}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={handleRetry}
                className="flex-1 min-h-[48px] bg-slate-100 text-brand-dark font-semibold text-sm rounded-full
                           hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Repetir
              </button>
              <button
                type="button"
                onClick={handleUpload}
                className="flex-1 min-h-[48px] bg-brand-primary text-white font-bold text-sm rounded-full
                           hover:bg-brand-primary-hover active:scale-[0.98]
                           shadow-[0_4px_20px_rgba(37,99,235,0.28)] transition-all
                           flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Usar esta foto
              </button>
            </div>
          </motion.div>
        )}

        {/* ── UPLOADING: Progress bar ─────────────────── */}
        {state === "UPLOADING" && (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-8"
          >
            <div className="relative w-16 h-16">
              <motion.div
                className="w-16 h-16 border-3 border-slate-200 border-t-brand-primary rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
            </div>
            <div className="w-full">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-brand-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <p className="text-sm text-brand-muted text-center mt-2 font-medium">
                Subiendo de forma segura… {progress}%
              </p>
            </div>
          </motion.div>
        )}

        {/* ── UPLOADED: Success ────────────────────────── */}
        {state === "UPLOADED" && (
          <motion.div
            key="uploaded"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center"
            >
              <Check className="w-8 h-8 text-brand-success" />
            </motion.div>
            <p className="text-base font-bold text-brand-dark">
              Documento recibido
            </p>
            <p className="text-sm text-brand-muted">
              {label} subido correctamente
            </p>
          </motion.div>
        )}

        {/* ── ERROR: Retry ─────────────────────────────── */}
        {state === "ERROR" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-8"
          >
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-base font-bold text-brand-dark">
              Error al subir
            </p>
            <p className="text-sm text-brand-muted text-center">
              No se pudo subir el documento. Comprueba tu conexión e inténtalo
              de nuevo.
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="min-h-[48px] px-8 bg-brand-primary text-white font-bold text-sm rounded-full
                         hover:bg-brand-primary-hover active:scale-[0.98]
                         shadow-[0_4px_20px_rgba(37,99,235,0.28)] transition-all
                         flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// ── Mode tab helper ──────────────────────────────────────────

function ModeTab({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all
        ${active ? "bg-white text-brand-dark shadow-sm" : "text-brand-muted hover:text-brand-dark"}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
