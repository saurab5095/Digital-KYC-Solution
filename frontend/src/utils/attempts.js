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
