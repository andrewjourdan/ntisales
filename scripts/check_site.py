"""Dependency-free publishing checks. Run from any working directory."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = (ROOT / 'CNAME').read_text().strip()
BASE = 'https://' + DOMAIN + '/'

class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids = set(); self.links = []; self.meta = {}; self.canonical = []
        self.title = ''; self.in_title = False; self.lang = ''; self.json = []
        self.in_json = False; self.buffer = ''
        self.feed(source); self.close()
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'): self.ids.add(a['id'])
        if tag == 'html': self.lang = a.get('lang', '')
        if tag == 'title': self.in_title = True
        if tag == 'meta': self.meta[a.get('name', a.get('property', ''))] = a.get('content', '')
        if tag == 'link' and 'canonical' in a.get('rel', '').split(): self.canonical.append(a.get('href'))
        if tag == 'script' and a.get('type') == 'application/ld+json': self.in_json = True; self.buffer = ''
        for key in ('href', 'src'):
            if a.get(key): self.links.append(a[key])
    def handle_data(self, text):
        if self.in_title: self.title += text
        if self.in_json: self.buffer += text
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
        if tag == 'script' and self.in_json: self.json.append(self.buffer); self.in_json = False

def check(condition, message):
    if not condition: raise SystemExit('FAIL: ' + message)

check(DOMAIN in {'muckorganics.com', 'ntisales.com'}, 'Unexpected publishing domain')
source = (ROOT / 'index.html').read_text(encoding='utf-8')
page = Page(source)
check(source.lstrip().lower().startswith('<!doctype html>'), 'Missing HTML5 doctype')
check(page.lang and page.title.strip() and page.meta.get('description'), 'Missing language, title or description')
check(page.canonical == [BASE], 'Canonical URL must match CNAME')
check(page.meta.get('og:url') == BASE and page.meta.get('og:title') and page.meta.get('twitter:card'), 'Missing sharing metadata')
for block in page.json: json.loads(block)
for link in page.links:
    u = urlsplit(link)
    if u.scheme or u.netloc: continue
    target = (ROOT / unquote(u.path.lstrip('/'))).resolve() if u.path else ROOT / 'index.html'
    check(target.is_relative_to(ROOT.resolve()), 'Local link escapes repository: ' + link)
    if target.is_dir(): target /= 'index.html'
    check(target.is_file(), 'Missing local file: ' + link)
    if u.fragment and target.suffix == '.html':
        other = page if target == ROOT / 'index.html' else Page(target.read_text(encoding='utf-8'))
        check(unquote(u.fragment) in other.ids, 'Broken local fragment: ' + link)
urls = {n.text for n in ET.parse(ROOT / 'sitemap.xml').findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')}
check(urls == {BASE}, 'Sitemap must contain exactly the homepage')
check('Sitemap: ' + BASE + 'sitemap.xml' in (ROOT / 'robots.txt').read_text(), 'Missing sitemap reference')
print('PASS: metadata, JSON-LD syntax, local files and links, domain, sitemap and robots.txt')
