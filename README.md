# NTI Sales and Marketing LLC

Website: https://ntisales.com/

## Local preview

This is a static website with no package installation or build step.
Run `python3 -m http.server 8000` from the repository root, then open
http://localhost:8000/. Stop the preview with Ctrl+C.

## Validation

Run `python3 scripts/check_site.py` with Python 3.12 or newer. It checks the
homepage metadata, local links and files, JSON-LD syntax, CNAME, sitemap and
robots.txt. GitHub Actions runs these checks on pull requests and pushes to main.

With Node.js 22 or newer, also run `node --check site.js` and
`node scripts/check_contact.cjs`. The contact checks confirm the form builds the
email to hnahmias@ntisales.com and that the honeypot blocks bots, without sending anything.

The contact form opens the visitor's email app with the inquiry addressed to
hnahmias@ntisales.com (subject, name, company, email and message pre-filled).
Nothing is sent until the visitor presses Send in their email app, and the site
has no form backend, Worker, API keys or third-party form service. All contact
links on the page also go to hnahmias@ntisales.com, which is hosted with the
domain's own mail service (Network Solutions MX records).

Update the `site.js` query string in index.html when changing that script to
refresh browser caches. Failed submissions retain the visitor's message.

## Publishing and maintenance

GitHub Pages publishes the root of main at https://ntisales.com/.
Keep CNAME, canonical metadata, robots.txt and sitemap.xml consistent.
Use a pull request, wait for Site checks to pass, then merge. Main should block
force pushes and deletion, and require the Site checks job. No second-person
approval is required for the sole maintainer. Merged branches are deleted automatically.

Before publishing, preview mobile and desktop layouts and exercise navigation
and contact controls. Automated checks do not validate external websites or inbox delivery.
Domain renewal, DNS and HTTPS settings require separate verification.

The existing LICENSE file governs use of this repository.
