// Генератор статических SEO-страниц курса.
// Источник данных — Public/course.js (тот же, что использует тренажёр),
// поэтому страницы пересобираются одной командой после правки курса:
//   node tools/build_seo_pages.mjs
// Скрипт пишет Public/course/*.html, Public/course/course.css и sitemap.xml.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'Public', 'course');
const SITE = 'https://chernoyarova.github.io/messenger_architecture';

global.window = {};
eval(fs.readFileSync(path.join(ROOT, 'Public', 'course.js'), 'utf8'));
const COURSE = global.window.COURSE;
const marked = require(path.join(ROOT, 'Public', 'marked.min.js'));

const REF_SLUGS = {
  'WebSocket': 'spravka-websocket',
  'TCP (Transmission Control Protocol)': 'spravka-tcp',
  'Сокеты (Sockets)': 'spravka-sokety',
  'Сетевые уровни (L4, L7 и другие) простыми словами': 'spravka-setevye-urovni',
};

const secSlug = id => `razdel-${String(id).toLowerCase()}`;

// Плоский упорядоченный список документов: разделы по частям, затем справка.
const docs = [];
COURSE.parts.forEach((part, pi) => {
  part.secs.forEach(id => {
    const s = COURSE.sections[String(id)];
    docs.push({
      kind: 'sec', id: String(id), slug: secSlug(id),
      h1: `Раздел ${id}. ${s.title}`,
      title: `Раздел ${id}. ${s.title} — Архитектура мессенджера`,
      sub: s.sub, md: s.md,
      part: part.part, partIdx: pi,
      hash: `#course/${encodeURIComponent(String(id))}`,
    });
  });
});
COURSE.refs.forEach(r => {
  docs.push({
    kind: 'ref', id: r.id, slug: REF_SLUGS[r.id],
    h1: r.title,
    title: `${r.title} — справка курса «Архитектура мессенджера»`,
    sub: `Справочный материал курса по архитектуре мессенджера: ${r.title}.`,
    md: r.md,
    part: 'Справка по сетям', partIdx: COURSE.parts.length,
    hash: `#course/ref/${encodeURIComponent(r.id)}`,
  });
});

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripMd = s => s.replace(/[*_`#>\[\]]/g, '').replace(/\s+/g, ' ').trim();
const descOf = d => {
  let t = stripMd(d.sub || '');
  if (t.length > 158) t = t.slice(0, 155).replace(/\s+\S*$/, '') + '…';
  return t;
};

const FAVICON = `<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛰️</text></svg>">`;

function page({ title, desc, canonical, jsonld, body }) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="ru_RU">
<title>${esc(title)}</title>
${FAVICON}
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 1)}
</script>
<link rel="stylesheet" href="course.css">
</head>
<body>
${body}
</body>
</html>
`;
}

const COURSE_LD = {
  '@type': 'Course',
  name: 'Архитектура мессенджера',
  url: `${SITE}/Public/course/`,
};

function navLinks(i) {
  const prev = docs[i - 1], next = docs[i + 1];
  return `<nav class="pn">
${prev ? `<a class="prev" href="${prev.slug}.html">← ${esc(prev.h1)}</a>` : '<span></span>'}
${next ? `<a class="next" href="${next.slug}.html">${esc(next.h1)} →</a>` : '<span></span>'}
</nav>`;
}

fs.mkdirSync(OUT, { recursive: true });

// --- страницы разделов ---
docs.forEach((d, i) => {
  const canonical = `${SITE}/Public/course/${d.slug}.html`;
  const desc = descOf(d);
  const html = page({
    title: d.title,
    desc,
    canonical,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: d.h1,
      description: desc,
      inLanguage: 'ru',
      url: canonical,
      isPartOf: COURSE_LD,
    },
    body: `<div class="wrap">
<header class="crumbs">
  <a href="index.html">Курс «Архитектура мессенджера»</a> · <span>${esc(d.part)}</span>
</header>
<article>
<h1>${esc(d.h1)}</h1>
<p class="sub">${esc(stripMd(d.sub || ''))}</p>
<div class="md">
${marked.parse(d.md)}
</div>
</article>
${navLinks(i)}
<footer class="foot">
  <a href="../trainer.html${d.hash}">Открыть этот раздел в интерактивном тренажёре →</a><br>
  <a href="index.html">Оглавление курса</a> · <a href="${SITE}/">Тренажёр: карта, флеш-карточки, сборка схемы</a>
</footer>
</div>`,
  });
  fs.writeFileSync(path.join(OUT, `${d.slug}.html`), html);
});

// --- оглавление ---
{
  const canonical = `${SITE}/Public/course/`;
  const parts = COURSE.parts.map((part, pi) => {
    const items = part.secs.map(id => {
      const d = docs.find(x => x.kind === 'sec' && x.id === String(id));
      return `<li><a href="${d.slug}.html">${esc(d.h1)}</a><span class="tsub">${esc(stripMd(d.sub || ''))}</span></li>`;
    }).join('\n');
    const intro = (COURSE.partsIntro || [])[pi] || '';
    return `<section>
<h2>${esc(part.part)}</h2>
${intro ? `<p class="pintro">${esc(intro)}</p>` : ''}
<ul class="toc">
${items}
</ul>
</section>`;
  }).join('\n');

  const refs = docs.filter(d => d.kind === 'ref')
    .map(d => `<li><a href="${d.slug}.html">${esc(d.h1)}</a></li>`).join('\n');

  const desc = 'Бесплатный курс по архитектуре мессенджера: 26 разделов о постоянных соединениях, доставке сообщений, шардировании, E2EE и звонках. Подготовка к System Design собеседованиям.';
  const html = page({
    title: 'Курс «Архитектура мессенджера» — оглавление',
    desc,
    canonical,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: 'Архитектура мессенджера',
      description: desc,
      url: canonical,
      inLanguage: 'ru',
      isAccessibleForFree: true,
      provider: { '@type': 'Person', name: 'chernoyarova' },
      teaches: ['System Design', 'Messenger Architecture', 'WebSocket', 'E2EE', 'Signal Protocol'],
      hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: 'PT10H' },
    },
    body: `<div class="wrap">
<article>
<h1>Курс «Архитектура мессенджера»</h1>
<p class="sub">${esc(desc)} Текстовая версия — для чтения и поиска; тот же материал доступен в <a href="../trainer.html">интерактивном тренажёре</a> с тестами, флеш-карточками и сборкой схемы.</p>
${parts}
<section>
<h2>Справка по сетям</h2>
<ul class="toc">
${refs}
</ul>
</section>
</article>
<footer class="foot"><a href="${SITE}/">Перейти в интерактивный тренажёр →</a></footer>
</div>`,
  });
  fs.writeFileSync(path.join(OUT, 'index.html'), html);
}

// --- стили ---
fs.writeFileSync(path.join(OUT, 'course.css'), `:root{--bg:#eef1f6;--panel:#fff;--line:#dde3ee;--ink:#1b2333;--muted:#5b6678;--edge:#2f6bff;}
@media(prefers-color-scheme:dark){:root{--bg:#0b0e14;--panel:#131927;--line:#26304a;--ink:#e9eef8;--muted:#94a2bd;--edge:#5ec8f2;}}
*{box-sizing:border-box;}
body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,sans-serif;line-height:1.65;}
.wrap{max-width:760px;margin:0 auto;padding:28px 18px 60px;}
a{color:var(--edge);}
.crumbs{font-size:13.5px;color:var(--muted);margin-bottom:18px;}
article{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:26px 30px;}
h1{font-size:27px;line-height:1.25;margin:0 0 10px;}
h2{font-size:20px;margin:28px 0 8px;}
.sub,.pintro{color:var(--muted);font-size:15px;}
.md table{border-collapse:collapse;width:100%;font-size:14px;}
.md th,.md td{border:1px solid var(--line);padding:6px 10px;text-align:left;}
.md code{background:rgba(127,127,127,.12);border-radius:4px;padding:1px 5px;font-size:.92em;}
.md pre{background:rgba(127,127,127,.1);border:1px solid var(--line);border-radius:10px;padding:12px 14px;overflow:auto;}
.md pre code{background:none;padding:0;}
.md blockquote{border-left:3px solid var(--edge);margin:0;padding:2px 16px;color:var(--muted);}
ul.toc{list-style:none;padding:0;margin:8px 0 0;}
ul.toc li{margin:0 0 12px;}
ul.toc .tsub{display:block;color:var(--muted);font-size:13.5px;}
.pn{display:flex;justify-content:space-between;gap:14px;margin:20px 0;font-size:14px;}
.pn a{max-width:46%;}
.foot{margin-top:22px;font-size:14px;color:var(--muted);line-height:2;}
`);

// --- sitemap ---
{
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${SITE}/`, pr: '1.0' },
    { loc: `${SITE}/Public/trainer.html`, pr: '0.9' },
    { loc: `${SITE}/Public/course/`, pr: '0.9' },
    ...docs.map(d => ({ loc: `${SITE}/Public/course/${d.slug}.html`, pr: '0.8' })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${u.pr}</priority>
  </url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
}

console.log(`OK: ${docs.length} страниц + index.html + course.css + sitemap.xml`);
