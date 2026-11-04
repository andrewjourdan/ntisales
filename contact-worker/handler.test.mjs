import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle } from './handler.mjs';

const fields = { name: 'Visitor', company: 'Example', email: 'visitor@example.com', message: 'Inquiry with Unicode café ✓' };
const request = (data = fields, origin = 'https://ntisales.com') => new Request('https://contact.example/contact', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' }, body: JSON.stringify(data),
});
const makeEmail = (from, to, raw) => ({ from, to, raw });
test('accepts valid inquiry, fixes recipient, preserves Unicode and Reply-To', async () => {
  const sent = [];
  const env = { CONTACT_LIMIT: { limit: async () => ({ success: true }) }, EMAIL: { send: async m => sent.push(m) } };
  const result = await handle(request(), env, makeEmail);
  assert.equal(result.status, 200);
  assert.equal((await result.json()).success, true);
  assert.equal(sent[0].to, 'andrew@andrewjourdan.com');
  assert.match(sent[0].raw, /Reply-To: visitor@example.com/);
  assert.match(Buffer.from(sent[0].raw.split('\r\n\r\n')[1], 'base64').toString(), /café ✓/);
});
test('rejects invalid inputs and disallowed origins without sending', async () => {
  let sent = 0;
  const env = { CONTACT_LIMIT: { limit: async () => ({ success: true }) }, EMAIL: { send: async () => sent++ } };
  assert.equal((await handle(request(fields, 'https://other.example'), env, makeEmail)).status, 403);
  for (const data of [{...fields, email: 'bad\r\nBcc: other@example.com'}, {...fields, name: ''}, {...fields, message: ''}, {...fields, _honey: 'bot'}]) {
    assert.equal((await handle(request(data), env, makeEmail)).status, 400);
  }
  assert.equal((await handle(request({...fields, message: 'x'.repeat(20000)}), env, makeEmail)).status, 413);
  assert.equal(sent, 0);
});
test('rate limits and delivery failures never report success', async () => {
  const env = { CONTACT_LIMIT: { limit: async () => ({ success: false }) }, EMAIL: { send: async () => { throw Error('Unavailable'); } } };
  assert.equal((await handle(request(), env, makeEmail)).status, 429);
  env.CONTACT_LIMIT.limit = async () => ({ success: true });
  const result = await handle(request(), env, makeEmail);
  assert.equal(result.status, 503);
  assert.equal((await result.json()).success, false);
});
test('preflight permits the production site', async () => {
  const result = await handle(new Request('https://contact.example/contact', { method: 'OPTIONS', headers: { Origin: 'https://ntisales.com' } }), {}, makeEmail);
  assert.equal(result.status, 204);
  assert.equal(result.headers.get('Access-Control-Allow-Origin'), 'https://ntisales.com');
});
