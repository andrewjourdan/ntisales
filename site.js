
// Nav scroll effect
const nav = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

// Reveal on scroll
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
reveals.forEach(el => observer.observe(el));

// Active nav link
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const top = section.offsetTop - 120;
    if (scrollY >= top) current = section.getAttribute('id');
  });
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('href') === '#' + current) a.classList.add('active');
  });
});

// Contact form: sends via FormSubmit without leaving the page
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('cf-status');
const formButton = document.getElementById('cf-submit');
const FORM_ENDPOINT = contactForm.action;
const FALLBACK_EMAIL = 'andrew@andrewjourdan.com';

function showStatus(type, html) {
  formStatus.className = 'form-status show ' + type;
  formStatus.innerHTML = html;
}

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(contactForm));

  // Avoid claiming delivery for requests that are not sent.
  if (data._honey) {
    showStatus('error', 'Please reload the page and try again.');
    return;
  }

  const originalLabel = formButton.innerHTML;
  formButton.disabled = true;
  formButton.textContent = 'Sending…';
  formStatus.className = 'form-status';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json().catch(() => ({}));

    if (res.ok && (result.success === true || result.success === 'true')) {
      showStatus('success', 'Thank you &mdash; your inquiry has been received. We&rsquo;ll be in touch soon.');
      contactForm.reset();
    } else {
      throw new Error(result.message || 'Request failed');
    }
  } catch (err) {
    const detail = err.name === 'AbortError' ? 'The request timed out. Your message is still here.' : 'We could not send your message. Your message is still here.';
    showStatus('error', detail + ' Please email us directly at <a href="mailto:' + FALLBACK_EMAIL + '">' + FALLBACK_EMAIL + '</a>.');
  } finally {
    clearTimeout(timeout);
    formButton.disabled = false;
    formButton.innerHTML = originalLabel;
  }
});

document.querySelector('.mobile-toggle').addEventListener('click', () => document.getElementById('navLinks').classList.toggle('open'));
