import { createClient } from '@supabase/supabase-js';
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
      }));
      await sb.from('locations').upsert(rows, { onConflict: 'code' });
    }

    const emails = seedEditorEmails();
    if (emails.length) {
      const rows = emails.map((email) => ({ email, added_by: 'seed' }));
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

    async listEditors() {
      const { data } = await sb.from('editors').select('*').order('email');
      return data || [];
    },
    async isEditor(email) {
      if (!email) return false;
      const { data } = await sb.from('editors').select('email').eq('email', email.toLowerCase()).maybeSingle();
      return !!data;
    },
    async addEditor(email, addedBy) {
      await sb.from('editors').upsert({ email: email.toLowerCase(), added_by: addedBy || 'unknown' }, { onConflict: 'email' });
      return true;
    },
    async removeEditor(email) {
      await sb.from('editors').delete().eq('email', email.toLowerCase());
      return true;
    },
  };
}
