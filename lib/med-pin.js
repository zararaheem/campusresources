// Server-only helpers for the Medication Management PIN.
// Kept separate from lib/med.js (which the client bundle imports) so node:crypto
// never reaches the browser. The PIN is stored only as a salted scrypt hash.
import crypto from 'node:crypto';

// Default PIN seeded for a fresh install. Change it from the admin UI — it is
// intentionally the familiar demo value, so do not treat it as secret.
export const DEFAULT_MED_PIN = '724791';

export function hashPin(pin, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(String(pin ?? ''), s, 32).toString('hex');
  return `${s}:${h}`;
}

export function verifyPin(pin, stored) {
  if (!stored || !String(stored).includes(':')) return false;
  const salt = String(stored).split(':')[0];
  const candidate = hashPin(pin, salt);
  const a = Buffer.from(candidate);
  const b = Buffer.from(String(stored));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Reasonable PIN: 4–10 digits.
export function validPinFormat(pin) {
  return /^\d{4,10}$/.test(String(pin || ''));
}
