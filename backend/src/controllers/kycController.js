const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const { phashDistance } = require('../utils/phash');
const { addPhash, getAllPhashes } = require('../utils/phashStore');

const tasks = {};

function createTask() {
  const id = 'task_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  tasks[id] = { status: 'PENDING', createdAt: Date.now() };
  return id;
}

function setTaskResult(taskId, accepted, reason, extras = {}) {
  tasks[taskId] = {
    status: accepted ? 'ACCEPT' : 'REJECT',
    reason: reason || (accepted ? 'OK' : 'Validation failed'),
    updatedAt: Date.now(),
    ...extras
  };
}

const PHASH_DUPLICATE_THRESHOLD = Number(process.env.PHASH_DUPLICATE_THRESHOLD || 8);

exports.handleUpload = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ ok:false, error: 'No file uploaded' });

    const selectedDocType = (req.body.docType || '').toString().trim().toLowerCase();

    const sizeLimit = 5 * 1024 * 1024;
    if (file.size > sizeLimit) {
      try { fs.unlinkSync(file.path); } catch {}
      return res.status(400).json({ ok:false, error: 'File too large. Max 5MB allowed.' });
    }

    const taskId = createTask();

    (async () => {
      try {
        const ocrUrl = process.env.OCR_URL || 'http://localhost:8001/analyze-document';
        const form = new FormData();
        form.append('file', fs.createReadStream(file.path), {
          filename: path.basename(file.path),
          contentType: file.mimetype || 'application/octet-stream'
        });

        const headers = form.getHeaders();
        const resp = await axios.post(ocrUrl, form, { headers, timeout: 30000 });
        const data = resp?.data;

        if (!data || typeof data !== 'object') {
          setTaskResult(taskId, false, 'OCR returned invalid response');
          return;
        }

        const detectedType = (data.detected_type || '').toString().toLowerCase();
        const detectedId = data.detected_id || null;

        let finalAccepted = Boolean(data.accepted);
        let finalReason = data.reason || null;
        let finalCode = data.code || null;

        if (selectedDocType) {
          const normalize = s => String(s || '').toLowerCase().replace(/\s+/g, '');
          const sel = normalize(selectedDocType);
          const det = normalize(detectedType);

          if (!det || det === 'unknown') {
            finalAccepted = false;
            finalCode = 'TYPE_MISMATCH';
            finalReason = `Could not detect document type (expected ${sel.toUpperCase()})`;
          } else if (sel !== det) {
            finalAccepted = false;
            finalCode = 'TYPE_MISMATCH';
            finalReason = `Type mismatch: expected ${sel.toUpperCase()} but detected ${det.toUpperCase()} (${detectedId || 'no id'})`;
          }
        }

        let isDuplicate = false;
        let closestDistance = Infinity;
        if (data.phash && typeof data.phash === 'string' && data.phash.trim().length > 0) {
          const previous = getAllPhashes() || [];
          for (const old of previous) {
            try {
              const dist = phashDistance(old, data.phash);
              if (typeof dist === 'number' && dist < closestDistance) closestDistance = dist;
              if (typeof dist === 'number' && dist <= PHASH_DUPLICATE_THRESHOLD) {
                isDuplicate = true;
                break;
              }
            } catch (e) {
            }
          }
          try { addPhash(data.phash); } catch (e) {}
        }

        if (isDuplicate) {
          finalAccepted = false;
          finalCode = 'DUPLICATE';
          finalReason = `Document too similar to previous upload (distance=${closestDistance})`;
        }

        setTaskResult(taskId, finalAccepted, finalReason || finalCode || null, {
          extracted: data.extracted || null,
          confidence: typeof data.confidence === 'number' ? data.confidence : null,
          phash: data.phash || null,
          detected_type: detectedType,
          detected_id: detectedId
        });

        console.info(`Task ${taskId} -> ${finalAccepted ? 'ACCEPT' : 'REJECT'} (${finalCode || finalReason})`);

      } catch (err) {
        console.error('OCR call failed for task', taskId, err?.message || err);
        setTaskResult(taskId, false, 'OCR service error');
      } finally {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
    })();

    return res.status(200).json({ ok:true, taskId, message: 'File received and queued for validation' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok:false, error: 'Server error' });
  }
};

exports.getStatus = (req, res) => {
  try {
    const t = tasks[req.params.taskId];
    if (!t) return res.status(404).json({ ok:false, error: 'Task not found' });
    return res.json({
      ok:true,
      taskId: req.params.taskId,
      status: t.status,
      reason: t.reason || null,
      extracted: t.extracted || null,
      detected_type: t.detected_type || null,
      detected_id: t.detected_id || null,
      updatedAt: t.updatedAt || null
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok:false, error: 'Server error' });
  }
};
