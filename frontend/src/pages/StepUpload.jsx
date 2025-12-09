import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { checkImageQuality } from "../utils/checkImageQuality";
import { getAttempts, incrementAttempt, resetAttempts } from "../utils/attempts";

export default function StepUpload({ form, setForm, onUploaded }) {
  const fileRef = useRef();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(3);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedName, setSelectedName] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const attempts = getAttempts();
    setRemaining(Math.max(0, 3 - (attempts.uploadDoc || 0)));
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleResetAttempts = () => {
    resetAttempts("uploadDoc");
    setRemaining(3);
    setStatus("Attempts reset. You can upload again.");
  };

  const handleFileChosen = (ev) => {
    const f = ev.target.files?.[0];
    if (!f) {
      setPreviewUrl(null);
      setSelectedName("");
      return;
    }
    setSelectedName(f.name || "");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (f.type && f.type.startsWith("image/")) {
      const u = URL.createObjectURL(f);
      setPreviewUrl(u);
    } else {
      setPreviewUrl(null);
    }
    setStatus("");
  };

  const handleUpload = async () => {
    const file = fileRef.current.files?.[0];
    if (!file) {
      setStatus("Please select a file to upload.");
      return;
    }

    if (!form.docType) {
      setStatus("Please choose a Document type before uploading.");
      return;
    }

    const attemptsNow = getAttempts().uploadDoc || 0;
    if (attemptsNow >= 3) {
      setStatus("You have reached the maximum attempts. Contact support.");
      return;
    }

    setStatus("Running quick checks...");
    try {
      const quality = await checkImageQuality(file);
      if (!quality.ok) {
        const tries = incrementAttempt("uploadDoc");
        setRemaining(Math.max(0, 3 - tries));
        setStatus("Issue: " + (quality.reason || "Image failed checks."));
        return;
      }
    } catch (err) {
   
      console.warn("checkImageQuality failed", err);
      setStatus("Warning: quick checks failed, attempting upload...");
    }


    const fd = new FormData();
    fd.append("file", file); 
    fd.append("docType", form.docType || "");

    try {
      setLoading(true);
      setProgress(0);
      setStatus("Uploading and starting validation...");

      const res = await axios.post("/api/kyc/upload-doc", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
        onUploadProgress: (evt) => {
          if (evt.total) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setProgress(pct);
          }
        },
      });

      
      if (res.data?.ok === false) {
        const tries = incrementAttempt("uploadDoc");
        setRemaining(Math.max(0, 3 - tries));
        setStatus("Rejected: " + (res.data.error || "Unknown"));
        return;
      }

   
      const taskId = res.data.taskId;
      setForm((prev) => ({ ...prev, docTaskId: taskId }));
      setStatus("File received. Validation in progress...");
      onUploaded && onUploaded(taskId);
    } catch (err) {
      const tries = incrementAttempt("uploadDoc");
      setRemaining(Math.max(0, 3 - tries));
      const msg =
        err.response?.data?.error ||
        (err.response?.data && JSON.stringify(err.response.data)) ||
        err.message ||
        "Upload failed";
      setStatus("Upload failed: " + msg);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="mt-4 grid grid-cols-1 gap-4">
      <div className="flex items-center justify-between">
        <label className="font-medium">Document type</label>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-600">
            Attempts left: <span className="font-semibold">{remaining}</span>
          </div>
          <button onClick={handleResetAttempts} className="text-xs text-blue-600 underline">
            Reset attempts
          </button>
        </div>
      </div>

      <select
        value={form.docType}
        onChange={(e) => setForm((prev) => ({ ...prev, docType: e.target.value }))}
        className="border rounded p-2"
      >
        <option value="">Select document</option>
        <option value="aadhaar">Aadhaar</option>
        <option value="pan">PAN</option>
        <option value="passport">Passport</option>
      </select>

      <div className="border rounded p-4 flex gap-4 items-center">
        <div style={{ flex: 1 }}>
          <label className="block mb-2 text-sm font-medium">Upload scanned document</label>

          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChosen}
              disabled={loading}
            />

            <button
              onClick={handleUpload}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-sky-700 to-sky-500 text-white rounded disabled:opacity-60"
            >
              {loading ? `Uploading... ${progress > 0 ? `${progress}%` : ""}` : "Upload & Validate"}
            </button>

            <div className="ml-auto text-sm text-slate-500">
              {selectedName ? <span>{selectedName}</span> : <span>No file selected</span>}
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-3">
            Tip: Use good lighting, keep edges visible, and avoid glare. PDFs are accepted and will be rasterized server-side.
          </p>

          {}
          {status && (
            <div className="mt-3 text-sm text-slate-700">
              {status}
            </div>
          )}
        </div>

        <div style={{ width: 140, height: 90, flexShrink: 0 }}>
          {previewUrl ? (
            <img src={previewUrl} alt="preview" className="w-full h-full object-cover rounded border" />
          ) : (
            <div className="w-full h-full border rounded flex items-center justify-center text-xs text-slate-400">
              No preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

