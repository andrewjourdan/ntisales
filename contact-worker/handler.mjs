const ORIGINS = new Set(['https://ntisales.com', 'https://www.ntisales.com']);
const RECIPIENT = 'andrew@andrewjourdan.com';
const SENDER = 'contact@andrewjourdan.com';
const MAX_BYTES = 16384;

function response(origin, body, status = 200, extra = {}) {
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store', 'Vary': 'Origin', ...extra,
  }});
}

export async function handle(request, env, makeEmail) {
  const url = new URL(request.url);
  if (url.pathname === '/health' && request.method === 'GET') {
    return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
  }
  const origin = request.headers.get('Origin') || '';
  if (url.pathname !== '/contact') return new Response('Not found', { status: 404 });
  if (!ORIGINS.has(origin)) return new Response('Forbidden', { status: 403 });
  if (request.method === 'OPTIONS') return response(origin, null, 204);
  if (request.method !== 'POST') return response(origin, { success: false }, 405, { Allow: 'POST, OPTIONS' });
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.startsWith('application/json')) return response(origin, { success: false, message: 'Unsupported request format.' }, 415);
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return response(origin, { success: false }, 403);
  const limit = await env.CONTACT_LIMIT.limit({ key: ip });
  if (!limit.success) return response(origin, { success: false, message: 'Please wait a minute before trying again.' }, 429, { 'Retry-After': '60' });
  let data;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw Error('Empty body');
    const chunks = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) { await reader.cancel(); return response(origin, { success: false, message: 'Message is too long.' }, 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('Invalid data');
  } catch { return response(origin, { success: false, message: 'Please check the form and try again.' }, 400); }
  if (typeof data._honey === 'string' && data._honey.trim()) return response(origin, { success: false, message: 'Please reload the page and try again.' }, 400);
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const company = typeof data.company === 'string' ? data.company.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  if (!name || name.length > 150 || company.length > 200 || !message || message.length > 8000 ||
      email.length > 254 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email) || /[\r\n]/.test(name + company + email)) {
    return response(origin, { success: false, message: 'Please enter a name, valid email address and a message of up to 8,000 characters.' }, 400);
  }
  const id = crypto.randomUUID();
  const text = `New NTI Sales website inquiry\n\nName: ${name}\nCompany: ${company || '(not provided)'}\nEmail: ${email}\n\n${message}\n\nReference: ${id}`;
  const body = btoa(String.fromCharCode(...new TextEncoder().encode(text))).match(/.{1,76}/g).join('\r\n');
  const raw = [
    `From: NTI Sales Contact <${SENDER}>`, `To: ${RECIPIENT}`, `Reply-To: ${email}`,
    'Subject: New inquiry from ntisales.com', 'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64',
    `Message-ID: <${id}@andrewjourdan.com>`, `Date: ${new Date().toUTCString()}`, '', body,
  ].join('\r\n');
  try {
    await env.EMAIL.send(makeEmail(SENDER, RECIPIENT, raw));
    console.log(JSON.stringify({ event: 'contact_accepted', reference: id }));
    return response(origin, { success: true, reference: id });
  } catch (error) {
    console.error(JSON.stringify({ event: 'contact_failed', reference: id, code: error?.code || 'EMAIL_SEND_FAILED' }));
    return response(origin, { success: false, message: 'We could not send your message. Please email us directly or try again later.', reference: id }, 503);
  }
}
