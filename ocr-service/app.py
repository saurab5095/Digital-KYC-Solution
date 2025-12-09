import os
import io
import time
import re
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from PIL import Image, UnidentifiedImageError
import numpy as np
import cv2
import pytesseract
import imagehash

app = FastAPI(title="OCR & Image Quality Service")

class ValidationResult(BaseModel):
    accepted: bool
    code: str
    reason: Optional[str] = None
    detected_type: Optional[str] = None
    detected_id: Optional[str] = None
    extracted: Optional[dict] = None
    confidence: Optional[float] = None
    phash: Optional[str] = None
    processing_ms: Optional[int] = None


def read_image_bytes(file_bytes: bytes) -> Image.Image:
    return Image.open(io.BytesIO(file_bytes)).convert("RGB")


def variance_of_laplacian_cv2(gray: np.ndarray) -> float:
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def compute_phash(img: Image.Image) -> str:
    return str(imagehash.phash(img))


def run_ocr_text(img: Image.Image) -> dict:
    try:
        text = pytesseract.image_to_string(img, lang="eng")
    except Exception:
        text = ""

    try:
        data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
    except Exception:
        data = None

    return {"text": text, "data": data}


PAN_RE = re.compile(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b")
AADHAAR_RE = re.compile(r"(\d{4}\s?\d{4}\s?\d{4})")
PASSPORT_RE = re.compile(r"\b([A-Z]\d{7})\b", re.I)


def parse_pan_from_text(text: str) -> Optional[str]:
    if not text:
        return None
    m = PAN_RE.search(text.replace(" ", "").upper())
    return m.group(1) if m else None


def parse_aadhaar_from_text(text: str) -> Optional[str]:
    if not text:
        return None
    m = AADHAAR_RE.search(text)
    return m.group(1).replace(" ", "") if m else None


def parse_passport_from_text(text: str) -> Optional[str]:
    if not text:
        return None
    m = PASSPORT_RE.search(text.replace(" ", ""))
    return m.group(1).upper() if m else None



@app.post("/analyze-document", response_model=ValidationResult)
async def analyze_document(file: UploadFile = File(...)):
    start = time.time()

    try:
        raw = await file.read()
        pil = read_image_bytes(raw)
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Invalid image format")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading image: {e}")

    np_img = np.array(pil)

    if np_img.ndim == 3:
        gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)
    else:
        gray = np_img

    try:
        var_lap = variance_of_laplacian_cv2(gray)
    except Exception:
        var_lap = 0

    BLUR_THRESHOLD = float(os.getenv("BLUR_THRESHOLD", 110.0))

    if var_lap < BLUR_THRESHOLD:
        return ValidationResult(
            accepted=False,
            code="BLUR",
            reason=f"Image too blurry (variance={var_lap:.1f})",
            phash=compute_phash(pil),
            processing_ms=int((time.time() - start) * 1000)
        )

    ocr = run_ocr_text(pil)
    text = ocr.get("text", "") or ""

    pan = parse_pan_from_text(text)
    aadhaar = parse_aadhaar_from_text(text)
    passport = parse_passport_from_text(text)

    detected_type = "unknown"
    detected_id = None

    if pan:
        detected_type = "pan"
        detected_id = pan
    elif aadhaar:
        detected_type = "aadhaar"
        detected_id = aadhaar
    elif passport:
        detected_type = "passport"
        detected_id = passport
    elif len(text.strip()) > 100:
        detected_type = "document"

    phash_val = compute_phash(pil)

    accepted = detected_type in ("pan", "aadhaar", "passport", "document")
    reason = (
        f"Detected {detected_type.upper()}: {detected_id}"
        if detected_id else f"Detected type: {detected_type}"
    )

    return ValidationResult(
        accepted=accepted,
        code="OK" if accepted else "OCR_MISMATCH",
        reason=reason,
        detected_type=detected_type,
        detected_id=detected_id,
        extracted={"raw_text_snippet": text[:800]},
        confidence=0.7,
        phash=phash_val,
        processing_ms=int((time.time() - start) * 1000)
    )

@app.get("/")
def root():
    return {"status": "ocr-service running"}
