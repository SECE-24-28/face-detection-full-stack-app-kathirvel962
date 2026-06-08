"use client";
// components/FaceCamera.tsx
// Accesses the webcam, captures a snapshot, and simulates a face detection result.
// In a real app you would send the image to a Python/ML backend here.

import { useRef, useState } from "react";

interface DetectionResult {
  imageDataUrl: string;   // base64 snapshot taken from webcam
  confidence: number;     // simulated confidence score 0–100
  status: "detected" | "failed";
}

interface Props {
  // Called when the user accepts the detection result
  onDetected: (result: DetectionResult) => void;
}

export default function FaceCamera({ onDetected }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [streaming, setStreaming]   = useState(false);
  const [snapshot, setSnapshot]     = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [status, setStatus]         = useState<"detected" | "failed" | null>(null);
  const [error, setError]           = useState("");

  // Start the webcam stream
  async function startCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreaming(true);
      }
    } catch {
      setError("Could not access camera. Please allow camera permission.");
    }
  }

  // Stop all webcam tracks
  function stopCamera() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    setStreaming(false);
  }

  // Capture a frame from the video and simulate detection
  function captureAndDetect() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Draw the current video frame onto the hidden canvas
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg");
    setSnapshot(dataUrl);

    // ── Simulated detection ──────────────────────────────────────────────────
    // In production, replace this block with a fetch() call to your ML backend:
    //   const res = await fetch("/api/detect", { method:"POST", body: formData });
    //   const { confidence } = await res.json();
    // ─────────────────────────────────────────────────────────────────────────
    const simulatedConfidence = Math.round(60 + Math.random() * 40); // 60–100
    const detectionStatus = simulatedConfidence >= 75 ? "detected" : "failed";

    setConfidence(simulatedConfidence);
    setStatus(detectionStatus);
    stopCamera();
  }

  // Pass the result up to the parent page
  function acceptResult() {
    if (!snapshot || confidence === null || !status) return;
    onDetected({ imageDataUrl: snapshot, confidence, status });
    // Reset state for next capture
    setSnapshot(null);
    setConfidence(null);
    setStatus(null);
  }

  function retake() {
    setSnapshot(null);
    setConfidence(null);
    setStatus(null);
    startCamera();
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Live webcam feed */}
      {streaming && (
        <video
          ref={videoRef}
          className="rounded-xl border-4 border-indigo-300 w-72 h-54 object-cover"
          muted
        />
      )}

      {/* Snapshot preview */}
      {snapshot && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={snapshot}
            alt="Captured face"
            className="rounded-xl border-4 border-indigo-300 w-72 object-cover"
          />
          {/* Overlay badge */}
          <span
            className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-full ${
              status === "detected"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {status === "detected" ? "✔ Face Detected" : "✘ No Face"}
          </span>
        </div>
      )}

      {/* Hidden canvas used for capturing frames */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Confidence score display */}
      {confidence !== null && (
        <div className="text-center">
          <p className="text-sm text-gray-500">Confidence Score</p>
          <p
            className={`text-3xl font-bold ${
              status === "detected" ? "text-green-600" : "text-red-500"
            }`}
          >
            {confidence}%
          </p>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Action buttons */}
      <div className="flex gap-3">
        {!streaming && !snapshot && (
          <button
            onClick={startCamera}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            📷 Open Camera
          </button>
        )}

        {streaming && (
          <button
            onClick={captureAndDetect}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            🔍 Detect Face
          </button>
        )}

        {snapshot && (
          <>
            <button
              onClick={acceptResult}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              ✔ Save Record
            </button>
            <button
              onClick={retake}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              🔄 Retake
            </button>
          </>
        )}
      </div>
    </div>
  );
}
