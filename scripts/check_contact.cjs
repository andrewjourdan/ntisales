// Exercise the real contact handler without network access or a browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'site.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const CONTACT = 'hnahmias@ntisales.com';

for (const id of ['contactForm', 'cf-status', 'cf-submit', 'navbar', 'navLinks']) {
  assert.ok(html.includes('id="' + id + '"'), 'Missing element: ' + id);
}
assert.match(html, /src="site\.js\?[^"\s]+"/, 'Keep script cache version');
assert.ok(html.includes('mailto:' + CONTACT), 'Page must link to ' + CONTACT);
assert.ok(!/andrewjourdan/.test(html), 'NTI page must not reference andrewjourdan.com addresses');
assert.ok(!/workers\.dev|formsubmit/i.test(html), 'No form backend should be referenced');
assert.ok(html.includes("connect-src 'none'") && html.includes("form-action 'none'"), 'CSP should allow no network form submission');
assert.ok(html.includes('Nothing is sent until you press Send'), 'Keep the email-app disclosure');

function scenario(kind) {
  let handler, prevented = false;
  const status = { className: '', innerHTML: '' };
  const form = { addEventListener: (event, fn) => { assert.equal(event, 'submit'); handler = fn; } };
  const generic = { addEventListener() {}, classList: { toggle() {} } };
  const elements = { contactForm: form, 'cf-status': status };
  const data = {
    name: 'Test Person', company: 'Café & Co', email: 'test@example.com',
    message: 'Line one\nLine two? 100% & more', _honey: kind === 'honeypot' ? 'bot' : ''
  };
  const win = { addEventListener() {}, location: { href: '' } };
  const sandbox = {
    document: { getElementById: id => elements[id] || generic, querySelectorAll: () => [], querySelector: () => generic },
    window: win,
    IntersectionObserver: class { observe() {} },
    FormData: class { constructor() { return Object.entries(data); } },
    setTimeout: () => 1,
    encodeURIComponent
  };
  vm.runInNewContext(source, sandbox, { filename: 'site.js', timeout: 1000 });
  handler({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  if (kind === 'honeypot') {
    assert.equal(win.location.href, '', 'Honeypot must not open an email');
    assert.match(status.className, /error/);
    return;
  }
  const href = win.location.href;
  assert.ok(href.startsWith('mailto:' + CONTACT + '?'), 'Email must be addressed to ' + CONTACT);
  const query = new URLSearchParams(href.slice(href.indexOf('?') + 1).replace(/\+/g, '%2B'));
  assert.equal(query.get('subject'), 'NTI Sales inquiry from Café & Co');
  const body = query.get('body');
  for (const part of ['Name: Test Person', 'Company: Café & Co', 'Email: test@example.com', 'Line two? 100% & more']) {
    assert.ok(body.includes(part), 'Body missing: ' + part);
  }
  assert.match(status.className, /success/);
  assert.ok(status.innerHTML.includes(CONTACT));
}

scenario('send');
scenario('honeypot');
console.log('PASS: contact form opens an email to ' + CONTACT + ', honeypot blocks bots, no andrewjourdan.com or form backend references');
