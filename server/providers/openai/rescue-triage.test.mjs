import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import test from 'node:test';
import { handleRescueTriage } from './rescue-triage.js';

async function request(body, method = 'POST') {
  const req = new PassThrough();
  req.method = method;
  req.headers = {};
  req.socket = { remoteAddress: '127.0.0.1' };
  const res = { setHeader() {}, end(text) { this.body = JSON.parse(text); } };
  const done = handleRescueTriage(req, res);
  req.end(typeof body === 'string' ? body : JSON.stringify(body));
  await done;
  return res;
}

test('triage validates requests and degrades without a key', async () => {
  const oldKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    assert.equal((await request({}, 'GET')).statusCode, 405);
    assert.equal((await request('{')).statusCode, 400);
    assert.equal((await request({ message: '' })).statusCode, 400);
    assert.equal((await request({ message: 'x'.repeat(2001) })).statusCode, 400);
    assert.equal((await request('x'.repeat(13000))).statusCode, 413);
    const response = await request({ message: 'Bachay pani mein phansay hain' });
    assert.equal(response.statusCode, 503);
    assert.match(response.body.error, /manually/);
  } finally {
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});

test('triage accepts structured fields and rejects invalid or failed provider output', async (t) => {
  const oldKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-only-not-a-real-key';
  let output = { danger: 'life', resource: 'boat', vulnerable: true };
  let ok = true;
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const payload = JSON.parse(options.body);
    assert.equal(payload.text.format.strict, true);
    assert.equal(payload.store, false);
    return { ok, json: async () => ({ output: [{ content: [{ type: 'output_text', text: JSON.stringify(output) }] }] }) };
  });
  try {
    assert.deepEqual((await request({ message: 'Children trapped in floodwater' })).body, output);
    output = { danger: 'life', resource: 'invented-helicopter', vulnerable: true };
    assert.equal((await request({ message: 'Test report' })).statusCode, 502);
    ok = false;
    assert.equal((await request({ message: 'Test report' })).statusCode, 502);
  } finally {
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldKey;
  }
});
