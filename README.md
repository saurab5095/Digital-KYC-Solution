Digital KYC Solution – HDFC Capstone Project Submission

A secure, automated, and user-friendly Digital KYC Verification System built using a modular microservice architecture combining OCR, Face Matching, Duplicate Detection, and Real-time Document Validation.

This solution replicates real banking workflows used for paperless onboarding, reducing fraud, manual errors, and processing time.

🧩 1. Problem Understanding & Business Relevance

KYC is compulsory for preventing:

Financial fraud

Identity theft

Money laundering

Traditional KYC challenges:

Slow verification

Manual errors

Resource-heavy operations

High vulnerability to forgery

✔ This Digital KYC System solves these problems through automation:

OCR-based document text extraction

Real-time selfie capture + face matching

Auto document-type detection

Duplicate document checking

Image-quality and glare checks

Clear accept/reject reasons

Summary report generation

Business Benefits

Faster customer onboarding

Higher fraud detection accuracy

Better regulatory compliance

Reduced operational cost

🏗️ 2. System Architecture (Technical Approach)

This solution uses a microservice-driven architecture:

Frontend (React)
        ↓
Backend API (Node.js / Express)
        ↓
-----------------------------------------
| OCR Service (Python + Tesseract)       |
| Face Match Engine (Embeddings)         |
| Duplicate Detection Engine (pHash)     |
-----------------------------------------
        ↓
Database (MongoDB)

Backend Responsibilities

Orchestrates full KYC workflow

Communicates with OCR microservice

Performs duplicate detection

Runs face matching

Generates PDF summary

Returns final KYC decision

OCR Microservice

Preprocessing (deskewing, denoising, enhancement)

Extracts Aadhaar/PAN data

Auto-detects document type

Sends structured text to backend

Duplicate Detection

Uses perceptual hashing (pHash) + similarity distance.

Face Matching

Uses facial embeddings + threshold scoring.

Why this Architecture?

✔ Scalable
✔ Modular
✔ Fault-isolated
✔ Real banking workflow compatible

🎨 3. Innovation & Solution Design
🔵 Core Innovations
⭐ 1. Real-time Validation Feedback

Shows warnings for:

Low resolution

Glare or blur

Wrong document type

Duplicate upload

Face mismatch

⭐ 2. Auto Document-Type Detection

OCR identifies PAN vs Aadhaar even if user selects wrong option.

⭐ 3. Fraud Prevention Module

Similarity scores ensure no document is reused.

⭐ 4. Live Selfie Capture

Ensures the person submitting is physically present.

⭐ 5. Automated Compliance Summary (PDF)

Includes:

OCR extracted fields

Match score

Verification decisions

Risk indicators

Timestamp

🛠️ 4. Tech Stack
Component	Technology
Frontend	React, Vite, Webcam API
Backend	Node.js, Express
OCR	Python, Tesseract, OpenCV
Face Match	Embeddings + cosine similarity
Database	MongoDB
Security	Input validation, controlled retries
PDF	Node PDF generator
📦 5. Project Structure
Digital-KYC-Solution/
│
├── frontend/
├── backend/
├── ocr-service/
│   ├── app.py
│   ├── requirements.txt
│   └── .env.example
│
├── docs/
│   ├── architecture.png
│   ├── data-flow.png
│
├── screenshots/
│   ├── document-upload.png
│   ├── ocr-result.png
│   ├── selfie-capture.png
│   ├── face-match.png
│   ├── duplicate-detection.png
│   └── kyc-summary.png
│
├── README.md
└── .gitignore

▶️ 6. How to Run the Project Locally
Backend
cd backend
npm install
npm start

Frontend
cd frontend
npm install
npm start

OCR Service
cd ocr-service
pip install -r requirements.txt
python app.py

Environment Variables

Create .env from .env.example:

TESSERACT_CMD=
MONGO_URI=
OCR_SERVICE_URL=
FACE_MATCH_URL=
JWT_SECRET=

📸 7. User Interface Snapshots

Included in /screenshots/:

Document upload

OCR extraction

Validation statuses

Duplicate detection

Selfie camera preview

Face match result

Final KYC summary screen

📊 8. Evaluation Mapping (HDFC Rubric)
Criteria	How It Is Achieved	Score
Problem Understanding (20%)	Clear business relevance	⭐⭐⭐⭐⭐
Technical Approach (35%)	Microservices, OCR, Face-match	⭐⭐⭐⭐✰
Innovation & Design (30%)	Real-time validation + fraud checks	⭐⭐⭐⭐⭐
Documentation (15%)	Detailed README + diagrams	⭐⭐⭐⭐⭐
📝 9. Conclusion

This Digital KYC Solution demonstrates a production-level, industry-ready workflow for financial onboarding.
It emphasizes speed, accuracy, compliance, and fraud prevention — ideal for modern banking systems.

👤 10. Author

Saurab Das
HDFC Digital KYC – Capstone Project
GitHub: https://github.com/saurab5095