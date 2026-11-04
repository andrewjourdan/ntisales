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
`node scripts/check_contact.cjs`. The contact checks simulate success, service
failure, network failure and the honeypot without sending messages.

The contact form uses FormSubmit. Its recipient must be activated separately;
a passing test does not prove live email delivery. After an approved form change,
verify a real submission and receipt in the intended mailbox. Update the `site.js`
query string in index.html when changing that script to refresh browser caches.

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
