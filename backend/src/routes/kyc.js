const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const kycController = require('../controllers/kycController');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/upload-doc', upload.single('file'), kycController.handleUpload);

router.post('/upload-selfie', upload.single('selfie'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        ok: false,
        error: "NO_SELFIE",
        message: "No selfie provided",
        attemptsStage: "selfie"
      });
    }

    if (file.size > 3 * 1024 * 1024) {
      try { fs.unlinkSync(file.path); } catch {}
      return res.status(400).json({
        ok: false,
        error: "SELFIE_TOO_LARGE",
        message: "Selfie image size is too large",
        attemptsStage: "selfie"
      });
    }

    if (Math.random() < 0.25) {
      try { fs.unlinkSync(file.path); } catch {}
      return res.status(400).json({
        ok: false,
        error: "FACE_MISMATCH",
        message: "Face not detected or mismatch",
        attemptsStage: "selfie"
      });
    }

    const taskId = "task_selfie_" + Date.now();
    setTimeout(() => {
      console.log("Selfie validation done for", taskId);
    }, 1500);

    return res.json({
      ok: true,
      taskId,
      message: "Selfie received",
      attemptsStage: "selfie"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      ok: false,
      error: "SERVER_ERROR",
      message: "Unexpected server error",
      attemptsStage: "selfie"
    });
  }
});

router.get('/status/:taskId', kycController.getStatus);

module.exports = router;
