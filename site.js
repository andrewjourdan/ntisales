
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

// Contact form: opens the visitor's email app with the inquiry addressed to NTI
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('cf-status');
const CONTACT_EMAIL = 'hnahmias@ntisales.com';

function showStatus(type, html) {
  formStatus.className = 'form-status show ' + type;
  formStatus.innerHTML = html;
}

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(contactForm));
  if (data._honey) {
    showStatus('error', 'Please reload the page and try again.');
    return;
  }
  const clean = value => String(value || '').trim();
  const name = clean(data.name);
  const company = clean(data.company);
  const email = clean(data.email);
  const message = clean(data.message);
  const subject = 'NTI Sales inquiry' + (company ? ' from ' + company : (name ? ' from ' + name : ''));
  const body = 'Name: ' + name + '\nCompany: ' + (company || '(not provided)') + '\nEmail: ' + email + '\n\n' + message;
  window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  showStatus('success', 'Your email app should open with this message addressed to ' + CONTACT_EMAIL + '. Press Send there to deliver it. If nothing opened, email us directly at <a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a>.');
});

document.querySelector('.mobile-toggle').addEventListener('click', () => document.getElementById('navLinks').classList.toggle('open'));
