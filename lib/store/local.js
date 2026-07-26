import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DEFAULT_SECTIONS, LOCATIONS, seedEditorEmails } from '../seed';

// Dev-only file-backed store. On Vercel the filesystem is ephemeral, so this
// is for local preview only — production uses the Supabase driver.
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

function seedData() {
  const seededAt = '2026-03-01T00:00:00.000Z';
  const sections = DEFAULT_SECTIONS.map((s, i) => ({
    key: s.key,
    group_name: s.group,
    title: s.title,
    position: i,
    body: s.body,
    updated_at: seededAt,
  }));
  const locations = LOCATIONS.map((l) => ({
    id: crypto.randomUUID(),
    code: l.code,
    name: l.name,
    edition: l.edition || '',
    is_active: l.is_active !== false,
    fields: l.fields || {},
    overrides: l.overrides || {},
    academic_year: l.academic_year || '',
    calendar: l.calendar || [],
    sessions: l.sessions || [],
    calendar_template: l.calendar_template || '',
    updated_at: seededAt,
  }));
  const editors = seedEditorEmails().map((email) => ({
    email,
    role: 'super',
    locations: [],
    added_by: 'seed',
    created_at: new Date(0).toISOString(),
  }));
  return { sections, locations, editors };
}

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch {
    // fall through to reseed
  }
  const seeded = seedData();
  save(seeded);
  return seeded;
}

function save(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function mutate(fn) {
  const data = load();
  const result = fn(data);
  save(data);
  return result;
}

export function createLocalStore() {
  return {
    driver: 'local',

    async ensureSeeded() {
      load();
    },

    async listSections() {
      return load().sections.slice().sort((a, b) => a.position - b.position);
    },
    async updateSection(key, patch) {
      return mutate((d) => {
        const s = d.sections.find((x) => x.key === key);
        if (!s) return null;
        Object.assign(s, patch, { updated_at: new Date().toISOString() });
        return s;
      });
    },

    async listLocations() {
      return load().locations.slice().sort((a, b) => a.code.localeCompare(b.code));
    },
    async getLocationByCode(code) {
      return load().locations.find((l) => l.code === code && l.is_active) || null;
    },
    async getLocation(id) {
      return load().locations.find((l) => l.id === id) || null;
    },
    async createLocation({ code, name, edition, fields }) {
      return mutate((d) => {
        if (d.locations.some((l) => l.code === code)) {
          throw new Error('A location with that code already exists.');
        }
        const loc = {
          id: crypto.randomUUID(),
          code,
          name: name || code,
          edition: edition || '',
          is_active: true,
          fields: fields || {},
          overrides: {},
          academic_year: '',
          calendar: [],
          sessions: [],
          calendar_template: '',
          updated_at: new Date().toISOString(),
        };
        d.locations.push(loc);
        return loc;
      });
    },
    async updateLocation(id, patch) {
      return mutate((d) => {
        const l = d.locations.find((x) => x.id === id);
        if (!l) return null;
        if (patch.code && patch.code !== l.code && d.locations.some((x) => x.code === patch.code)) {
          throw new Error('A location with that code already exists.');
        }
        Object.assign(l, patch, { updated_at: new Date().toISOString() });
        return l;
      });
    },
    async deleteLocation(id) {
      return mutate((d) => {
        d.locations = d.locations.filter((l) => l.id !== id);
        return true;
      });
    },
    async setOverride(id, sectionKey, ov) {
      return mutate((d) => {
        const l = d.locations.find((x) => x.id === id);
        if (!l) return null;
        l.overrides = l.overrides || {};
        if (!ov || (ov.body == null && ov.title == null && !ov.hidden)) {
          delete l.overrides[sectionKey];
        } else {
          l.overrides[sectionKey] = ov;
        }
        return l;
      });
    },

    async listEditors() {
      return load().editors.slice().sort((a, b) => a.email.localeCompare(b.email));
    },
    async getEditor(email) {
      if (!email) return null;
      return load().editors.find((e) => e.email === email.toLowerCase()) || null;
    },
    async isEditor(email) {
      if (!email) return false;
      return load().editors.some((e) => e.email === email.toLowerCase());
    },
    async addEditor(email, addedBy, role = 'location', locations = []) {
      return mutate((d) => {
        const e = email.toLowerCase();
        const existing = d.editors.find((x) => x.email === e);
        if (existing) {
          existing.role = role;
          existing.locations = locations;
        } else {
          d.editors.push({ email: e, role, locations, added_by: addedBy || 'unknown', created_at: new Date().toISOString() });
        }
        return true;
      });
    },
    async removeEditor(email) {
      return mutate((d) => {
        d.editors = d.editors.filter((x) => x.email !== email.toLowerCase());
        return true;
      });
    },
  };
}
