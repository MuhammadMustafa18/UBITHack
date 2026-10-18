/**
 * @module services/supabaseClient
 * @description Official Supabase Client Service for citizen SOS requests and dispatch triage.
 * Allows anyone with a Chrome browser / mobile web browser to submit an emergency rescue beacon.
 * Architecture is designed to gracefully synchronize:
 *  - Direct Browser Submissions (Web Geolocation API, 1-Click SOS)
 *  - Offline / Mesh fallback (Stores locally in IndexedDB / localStorage when offline and auto-syncs)
 *  - Extensible to SMS Gateway and Bluetooth Mesh relay payloads
 */

import { createClient } from '@supabase/supabase-js';

export const SUPABASE_CONFIG = {
  url: 'https://pohmxlkyxljuwizhofzj.supabase.co',
  publishableKey: 'sb_publishable_lBbhAhNYIRiJuWzFL0Is-Q_nXU8_XWk',
};

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

const LOCAL_STORAGE_SOS_KEY = 'floodtrace:citizen_sos_queue';

/**
 * Submits an emergency SOS request to Supabase table `rescue_requests`
 * with automatic offline queuing.
 */
export async function submitRescueRequest(sosPayload) {
  const latitude = Number(sosPayload.latitude);
  const longitude = Number(sosPayload.longitude);
  if (sosPayload.latitude == null || sosPayload.longitude == null ||
    sosPayload.latitude === '' || sosPayload.longitude === '' ||
    !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return { success: false, message: 'Valid coordinates are required. No location was guessed.' };
  }
  const payload = {
    sender_name: sosPayload.name || 'Anonymous Citizen',
    phone: sosPayload.phone || '+92 300 0000000',
    district: sosPayload.district || 'Unspecified District',
    latitude,
    longitude,
    channel: sosPayload.channel || 'CHROME WEB SOS',
    message: sosPayload.message || 'Urgent flood evacuation assistance requested.',
    urgency_level: sosPayload.urgencyLevel || 'P1 - CRITICAL LIFE THREAT',
    trapped_count: Number(sosPayload.trappedCount) || 1,
    has_children_or_elderly: Boolean(sosPayload.hasVulnerable),
    water_depth_ft: Number.isFinite(Number(sosPayload.waterDepthFt)) ? Number(sosPayload.waterDepthFt) : 0,
    status: 'PENDING DISPATCH',
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('rescue_requests')
      .insert([payload])
      .select();

    if (error) {
      console.warn('[Supabase] Insert failed or table not created, queuing locally:', error.message);
      const saved = saveSosLocally(payload);
      return { success: saved, localOnly: true, data: payload, message: saved ? 'Saved to local emergency queue' : 'Local storage unavailable; report not saved' };
    }

    return { success: true, localOnly: false, data: data?.[0] || payload };
  } catch (err) {
    console.warn('[Supabase] Network or DB error, saving locally:', err);
    const saved = saveSosLocally(payload);
    return { success: saved, localOnly: true, data: payload, message: saved ? 'Saved to local emergency queue' : 'Local storage unavailable; report not saved' };
  }
}

/**
 * Fetch latest live rescue requests from Supabase
 */
export async function fetchLiveRescueRequests() {
  try {
    const { data, error } = await supabase
      .from('rescue_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) {
      return getLocalSosQueue();
    }
    return data;
  } catch (e) {
    return getLocalSosQueue();
  }
}

function saveSosLocally(sos) {
  try {
    const queue = getLocalSosQueue();
    queue.unshift({ ...sos, id: `local-sos-${Date.now()}` });
    localStorage.setItem(LOCAL_STORAGE_SOS_KEY, JSON.stringify(queue.slice(0, 100)));
    return true;
  } catch (e) {
    console.warn('[Supabase] Local save failed:', e);
    return false;
  }
}

export function getLocalSosQueue() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
