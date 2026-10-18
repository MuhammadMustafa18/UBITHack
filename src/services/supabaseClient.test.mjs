import assert from 'node:assert/strict';
import test from 'node:test';
import { supabase, submitRescueRequest } from './supabaseClient.js';

test('SOS query falls back locally, preserves zero coordinates and reports storage failure', async (t) => {
  const previousStorage = globalThis.localStorage;
  const saved = new Map();
  globalThis.localStorage = { getItem: (key) => saved.get(key) || null,
    setItem: (key, value) => saved.set(key, value) };
  let calls = 0;
  t.mock.method(console, 'warn', () => {});
  t.mock.method(supabase, 'from', (table) => {
    assert.equal(table, 'rescue_requests');
    calls += 1;
    return { insert: () => ({ select: async () => ({ error: { message: 'offline fixture' } }) }) };
  });
  try {
    const result = await submitRescueRequest({ latitude: 0, longitude: 0, message: 'Exercise' });
    assert.equal(result.success, true);
    assert.equal(result.localOnly, true);
    assert.equal(result.data.latitude, 0);
    assert.equal(result.data.longitude, 0);
    assert.equal(JSON.parse([...saved.values()][0]).length, 1);
    globalThis.localStorage.setItem = () => { throw new Error('Quota exceeded'); };
    assert.equal((await submitRescueRequest({ latitude: 34, longitude: 71 })).success, false);
    const before = calls;
    assert.equal((await submitRescueRequest({ latitude: '', longitude: 71 })).success, false);
    assert.equal(calls, before);
  } finally {
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }
});
