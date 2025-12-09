import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

export default function PollStatus({
  taskId,
  onAccept,
  onReject,
  pollInterval = 1200,
}) {
  const [statusObj, setStatusObj] = useState({ status: "PENDING" });
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const retryRef = useRef(false);

  useEffect(() => {
    if (!taskId) return;
    retryRef.current = false;
    setPolling(true);
    setLoading(true);

    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const res = await axios.get(`/api/kyc/status/${taskId}`, {
          timeout: 10000,
        });
        if (cancelled) return;
        const data = res.data || {};
        setStatusObj(data);
        setLoading(false);

        const reason = (data.reason || "").toString().toLowerCase();
        const isTypeMismatch = reason.includes("type mismatch");

        if (data.status === "ACCEPT") {
          setPolling(false);
          onAccept && onAccept(data);
        } else if (data.status === "REJECT") {
          if (!isTypeMismatch) {
            setPolling(false);
            onReject && onReject(data);
          } else {
            setPolling(false);
          }
        } else {
        }
      } catch (err) {
      }
    };

    fetchStatus();
    const id = setInterval(() => {
      if (polling) fetchStatus();
    }, pollInterval);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [taskId, onAccept, onReject, pollInterval, polling]);

  const isPending = statusObj.status === "PENDING" || loading;
  const isAccept = statusObj.status === "ACCEPT";
  const isReject = statusObj.status === "REJECT";

  const reasonText = statusObj.reason || null;
  const isTypeMismatch =
    reasonText && reasonText.toString().toLowerCase().includes("type mismatch");

  const handleRetry = () => {
    retryRef.current = true;
    setStatusObj({ status: "PENDING" });
    setLoading(false);
    onReject && onReject({ retry: true });
  };

  const renderSanitizedSnippet = (rawText) => {
    if (!rawText) return null;
    const raw = String(rawText || "");
    let sanitized = raw
      .replace(/[ \t\v\f\r]+/g, " ")
      .replace(/\n{2,}/g, "\n")
      .trim();
    const displayText =
      sanitized.length > 2000 ? sanitized.slice(0, 2000) + "… (truncated)" : sanitized;

    return (
      <div className="mt-4 p-3 bg-slate-50 border rounded">
        <div className="text-xs text-slate-700">
          <strong>OCR Snippet:</strong>
          <div className="mt-2">
            <pre
              className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-700 m-0 p-3 bg-white border rounded"
              style={{ whiteSpace: "pre-wrap", overflowWrap: "break-word" }}
            >
              {displayText}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 bg-white rounded-md shadow-sm border"
    >
      {}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {isAccept ? (
            <CheckCircleIcon className="w-7 h-7 text-emerald-600" />
          ) : isReject ? (
            <XCircleIcon className="w-7 h-7 text-red-600" />
          ) : (
            <ArrowPathIcon
              className="w-7 h-7 text-slate-400"
              style={{ animation: "spin 1.6s linear infinite" }}
            />
          )}
        </div>

        <div className="flex-1">
          <div
            className={`text-sm font-medium ${
              isAccept ? "text-emerald-700" : isReject ? "text-red-700" : "text-slate-700"
            }`}
          >
            <strong>Status:</strong> {statusObj.status}
          </div>

          {reasonText && (
            <div className="mt-1 text-xs text-slate-600">
              <strong>Reason:</strong> {reasonText}
            </div>
          )}

          {isPending && (
            <div className="mt-2 text-xs text-slate-500">
              Validation in progress... (this may take a few seconds)
            </div>
          )}
        </div>
      </div>

      {}
      {statusObj.extracted?.raw_text_snippet && renderSanitizedSnippet(statusObj.extracted.raw_text_snippet)}

      {}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-600">
        {statusObj.confidence !== undefined && (
          <div className="p-2 bg-slate-50 border rounded">
            Confidence: <strong>{Math.round((statusObj.confidence || 0) * 100)}%</strong>
          </div>
        )}
        {statusObj.phash && (
          <div className="p-2 bg-slate-50 border rounded truncate">
            pHash: <strong>{String(statusObj.phash).slice(0, 20)}</strong>
          </div>
        )}
        {statusObj.updatedAt && (
          <div className="p-2 bg-slate-50 border rounded">
            Updated: <strong>{new Date(statusObj.updatedAt).toLocaleTimeString()}</strong>
          </div>
        )}
      </div>

      {}
      {isReject && isTypeMismatch && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-700" />
            <div>
              <div className="font-medium text-slate-800">Warning</div>
              <div className="text-sm text-slate-700 mt-1">
                The uploaded document does <strong>not</strong> match the selected type.
                Example: you selected <strong>PAN</strong> but the file looks like an <strong>AADHAAR</strong>.
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleRetry}
                  className="px-3 py-1 bg-slate-800 text-white rounded text-sm"
                >
                  Try again
                </button>

                <button
                  onClick={() => {
                    onReject && onReject({ hint: "CHANGE_SELECTION" });
                  }}
                  className="px-3 py-1 border rounded text-sm"
                >
                  Change selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {isReject && !isTypeMismatch && (
        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded">
          <div className="flex items-start gap-3">
            <XCircleIcon className="w-6 h-6 text-red-600" />
            <div>
              <div className="font-medium text-red-700">Upload rejected</div>
              <div className="text-sm text-slate-700 mt-1">{reasonText || "Validation failed"}</div>

              <div className="mt-3">
                <button
                  onClick={() => {
                    onReject && onReject({ retry: true });
                  }}
                  className="px-3 py-1 bg-slate-800 text-white rounded text-sm"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {isAccept && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-6 h-6 text-emerald-700" />
            <div>
              <div className="font-medium text-emerald-700">Document accepted</div>
              <div className="text-sm text-slate-700 mt-1">You can proceed to the selfie step.</div>
            </div>
          </div>
        </div>
      )}

      {}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </motion.div>
  );
}
