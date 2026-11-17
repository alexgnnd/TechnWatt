// Construit le site TechnWatt à partir des fiches Markdown de content/
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'public');

const esc = (t = '') => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rel = (p = '') => String(p).replace(/^\/+/, '');
const dateStr = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d || ''));

const I18N = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'i18n-en.json'), 'utf8'));
const T = {
  fr: { plus: 'Les plus', moins: 'Les moins', more: 'Plus de photos', read: "Lire l'article", readA: "Lire l'analyse ›", abord: 'À bord · notre analyse complète', abordD: ' : consommation, conduite, matériaux, places', from: 'À partir de ', photo: 'Photo · ', cmp: 'Comparatif', which: 'Laquelle pour vous ?', fig: 'Les chiffres', gal: 'Galerie ', zoom: 'Agrandir' },
  en: { plus: 'Pros', moins: 'Cons', more: 'More photos', read: 'Read the article', readA: 'Read the analysis ›', abord: 'On board · our full analysis', abordD: ': consumption, driving, materials, space', from: 'From ', photo: 'Photo · ', cmp: 'Comparisons', which: 'Which one is right for you?', fig: 'Key figures', gal: 'Gallery ', zoom: 'Enlarge' },
};
let L = T.fr;

function readDir(d) {
  if (!fs.existsSync(d)) return {};
  const out = {};
  for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.md'))) {
    const { data, content } = matter(fs.readFileSync(path.join(d, f), 'utf8'));
    out[f.replace(/\.md$/, '')] = { ...data, body: content };
  }
  return out;
}
// Remet les photos du texte français dans le texte anglais s'il n'en contient pas
function withImages(enBody, frBody) {
  if (/!\[[^\]]*\]\(/.test(enBody)) return enBody;
  const isImg = (b) => /^!\[[^\]]*\]\([^)]+\)\s*$/.test(b.trim());
  const fb = String(frBody).split(/\n\s*\n/).filter((b) => b.trim());
  const imgsAfter = {}; let n = 0;
  for (const b of fb) { if (isImg(b)) (imgsAfter[n] = imgsAfter[n] || []).push(b.trim()); else n++; }
  const eb = String(enBody).split(/\n\s*\n/).filter((b) => b.trim());
  const out = []; (imgsAfter[0] || []).forEach((i) => out.push(i));
  eb.forEach((b, i) => { out.push(b.trim()); (imgsAfter[i + 1] || []).forEach((x) => out.push(x)); });
  return out.join('\n\n');
}
function load(dir, lang) {
  const fr = readDir(path.join(ROOT, 'content', dir, 'fr'));
  const en = lang === 'en' ? readDir(path.join(ROOT, 'content', dir, 'en')) : {};
  return Object.entries(fr).map(([slug, a]) => {
    let x = { slug, ...a };
    const e = en[slug];
    if (e) {
      for (const [k, v] of Object.entries(e)) if (v !== null && v !== undefined && v !== '' && k !== 'body') x[k] = v;
      if (e.body && e.body.trim()) x.body = withImages(e.body, a.body);
    }
    x.date = dateStr(x.date);
    return x;
  }).filter((a) => !a.brouillon).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

const RUBS_FR = {
  'watt-actualites': { id: 'actualites', label: 'Actualités', cls: 'c-auto', univers: 'Watt' },
  'watt-a-bord': { id: 'a-bord', label: 'À bord', cls: 'c-auto', univers: 'Watt' },
  'tech-smartphones': { id: 'smartphones', label: 'Smartphones', cls: 'c-phone', univers: 'Tech' },
  'tech-objets': { id: 'objets', label: 'Objets connectés', cls: 'c-gadget', univers: 'Tech' },
  'tech-videoprojecteurs': { id: 'videoprojecteurs', label: 'Vidéoprojecteurs', cls: 'c-proj', univers: 'Tech' },
};
const RUBS_EN = JSON.parse(JSON.stringify(RUBS_FR));
RUBS_EN['watt-actualites'].label = 'News'; RUBS_EN['watt-a-bord'].label = 'On board'; RUBS_EN['tech-objets'].label = 'Connected devices'; RUBS_EN['tech-videoprojecteurs'].label = 'Projectors';
let RUBS = RUBS_FR;

function figInl(src, cr) {
  return `<figure class="inl"><button aria-label="${L.zoom}" class="zoom" data-cap="" data-cr="${esc(cr)}" data-full="${esc(rel(src))}" type="button"><img alt="" loading="lazy" src="${esc(rel(src))}"/></button>${cr ? `<figcaption>© ${esc(cr)}</figcaption>` : ''}</figure>`;
}
function bodyHtml(md, cr) {
  const pre = String(md || '').replace(/^!\[[^\]]*\]\(([^)\s]+)[^)]*\)\s*$/gm, (_, src) => '\n' + figInl(src, cr) + '\n');
  return marked.parse(pre).replace(/<h[123]>/g, '<h4>').replace(/<\/h[123]>/g, '</h4>');
}
function mainFig(a, lazy = true) {
  if (!a.image) return `<figure class="photo"><span>${L.photo}${esc(a.titre)}</span></figure>`;
  return `<figure class="photo has-img"><img alt="${esc(a.titre)}"${lazy ? ' loading="lazy"' : ''} src="${esc(rel(a.image))}"/>${a.credit ? `<figcaption>© ${esc(a.credit)}</figcaption>` : ''}</figure>`;
}
function gallery(list, cr, label, end = true) {
  if (!list || !list.length) return '';
  const btns = list.map((src) => `<button data-cap="" data-full="${esc(rel(src))}" type="button"><img alt="" loading="lazy" src="${esc(rel(src))}"/></button>`).join('');
  return (end ? '<p class="gal-title">' + L.more + '</p>' : '') + `<div aria-label="${L.gal}${esc(label)}" class="gal${end ? ' gal-end' : ''}" data-cr="${esc(cr || '')}">${btns}</div>`;
}
function verdict(a) {
  if (!a.plus && !a.moins) return '';
  return `<div class="verdict"><div class="plus"><b>${L.plus}</b>${esc(a.plus || '')}</div><div class="moins"><b>${L.moins}</b>${esc(a.moins || '')}</div></div>`;
}
function keys(list, prefix = '') {
  if (!list || !list.length) return '';
  return `<div class="keys">${list.map((k) => `<span>${esc(prefix + k)}</span>`).join('')}</div>`;
}
function toAbord(a, all) {
  if (!a.lien_abord) return '';
  const t = all.find((x) => x.slug === a.lien_abord);
  if (!t) return '';
  const firstInl = (String(t.body).match(/!\[[^\]]*\]\(([^)\s]+)/) || [])[1] || t.image;
  const nom = t.titre.split(':')[0].trim();
  return `<a class="to-abord" href="#${esc(t.slug)}"><span class="ta-img"><img alt="" loading="lazy" src="${esc(rel(firstInl))}"/></span><span class="ta-txt"><span class="ta-cat">${L.abord}</span><b>${esc(nom)}${L.abordD}</b><span class="ta-go">${L.readA}</span></span></a>`;
}
function headLine(a) {
  if (a.infos) {
    const parts = String(a.infos).split('·').map((x) => x.trim()).filter(Boolean);
    return `<div class="meta"><span class="brand">${esc(a.categorie || '')}</span>${parts.map((p) => `<span>·</span><span>${esc(p)}</span>`).join('')}</div>`;
  }
  return a.categorie ? `<span class="cat">${esc(a.categorie)}</span>` : '';
}

function renderArticle(a, all) {
  const R = RUBS[a.rubrique] || RUBS['watt-actualites'];
  const inner = `${headLine(a)}
<h3>${esc(a.titre)}</h3>
${a.chapo ? `<p class="${a.chiffres && a.chiffres.length ? 'chapo' : 'lede'}">${esc(a.chapo)}</p>` : ''}
${bodyHtml(a.body, a.credit)}
${gallery(a.galerie, a.credit, a.titre)}
${verdict(a)}
${keys(a.reperes)}
${toAbord(a, all)}`;
  if (a.chiffres && a.chiffres.length) {
    const dl = a.chiffres.map((c) => `<div><dt>${esc(c.label)}</dt><dd>${esc(c.valeur)}</dd></div>`).join('');
    const price = a.prix ? `<div class="price">${esc(a.prix)}<small>${esc(a.prix_note || '')}</small></div>` : '';
    const note = a.encadre_note ? `<p class="mag-note">${esc(a.encadre_note)}</p>` : '';
    return `<div class="essais"><div class="essai" id="${esc(a.slug)}">
${mainFig(a)}
<article>
${inner}
</article>
<aside><h4>${esc(a.encadre_titre || L.fig)}</h4><dl>${dl}</dl>${price}${note}</aside>
</div></div>`;
  }
  return `<div class="news"><article class="${R.cls}" id="${esc(a.slug)}">
${a.image ? mainFig(a) : ''}
${inner}
</article></div>`;
}

function renderComparatif(c) {
  const head = (c.colonnes || []).map((h) => `<th>${esc(h)}</th>`).join('');
  const rows = (c.tableau || []).map((r) => `<tr><th>${esc(r.critere)}</th>${(r.valeurs || []).map((v) => `<td${v.meilleur ? ' class="best"' : ''}>${esc(v.v)}</td>`).join('')}</tr>`).join('');
  const cards = (c.modeles || []).map((m, i) => `<article class="cmp-card" id="${esc(c.slug)}-${i + 1}">
<div class="cmp-rank">${i + 1}</div>
${m.image ? `<figure class="photo has-img"><img alt="${esc(m.nom)}" loading="lazy" src="${esc(rel(m.image))}"/>${m.credit ? `<figcaption>© ${esc(m.credit)}</figcaption>` : ''}</figure>` : `<figure class="photo"><span>${L.photo}${esc(m.nom)}</span></figure>`}
<div class="cmp-body">
${m.etiquette ? `<span class="cat">${esc(m.etiquette)}</span>` : ''}
<h3>${esc(m.nom)}</h3>
${bodyHtml(m.texte, m.credit)}
${gallery(m.galerie, m.credit, m.nom, false)}
${verdict(m)}
${m.prix ? keys([m.prix], L.from) : ''}
</div>
</article>`).join('');
  const picks = (c.conseils || []).length ? `<div class="cmp-pick"><h3>${esc(c.conseils_titre || L.which)}</h3><div class="picks">${c.conseils.map((p) => `<div><b>${esc(p.profil)}</b><span>${esc(p.conseil)}</span></div>`).join('')}</div></div>` : '';
  return `<section class="alt" id="${esc(c.slug)}">
<div class="wrap">
<div class="sec-head"><span class="tag">${L.cmp}</span><h2>${esc(c.titre)}</h2>${c.chapo ? `<p>${esc(c.chapo)}</p>` : ''}${c.note ? `<p class="disclaim">${esc(c.note)}</p>` : ''}</div>
${rows ? `<div class="tbl-wrap"><table class="cmp-tbl"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}</tbody></table></div>` : ''}
<div class="cmp-list">${cards}</div>
${picks}
</div>
</section>`;
}

function rubWrap(label, html) {
  return `<section class="alt"><div class="wrap"><div class="sec-head"><span class="tag">${esc(label)}</span></div>
${html}
</div></section>`;
}

function translateTemplate(page) {
  for (const [a, b] of I18N.raw) page = page.split(a).join(b);
  const keys = Object.keys(I18N.text).sort((x, y) => y.length - x.length);
  for (const k of keys) page = page.split('>' + k + '<').join('>' + I18N.text[k] + '<');
  for (const [k, v] of Object.entries(I18N.attr)) for (const at of ['aria-label', 'alt', 'placeholder', 'title']) page = page.split(at + '="' + k + '"').join(at + '="' + v + '"');
  return page;
}

function buildLang(lang) {
  L = T[lang]; RUBS = lang === 'en' ? RUBS_EN : RUBS_FR;
  const arts = load('articles', lang);
  const cmps = load('comparatifs', lang);
  let page = fs.readFileSync(path.join(ROOT, 'src', 'template.html'), 'utf8');
  if (lang === 'en') page = translateTemplate(page);

  for (const [key, R] of Object.entries(RUBS)) {
    const list = arts.filter((a) => a.rubrique === key);
    page = page.replace(`<!--RUB:${R.id}-->`, rubWrap(R.label, list.map((a) => renderArticle(a, arts)).join('\n')));
  }
  page = page.replace('<!--RUB:comparatif-->', cmps.map(renderComparatif).join('\n'));

  // À la une : carrousel
  const une = arts.filter((a) => a.une).sort((a, b) => (a.une_ordre || 99) - (b.une_ordre || 99));
  const slides = une.map((a, i) => {
    const R = RUBS[a.rubrique] || {};
    const img = a.une_image || a.image;
    return `<article aria-label="${i + 1} sur ${une.length}" aria-roledescription="diapositive" class="slide">
<figure class="photo has-img"><img alt="${esc(a.titre)}" src="${esc(rel(img))}" style="object-position:50% 60%"/>${a.credit ? `<figcaption>© ${esc(a.credit)}</figcaption>` : ''}</figure>
<div class="slide-txt"><span class="slide-cat">${esc((R.univers || '') + ' · ' + (R.label || ''))}</span><h2>${esc(a.une_titre || a.titre)}</h2><p>${esc(a.une_texte || a.chapo || '')}</p><a class="cta" href="#${esc(a.slug)}">${L.read}</a></div>
</article>`;
  }).join('\n');
  page = page.replace('<!--SLIDES-->', slides);

  // Derniers articles
  const latest = arts.slice(0, 6).map((a) => {
    const R = RUBS[a.rubrique] || {};
    const meta = (a.reperes || []).slice(0, 2).join(' · ') || (a.prix ? a.prix : '');
    const img = a.image ? `<figure aria-hidden="true" class="photo mini-ph has-img"><img alt="" loading="lazy" src="${esc(rel(a.image))}"/></figure>` : '<figure aria-hidden="true" class="photo mini-ph"><span></span></figure>';
    return `<a class="mini ${R.cls || 'c-auto'}" href="#${esc(a.slug)}">${img}<span class="m-txt"><span class="cat">${esc((R.univers || '') + ' · ' + (R.label || ''))}</span><b>${esc(a.titre)}</b><span class="m-meta">${esc(meta)}</span></span></a>`;
  }).join('\n');
  page = page.replace('<!--LATEST-->', latest);

  return { page, arts, cmps, une };
}

function build() {
  const fr = buildLang('fr');
  const en = buildLang('en');
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'index.html'), fr.page);
  fs.writeFileSync(path.join(OUT, 'en.html'), en.page);
  for (const dir of ['img', 'admin']) {
    if (fs.existsSync(path.join(ROOT, dir))) fs.cpSync(path.join(ROOT, dir), path.join(OUT, dir), { recursive: true });
  }
  console.log(`TechnWatt : ${fr.arts.length} articles, ${fr.cmps.length} comparatif(s), ${fr.une.length} à la une, FR + EN.`);
}
build();
