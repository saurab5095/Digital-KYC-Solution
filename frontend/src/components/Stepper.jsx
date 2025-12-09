import React from 'react';

const steps = [
  { id: 1, title: 'Document' },
  { id: 2, title: 'Selfie' },
  { id: 3, title: 'Finish' }
];

export default function Stepper({ step = 1 }) {
  return (
    <div className="flex items-center gap-4">
      {steps.map((s, idx) => {
        const active = s.id === step;
        const done = s.id < step;
        return (
          <div key={s.id} className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${done ? 'bg-emerald-600 text-white' : active ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700'}`}>
              {done ? '✓' : s.id}
            </div>
            <div className="hidden sm:block">
              <div className={`text-sm ${active ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{s.title}</div>
            </div>
            {idx < steps.length - 1 && (
              <div className="w-10 h-px bg-slate-200 mx-3 hidden md:block" />
            )}
          </div>
        );
      })}
    </div>
  );
}
