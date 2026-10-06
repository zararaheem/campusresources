import { createClient } from '@supabase/supabase-js';
import { medBaseKey, nextMedCode, assertMedRecord } from '../med';
import { hashPin, DEFAULT_MED_PIN } from '../med-pin';
import { DEFAULT_SECTIONS, LOCATIONS, seedEditorEmails } from '../seed';

// Production store backed by Supabase (Postgres). Uses the service-role key,
// server-side only. Requires the tables from supabase/schema.sql to exist.
export function createSupabaseStore() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sb = createClient(url, key, { auth: { persistSession: false } });

  let seedChecked = false;

  async function ensureSeeded() {
    if (seedChecked) return;
    seedChecked = true;

    const { count } = await sb.from('sections').select('key', { count: 'exact', head: true });
    if (!count) {
      const rows = DEFAULT_SECTIONS.map((s, i) => ({
        key: s.key,
        group_name: s.group,
        title: s.title,
        position: i,
        body: s.body,
      }));
      await sb.from('sections').upsert(rows, { onConflict: 'key' });
    }

    const { count: locCount } = await sb.from('locations').select('id', { count: 'exact', head: true });
    if (!locCount) {
      const rows = LOCATIONS.map((l) => ({
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
        extra_sections: l.extra_sections || [],
      }));
      await sb.from('locations').upsert(rows, { onConflict: 'code' });
    }

    const emails = seedEditorEmails();
    if (emails.length) {
      const rows = emails.map((email) => ({ email, added_by: 'seed', role: 'super', locations: [] }));
      await sb.from('editors').upsert(rows, { onConflict: 'email' });
    }
  }

  return {
    driver: 'supabase',
    ensureSeeded,

    async listSections() {
      await ensureSeeded();
      const { data } = await sb.from('sections').select('*').order('position');
      return data || [];
    },
    async updateSection(key, patch) {
      const { data } = await sb.from('sections').update({ ...patch, updated_at: new Date().toISOString() }).eq('key', key).select().single();
      return data;
    },

    async listLocations() {
      await ensureSeeded();
      const { data } = await sb.from('locations').select('*').order('code');
      return data || [];
    },
    async getLocationByCode(code) {
      await ensureSeeded();
      const { data } = await sb.from('locations').select('*').eq('code', code).eq('is_active', true).maybeSingle();
      return data || null;
    },
    async getLocation(id) {
      const { data } = await sb.from('locations').select('*').eq('id', id).maybeSingle();
      return data || null;
    },
    async createLocation({ code, name, edition, fields }) {
      const { data, error } = await sb
        .from('locations')
        .insert({ code, name: name || code, edition: edition || '', is_active: true, fields: fields || {}, overrides: {} })
        .select()
        .single();
      if (error) {
        if (error.code === '23505') throw new Error('A location with that code already exists.');
        throw new Error(error.message);
      }
      return data;
    },
    async updateLocation(id, patch) {
      const { data, error } = await sb
        .from('locations')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) {
        if (error.code === '23505') throw new Error('A location with that code already exists.');
        throw new Error(error.message);
      }
      return data;
    },
    async deleteLocation(id) {
      await sb.from('locations').delete().eq('id', id);
      return true;
    },
    async setOverride(id, sectionKey, ov) {
      const loc = await this.getLocation(id);
      if (!loc) return null;
      const overrides = { ...(loc.overrides || {}) };
      if (!ov || (ov.body == null && ov.title == null && !ov.hidden)) {
        delete overrides[sectionKey];
      } else {
        overrides[sectionKey] = ov;
      }
      return this.updateLocation(id, { overrides });
    },

    async addSignature(rec) {
      const { data, error } = await sb.from('signatures').insert(rec).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    async listSignatures({ code } = {}) {
      let q = sb.from('signatures').select('*').order('signed_at', { ascending: false });
      if (code) q = q.eq('location_code', code);
      const { data } = await q;
      return data || [];
    },

    async listEditors() {
      const { data } = await sb.from('editors').select('*').order('email');
      return data || [];
    },
    async getEditor(email) {
      if (!email) return null;
      const { data } = await sb.from('editors').select('*').eq('email', email.toLowerCase()).maybeSingle();
      return data || null;
    },
    async isEditor(email) {
      if (!email) return false;
      const { data } = await sb.from('editors').select('email').eq('email', email.toLowerCase()).maybeSingle();
      return !!data;
    },
    async addEditor(email, addedBy, role = 'location', locations = []) {
      await sb
        .from('editors')
        .upsert({ email: email.toLowerCase(), added_by: addedBy || 'unknown', role, locations }, { onConflict: 'email' });
      return true;
    },
    async removeEditor(email) {
      await sb.from('editors').delete().eq('email', email.toLowerCase());
      return true;
    },

    // ── Student medication records (staff-only) ───────────────────────────
    // Stored in the shared `nyc_med_records` table (same Supabase project the
    // newsletter app uses), so there is a single medical dataset — reached
    // only server-side through the service-role key, never a public key.
    async listMedRecords() {
      const { data } = await sb.from('nyc_med_records').select('*').order('last_key').order('code');
      return data || [];
    },
    async getMedRecord(code) {
      const { data } = await sb.from('nyc_med_records').select('*').eq('code', code).maybeSingle();
      return data || null;
    },
    async saveMedRecord(code, record) {
      assertMedRecord(record);
      const now = new Date().toISOString();
      const base = medBaseKey(record.last_name);
      if (code) {
        const { data, error } = await sb.from('nyc_med_records')
          .update({ ...record, last_key: base, updated_at: now })
          .eq('code', code).select().maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) throw new Error('not_found');
        return data.code;
      }
      // New record: generate the next free lastname-sN, retrying on the rare
      // race where two inserts pick the same code (unique-constraint collision).
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const { data: existing } = await sb.from('nyc_med_records')
          .select('code').like('code', `${base}-s%`);
        const newCode = nextMedCode(base, (existing || []).map((r) => r.code));
        const { error } = await sb.from('nyc_med_records')
          .insert({ code: newCode, last_key: base, ...record, updated_at: now });
        if (!error) return newCode;
        if (!/duplicate|unique|already exists/i.test(error.message)) throw new Error(error.message);
      }
      throw new Error('could_not_allocate_code');
    },
    async deleteMedRecord(code) {
      await sb.from('nyc_med_records').delete().eq('code', code);
      return true;
    },
    async getMedPinHash() {
      const { data } = await sb.from('nyc_med_settings').select('pin_hash').eq('id', 1).maybeSingle();
      // Fall back to the default PIN until a row is written, so a fresh install
      // is never locked out (the default is meant to be changed in the UI).
      return data?.pin_hash || hashPin(DEFAULT_MED_PIN);
    },
    async setMedPinHash(hash) {
      const { error } = await sb.from('nyc_med_settings')
        .upsert({ id: 1, pin_hash: hash }, { onConflict: 'id' });
      if (error) throw new Error(error.message);
      return true;
    },
  };
}
