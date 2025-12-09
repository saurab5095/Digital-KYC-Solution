// src/utils/attempts.js
// Lightweight localStorage-backed attempt counters used by demo UI.
// Keys: "kyc_attempts" -> { uploadDoc: 0, selfie: 0, ... }

const STORAGE_KEY = "kyc_attempts";

function safeParse(v) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export function getAttempts() {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return safeParse(raw) || {};
}

export function incrementAttempt(name) {
  if (typeof window === "undefined") return 0;
  const attempts = getAttempts();
  attempts[name] = (attempts[name] || 0) + 1;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
  } catch (e) {
    // ignore storage errors
  }
  return attempts[name];
}

/**
 * resetAttempts()
 * - If called with no args -> clears all counters
 * - If called with a key name -> clears that single counter
 */
export function resetAttempts(name) {
  if (typeof window === "undefined") return;
  if (!name) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    return;
  }
  const attempts = getAttempts();
  if (attempts[name] !== undefined) {
    delete attempts[name];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
    } catch (e) {}
  }
}
