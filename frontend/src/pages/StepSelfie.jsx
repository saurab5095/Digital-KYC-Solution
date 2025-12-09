// src/pages/StepSelfie.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getAttempts, incrementAttempt } from "../utils/attempts";

export default function StepSelfie({ onNext }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState("");
  const [remaining, setRemaining] = useState(3);
  const [capturedUrl, setCapturedUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState("user");

  useEffect(() => {
    const attempts = getAttempts();
    setRemaining(Math.max(0, 3 - (attempts.selfie || 0)));
  }, []);

  useEffect(() => {
    return () => {
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = useCallback(async (mode = "user") => {
    setCameraError(null);
    setStatus("Requesting camera access...");
    stopCamera();

    const tryOptions = [
      { video: { facingMode: mode } },
      { video: true },
    ];

    for (const opts of tryOptions) {
      try {
        const s = await navigator.mediaDevices.getUserMedia(opts);
        setStream(s);

        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.srcObject = s;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn("video.play() failed initially", playErr);
          }
        }

        setStatus("");
        return s;
      } catch (err) {
        console.warn("getUserMedia attempt failed", opts, err);
        setCameraError(String(err?.name || err?.message || err));
      }
    }

    setStatus(
      "Unable to access camera. Use 'Or upload photo' fallback or check browser permissions."
    );
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch {}
    }
  }, [stream]);

  const captureAndUpload = () => {
    setStatus("");
    if (!videoRef.current) {
      setStatus("Camera not available.");
      return;
    }

    const video = videoRef.current;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = canvasRef.current;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setStatus("Failed to capture photo. Try again.");
          return;
        }

        if (capturedUrl) URL.revokeObjectURL(capturedUrl);
        const url = URL.createObjectURL(blob);
        setCapturedUrl(url);

        uploadSelfieBlob(blob);
      },
      "image/jpeg",
      0.9
    );
  };

  const uploadSelfieBlob = async (blobOrFile) => {
    const attemptsNow = getAttempts().selfie || 0;
    if (attemptsNow >= 3) {
      setStatus("You have reached the maximum selfie attempts. Contact support.");
      return;
    }

    const fd = new FormData();
    fd.append("selfie", blobOrFile, "selfie.jpg");

    try {
      setUploading(true);
      setProgress(0);
      setStatus("Uploading selfie...");

      const res = await axios.post("/api/kyc/upload-selfie", fd, {
        timeout: 60000,
        onUploadProgress: (evt) => {
          if (evt.total) {
            setProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        },
      });

      if (res.data?.ok) {
        setStatus("Selfie uploaded. Validation queued.");
        onNext && onNext();
      } else {
        const tries = incrementAttempt("selfie");
        setRemaining(Math.max(0, 3 - tries));
        setStatus("Selfie rejected: " + (res.data?.error || "Unknown"));
      }
    } catch (err) {
      const tries = incrementAttempt("selfie");
      setRemaining(Math.max(0, 3 - tries));
      const msg = err.response?.data?.error || err.message || "Upload failed";
      setStatus("Upload failed: " + msg);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const onFileChosen = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    const url = URL.createObjectURL(f);
    setCapturedUrl(url);
    uploadSelfieBlob(f);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Capture a real-time selfie</h3>
        <div className="text-sm text-slate-600">
          Attempts left: <strong>{remaining}</strong>
        </div>
      </div>

      <div className="bg-black rounded overflow-hidden" style={{ minHeight: 360 }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ backgroundColor: "#000" }}
        />
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={captureAndUpload}
          disabled={uploading}
          className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-60"
        >
          {uploading ? `Uploading ${progress > 0 ? progress + "%" : ""}` : "Capture & Upload"}
        </button>

        <button
          onClick={() => {
            if (stream) {
              stopCamera();
              setStatus("Camera stopped");
            } else {
              startCamera(facingMode);
              setStatus("");
            }
          }}
          className="px-4 py-2 border rounded"
        >
          {stream ? "Stop Camera" : "Start Camera"}
        </button>

        <button
          onClick={async () => {
            const next = facingMode === "user" ? "environment" : "user";
            setFacingMode(next);
            stopCamera();
            setTimeout(() => startCamera(next), 150);
          }}
          className="px-3 py-1 border rounded text-sm"
        >
          Toggle Camera
        </button>

        <label className="px-3 py-2 bg-slate-100 border rounded cursor-pointer text-sm">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChosen}
            style={{ display: "none" }}
            disabled={uploading}
          />
          Or upload photo
        </label>

        <button
          onClick={() => {
            stopCamera();
            setStatus("");
          }}
          className="px-3 py-1 border rounded text-sm"
        >
          Back
        </button>
      </div>

      {cameraError && <div className="text-sm text-red-700 mt-2">{cameraError}</div>}
      {status && <div className="text-sm text-slate-700 mt-2">{status}</div>}

      <div className="text-xs text-slate-500 mt-1">
        Tip: Look straight to camera, remove sunglasses, ensure good lighting.
      </div>

      {!stream && (
        <div className="mt-2">
          <button onClick={() => startCamera(facingMode)} className="text-sm px-2 py-1 border rounded">
            Start camera
          </button>
        </div>
      )}
    </div>
  );
}
