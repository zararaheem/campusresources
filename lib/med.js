// Shared helpers for the staff-only Medications admin feature.
// Medical data is reached ONLY through server-side API routes (service-role /
// local store) gated by the admin login — never a client key. These helpers
// hold the field list, the pick-list options, validation, and the automatic
// code generation (lastname-s1, -s2, …) so the local and Supabase stores
// behave identically.

export const MED_FIELDS = [
  'first_name', 'last_name', 'level', 'med', 'dose',
  'route', 'freq', 'time_of_day', 'storage', 'instructions', 'administered_by', 'notes',
];

export const MED_LEVELS = ['LL', 'L1', 'L2', 'MS', 'HS', 'Staff'];
export const MED_ROUTES = [
  'By mouth (tablet / capsule)', 'By mouth (liquid)', 'Inhaler',
  'Injection / auto-injector', 'Topical (skin)', 'Eye / ear drops',
  'Nasal spray', 'Other',
];
export const MED_FREQS = ['Every school day', 'Specific days', 'As needed', 'Emergency only'];

// Normalize a last name into the code base: lowercase, letters only.
export function medBaseKey(lastName) {
  return String(lastName || '').toLowerCase().replace(/[^a-z]/g, '');
}

// Smallest unused `base-sN` given the codes already in use.
export function nextMedCode(base, existingCodes) {
  const set = new Set(existingCodes || []);
  let n = 1;
  while (set.has(`${base}-s${n}`)) n += 1;
  return `${base}-s${n}`;
}

// Keep only known fields, trimmed to strings.
export function cleanMedRecord(input) {
  const r = {};
  for (const k of MED_FIELDS) r[k] = String(input?.[k] ?? '').trim();
  return r;
}

// Throws a known error code if the record isn't savable.
export function assertMedRecord(record) {
  if (!medBaseKey(record.last_name)) throw new Error('bad_last_name');
  if (!record.first_name || !record.med) throw new Error('missing_fields');
}

export const MED_ERRORS = new Set(['bad_last_name', 'missing_fields', 'not_found']);
