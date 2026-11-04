// Exercise the real contact handler without network access or a browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'site.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const id of ['contactForm', 'cf-status', 'cf-submit', 'navbar', 'navLinks']) {
  assert.ok(html.includes('id="' + id + '"'), 'Missing element: ' + id);
}
assert.match(html, /src="site\.js\?[^"\s]+"/, 'Keep script cache version');
assert.match(html, /action="https:\/\/formsubmit\.co\/andrew@andrewjourdan\.com"/);

async function scenario(kind) {
  let handler, reset = false, requests = 0, prevented = false;
  const status = { className: '', innerHTML: '' };
  const button = { disabled: false, innerHTML: 'Send message', textContent: '' };
  const form = {
    addEventListener: (event, fn) => { assert.equal(event, 'submit'); handler = fn; },
    reset: () => { reset = true; }
  };
  const generic = { addEventListener() {}, classList: { toggle() {} } };
  const elements = { contactForm: form, 'cf-status': status, 'cf-submit': button };
  const data = { name: 'Test', email: 'test@example.com', message: 'Test', _honey: kind === 'honeypot' ? 'bot' : '' };
  const sandbox = {
    document: {
      getElementById: id => elements[id] || generic,
      querySelectorAll: () => [], querySelector: () => generic
    },
    window: { addEventListener() {} },
    IntersectionObserver: class { observe() {} },
    FormData: class { constructor() { return Object.entries(data); } },
    setTimeout: fn => fn(),
    fetch: async (url, options) => {
      requests++;
      assert.equal(url, 'https://formsubmit.co/ajax/andrew@andrewjourdan.com');
      assert.equal(options.method, 'POST');
      assert.deepEqual(JSON.parse(options.body), data);
      if (kind === 'network') throw new Error('Offline');
      return { ok: kind !== 'http', json: async () => ({ success: kind === 'success' ? 'true' : false }) };
    }
  };
  vm.runInNewContext(source, sandbox, { filename: 'site.js', timeout: 1000 });
  await handler({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(requests, kind === 'honeypot' ? 0 : 1);
  assert.equal(button.disabled, false);
  if (['success', 'honeypot'].includes(kind)) {
    assert.match(status.className, /success/); assert.equal(reset, true);
  } else {
    assert.match(status.className, /error/); assert.equal(reset, false);
    assert.match(status.innerHTML, /mailto:andrew@andrewjourdan\.com/);
  }
  assert.equal(button.innerHTML, 'Send message');
}
(async () => {
  for (const kind of ['success', 'http', 'service', 'network', 'honeypot']) await scenario(kind);
  console.log('PASS: contact success, HTTP failure, service failure, network failure, honeypot and email fallback');
})().catch(error => { console.error(error); process.exitCode = 1; });
