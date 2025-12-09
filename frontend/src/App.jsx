import React, { useState } from 'react';
import Header from './components/Header';
import Stepper from './components/Stepper';
import StepUpload from './pages/StepUpload';
import StepSelfie from './pages/StepSelfie';
import PollStatus from './components/PollStatus';
import Hero from './components/Hero';

export default function App() {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    docType: '',
    docTaskId: null,
    selfieTaskId: null,
  });

  const [rejection, setRejection] = useState(null);


  const goNext = () => setStep(s => s + 1);
  const goBack = () => setStep(s => Math.max(1, s - 1));


  const handleUploaded = (taskId) => {
    setForm(prev => ({ ...prev, docTaskId: taskId }));
  };


  const onAccept = () => {
    setRejection(null);
    goNext(); 
  };

  const onReject = (status) => {
    if (status?.retry) {
      setRejection(null);
      setForm(prev => ({ ...prev, docTaskId: null }));
      return;
    }
    setRejection(status);
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {}
        <Hero subtitle="Follow the on-screen guidance for a successful scan." />

        <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
          <Stepper step={step} />

          <div className="mt-6">

            {}
            {step === 1 && (
              <>
                <div className="mt-6">
                  <StepUpload
                    form={form}
                    setForm={setForm}
                    onUploaded={handleUploaded}
                  />
                </div>

                {}
                {form.docTaskId && (
                  <div className="mt-4">
                    <div className="text-sm text-slate-600 mb-2">
                      Validation status
                    </div>

                    <div className="bg-gray-50 p-3 rounded">
                      <PollStatus
                        taskId={form.docTaskId}
                        onAccept={onAccept}
                        onReject={onReject}
                      />
                    </div>
                  </div>
                )}

                {}
                {rejection && !rejection.retry && (
                  <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded">
                    <strong>Rejected:</strong> {rejection.reason || "Unknown"}.
                    <div className="mt-1">
                      Tip: Improve lighting, ensure edges are visible,
                      or try a clearer scan.
                    </div>
                  </div>
                )}
              </>
            )}

            {}
            {step === 2 && (
              <>
                <h2 className="text-2xl font-semibold text-slate-800">
                  Real-time selfie
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Capture a clear selfie that matches your document photo.
                </p>

                <div className="mt-6">
                  <StepSelfie onNext={goNext} />
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={goBack}
                    className="px-4 py-2 border rounded text-slate-700"
                  >
                    Back
                  </button>
                </div>
              </>
            )}

            {}
            {step === 3 && (
              <div className="text-center py-12">
                {}
                <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm animate-fade-in">
                  <svg xmlns="http://www.w3.org/2000/svg"
                    className="w-12 h-12 text-emerald-600"
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                {}
                <h3 className="text-3xl font-semibold text-emerald-700 mt-6 animate-fade-in-delay">
                  KYC Verification Completed
                </h3>

                {}
                <p className="mt-2 text-slate-600 max-w-lg mx-auto animate-fade-in-delay">
                  Thank you for completing your Digital KYC.
                  Your details have been successfully verified.
                </p>

                {}
                <div className="mt-8 bg-white shadow-md rounded-xl p-6 border max-w-lg mx-auto animate-fade-in-slower">
                  <h4 className="text-lg font-medium text-slate-800 mb-3">Summary</h4>

                  <div className="text-left text-sm text-slate-600 space-y-2">
                    <p>• Document verification: <span className="text-emerald-600 font-medium">Completed</span></p>
                    <p>• Selfie verification: <span className="text-emerald-600 font-medium">Completed</span></p>
                    <p>• Risk checks: <span className="text-emerald-600 font-medium">Passed</span></p>
                  </div>
                </div>

                {}
                <div className="mt-10 flex flex-col gap-3 items-center animate-fade-in-slower">

                  <button
                    onClick={() => {
                      setStep(1);
                      setForm({
                        docType: '',
                        docTaskId: null,
                        selfieTaskId: null
                      });
                      setRejection(null);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                  >
                    Start New KYC
                  </button>

                  <button
                    className="text-blue-600 text-sm hover:underline"
                    onClick={() => {
                    
                      alert('Download not implemented yet — you can add a PDF generator endpoint.');
                    }}
                  >
                    Download KYC summary (PDF)
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}


