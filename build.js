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
  fr: { plus: 'Les plus', moins: 'Les moins', more: 'Plus de photos', read: "Lire l'article", readA: "Lire l'analyse ›", abord: 'À bord · notre analyse complète', abordD: ' : consommation, conduite, matériaux, places', from: 'À partir de ', photo: 'Photo · ', cmp: 'Comparatif', which: 'Laquelle pour vous ?', fig: 'Les chiffres', gal: 'Galerie ', zoom: 'Agrandir', ad: 'Publicité' },
  en: { plus: 'Pros', moins: 'Cons', more: 'More photos', read: 'Read the article', readA: 'Read the analysis ›', abord: 'On board · our full analysis', abordD: ': consumption, driving, materials, space', from: 'From ', photo: 'Photo · ', cmp: 'Comparisons', which: 'Which one is right for you?', fig: 'Key figures', gal: 'Gallery ', zoom: 'Enlarge', ad: 'Advertisement' },
};
let L = T.fr;
const CFG = fs.existsSync(path.join(ROOT, 'content', 'reglages.yml')) ? (matter('---\n' + fs.readFileSync(path.join(ROOT, 'content', 'reglages.yml'), 'utf8') + '\n---\n').data || {}) : {};
const GUIDE = (() => {
  const p = path.join(ROOT, 'content', 'guide.yml');
  if (!fs.existsSync(p)) return null;
  try { return matter('---\n' + fs.readFileSync(p, 'utf8') + '\n---\n').data || null; } catch (e) { return null; }
})();

const SITE = String(process.env.TW_SITE || CFG.site_url || process.env.URL || 'https://technwatt.com').replace(/\/+$/, '');
const ADS = String(CFG.adsense_client || '').trim();
const GA = String(CFG.ga_id || '').trim();
let BASE = '/', LANG = 'fr';
const pic = (a) => a.image || (a.picto ? `img/pictos/${a.picto}.jpg` : '');
function ad(slot, extra = '') {
  if (!ADS || !slot) return '';
  return `<div class="tw-ad-box ${extra}"><span class="tw-ad-lbl">${L.ad}</span><ins class="tw-ad" style="display:block" data-ad-client="${esc(ADS)}" data-ad-slot="${esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins></div>`;
}

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
      for (const [k, v] of Object.entries(e)) if (v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && !v.length) && k !== 'body') x[k] = v;
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
const AFF_TAG = String(CFG.amazon_tag || '').trim();
const AFF_HOSTS = /(^|\.)(amazon\.[a-z.]+|fnac\.com|darty\.com|boulanger\.com|cdiscount\.com|ledenicheur\.fr)$/i;
function affLinks(html) {
  let found = false;
  html = html.replace(/<a href="([^"]+)"/g, (m, href) => {
    let u; try { u = new URL(href); } catch (e) { return m; }
    if (!AFF_HOSTS.test(u.hostname)) return m;
    found = true;
    if (AFF_TAG && /amazon\./i.test(u.hostname) && !u.searchParams.get('tag')) u.searchParams.set('tag', AFF_TAG);
    return `<a class="aff" href="${esc(u.toString())}" rel="sponsored nofollow noopener" target="_blank"`;
  });
  return { html, found };
}
function affNote(lang) {
  return `<p class="aff-note">${lang === 'en'
    ? 'Some links in this article are affiliate links. If you buy through them, TechnWatt earns a commission, at no extra cost to you. This never influences our editorial choices.'
    : 'Certains liens de cet article sont des liens affiliés. Si vous achetez via ces liens, TechnWatt touche une commission, sans surcoût pour vous. Cela n’influence jamais nos choix éditoriaux.'}</p>`;
}
function bodyHtml(md, cr) {
  const pre = String(md || '').replace(/^!\[[^\]]*\]\(([^)\s]+)[^)]*\)\s*$/gm, (_, src) => '\n' + figInl(src, cr) + '\n');
  let out = marked.parse(pre).replace(/<h[123]>/g, '<h4>').replace(/<\/h[123]>/g, '</h4>');
  const a = affLinks(out);
  return a.found ? affNote(LANG) + a.html : a.html;
}
function mainFig(a, lazy = true) {
  if (!a.image && a.picto) return `<figure class="photo has-img picto"><img alt="${esc(a.titre)}"${lazy ? ' loading="lazy"' : ''} src="${esc(pic(a))}"/></figure>`;
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
  return `<a class="to-abord" href="${BASE}${esc(t.slug)}"><span class="ta-img"><img alt="" loading="lazy" src="${esc(rel(firstInl))}"/></span><span class="ta-txt"><span class="ta-cat">${L.abord}</span><b>${esc(nom)}${L.abordD}</b><span class="ta-go">${L.readA}</span></span></a>`;
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
${ad(CFG.pub_article)}
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
${pic(a) ? mainFig(a) : ''}
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
${ad(CFG.pub_article)}
</div>
</section>`;
}

function rubWrap(label, html) {
  return `<section class="alt"><div class="wrap"><div class="sec-head"><span class="tag">${esc(label)}</span></div>
${html}
${ad(CFG.pub_rubrique, 'tw-ad-rub')}
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
  BASE = lang === 'en' ? '/en/' : '/';
  L = T[lang]; LANG = lang; RUBS = lang === 'en' ? RUBS_EN : RUBS_FR;
  const arts = load('articles', lang);
  const cmps = load('comparatifs', lang);
  let page = fs.readFileSync(path.join(ROOT, 'src', 'template.html'), 'utf8');
  page = applyGuide(page, lang);
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
    return `<article aria-label="${i + 1} sur ${une.length}" aria-roledescription="diapositive" class="slide ${R.cls || 'c-auto'}">
<figure class="photo has-img"><img alt="${esc(a.titre)}" src="${esc(rel(img))}" style="object-position:50% 60%"/>${a.credit ? `<figcaption>© ${esc(a.credit)}</figcaption>` : ''}</figure>
<div class="slide-txt"><span class="slide-cat">${esc((R.univers || '') + ' · ' + (R.label || ''))}</span><h2>${esc(a.une_titre || a.titre)}</h2><p>${esc(a.une_texte || a.chapo || '')}</p><a class="cta" href="${BASE}${esc(a.slug)}">${L.read}</a></div>
</article>`;
  }).join('\n');
  page = page.replace('<!--SLIDES-->', slides);

  // Derniers articles
  const latest = arts.slice(0, 9).map((a) => {
    const R = RUBS[a.rubrique] || {};
    const meta = (a.reperes || []).slice(0, 2).join(' · ') || (a.prix ? a.prix : '');
    const img = pic(a) ? `<figure aria-hidden="true" class="photo mini-ph has-img"><img alt="" loading="lazy" src="${esc(rel(pic(a)))}"/></figure>` : '<figure aria-hidden="true" class="photo mini-ph"><span></span></figure>';
    return `<a class="mini ${R.cls || 'c-auto'}" href="${BASE}${esc(a.slug)}">${img}<span class="m-txt"><span class="cat">${esc((R.univers || '') + ' · ' + (R.label || ''))}</span><b>${esc(a.titre)}</b><span class="m-meta">${esc(meta)}</span></span></a>`;
  }).join('\n');
  page = page.replace('<!--LATEST-->', latest);
  page = page.replace('<section class="home-block" id="derniers">', ad(CFG.pub_accueil, 'wrap') + '\n<section class="home-block" id="derniers">');
  page = page.replace('<div class="view" data-view="identite"', legalView(lang) + '\n<div class="view" data-view="identite"');
  const fl = lang === 'en'
    ? '<a href="#mentions">Legal notice</a><a href="#cgu">Terms of use</a><a href="#confidentialite">Privacy</a><a href="#contact">Contact</a>'
    : '<a href="#mentions">Mentions légales</a><a href="#cgu">CGU</a><a href="#confidentialite">Confidentialité</a><a href="#contact">Nous écrire</a>';
  page = page.replace('<a href="#watt">Watt</a><a class="ig"', `<a href="#watt">Watt</a>${fl}<a href="#" class="tw-consent" hidden>${lang === 'en' ? 'Cookie settings' : 'Gérer les cookies'}</a><a class="ig"`);

  return { page, arts, cmps, une };
}


function applyGuide(page, lang) {
  if (!GUIDE || lang !== 'fr') return page;
  for (const sec of GUIDE.sections || []) {
    const re = new RegExp('(<section class="[^"]*" id="' + sec.id + '")([^>]*)(>)([\\s\\S]*?)(</section>)');
    page = page.replace(re, (m, open, attrs, gt, body, close) => {
      attrs = ' data-img="' + esc(sec.image || '') + '" data-credit="' + esc(sec.credit || '') + '"';
      body = body.replace(/<span class="tag">[\s\S]*?<\/span>/, '<span class="tag">' + esc(sec.tag || '') + '</span>');
      body = body.replace(/<h2>[\s\S]*?<\/h2>/, '<h2>' + esc(sec.titre || '') + '</h2>');
      if (sec.chapo) body = body.replace(/(<h2>[\s\S]*?<\/h2>\s*)<p>[\s\S]*?<\/p>/, '$1<p>' + esc(sec.chapo) + '</p>');
      return open + attrs + gt + body + close;
    });
  }
  if (Array.isArray(GUIDE.idees) && GUIDE.idees.length) {
    const html = GUIDE.idees.map((d, i) => '<details' + (i ? '' : ' open=""') + '><summary>' + esc(d.question || '') + '</summary><p>' + esc(d.reponse || '') + '</p></details>').join('\n');
    page = page.replace(/<details[\s\S]*<\/details>/, html);
  }
  if (Array.isArray(GUIDE.glossaire) && GUIDE.glossaire.length) {
    const g = GUIDE.glossaire, half = Math.ceil(g.length / 2);
    const col = (a) => '<dl>\n' + a.map((d) => '<div><dt>' + esc(d.terme || '') + '</dt><dd>' + esc(d.definition || '') + '</dd></div>').join('\n') + '\n</dl>';
    page = page.replace(/<dl>[\s\S]*<\/dl>/, col(g.slice(0, half)) + '\n' + col(g.slice(half)));
  }
  return page;
}

function legalView(lang) {
  const L = lang === 'en';
  const view = (id, html) => `<div class="view" data-view="infos" hidden="" id="${id}"><section class="alt"><div class="wrap legal">${html}</div></section></div>`;

  const mentions = L ? `<h2>Legal notice</h2>
<h4>Publisher</h4><p>TechnWatt is an independent news website about electric cars and new technology, published on a non-commercial basis by a private individual. In line with French law, the publisher's identity is held by the host and can be disclosed to the judicial authorities on request. Any request may be sent through the <a href="#contact">contact form</a>.</p>
<h4>Hosting</h4><p>Netlify, Inc., 512 2nd Street, Suite 200, San Francisco, CA 94107, United States · netlify.com</p>
<h4>Content</h4><p>The texts and page layouts belong to TechnWatt and may not be reproduced without permission. Photos remain the property of the brands or photographers named in the credits.</p>
<h4>Liability</h4><p>Figures, prices and availability are given for information only and reflect the sources available when the article was written. They may change at any time.</p>` : `<h2>Mentions légales</h2>
<h4>Éditeur</h4><p>TechnWatt est un site d'information indépendant consacré à la voiture électrique et aux nouvelles technologies, édité à titre non professionnel par une personne physique. Conformément à la loi pour la confiance dans l'économie numérique, l'identité de l'éditeur est conservée par l'hébergeur et peut être communiquée à l'autorité judiciaire sur demande. Toute demande peut être adressée via le <a href="#contact">formulaire de contact</a>.</p>
<h4>Hébergement</h4><p>Netlify, Inc., 512 2nd Street, Suite 200, San Francisco, CA 94107, États-Unis · netlify.com</p>
<h4>Contenus</h4><p>Les textes et la mise en page sont la propriété de TechnWatt et ne peuvent être reproduits sans autorisation. Les photos restent la propriété des marques ou des photographes mentionnés en crédit.</p>
<h4>Responsabilité</h4><p>Les chiffres, prix et disponibilités sont donnés à titre indicatif, d'après les sources disponibles au moment de la rédaction. Ils peuvent évoluer à tout moment.</p>`;

  const cgu = L ? `<h2>Terms of use</h2>
<h4>Purpose</h4><p>These terms govern the use of the TechnWatt website. Browsing the site implies full acceptance of them.</p>
<h4>Access</h4><p>The site is free to use and requires no account. It is available around the clock, except during maintenance or in the event of a technical failure. Access may be suspended without notice and without any right to compensation.</p>
<h4>Editorial content</h4><p>Articles are written from manufacturers' press releases and official sources. They are informational and never constitute a purchase recommendation or professional advice.</p>
<h4>Affiliate links</h4><p>Some articles contain affiliate links. A purchase made through such a link may earn the site a commission, at no extra cost to the reader. Any article concerned states this clearly.</p>
<h4>Intellectual property</h4><p>Reproducing all or part of the site without written permission is prohibited. Brand names and logos belong to their respective owners.</p>
<h4>Changes</h4><p>These terms may be amended at any time. The version online is the one that applies.</p>
<h4>Applicable law</h4><p>These terms are governed by French law.</p>` : `<h2>Conditions générales d'utilisation</h2>
<h4>Objet</h4><p>Les présentes conditions régissent l'utilisation du site TechnWatt. Le fait de naviguer sur le site vaut acceptation pleine et entière de ces conditions.</p>
<h4>Accès</h4><p>Le site est d'accès libre et gratuit et ne nécessite aucun compte. Il est accessible en permanence, sauf pendant les opérations de maintenance ou en cas de panne technique. L'accès peut être suspendu sans préavis et sans ouvrir droit à indemnité.</p>
<h4>Contenu éditorial</h4><p>Les articles sont rédigés à partir des communiqués de presse des constructeurs et de sources officielles. Ils ont une valeur d'information et ne constituent jamais un conseil d'achat ni un avis professionnel.</p>
<h4>Liens affiliés</h4><p>Certains articles contiennent des liens affiliés. Un achat effectué via ces liens peut donner lieu à une commission pour le site, sans surcoût pour le lecteur. Les articles concernés le signalent explicitement.</p>
<h4>Propriété intellectuelle</h4><p>Toute reproduction, totale ou partielle, du site sans autorisation écrite est interdite. Les marques et logos cités appartiennent à leurs propriétaires respectifs.</p>
<h4>Évolution</h4><p>Ces conditions peuvent être modifiées à tout moment. La version en ligne est celle qui fait foi.</p>
<h4>Droit applicable</h4><p>Les présentes conditions sont soumises au droit français.</p>`;

  const conf = L ? `<h2>Privacy policy</h2>
<h4>Principle</h4><p>TechnWatt asks for no account and no sign-up. No personal data is collected to read the site.</p>
<h4>Audience measurement</h4><p>The site uses Google Analytics to count visits and see which pages are read. Measurement only starts once you have accepted it in the consent banner; until then no analytics cookie is placed.</p>
<h4>Advertising</h4><p>The site may display ads served by Google AdSense. Google and its partners may use cookies to show ads suited to your interests, again only after you have given consent. You can change your mind at any time through the <a href="#" class="tw-consent">cookie settings</a> link in the footer.</p>
<h4>Contact form</h4><p>Messages sent through the contact form are processed by Netlify Forms and forwarded to the publisher's mailbox. The name, email address and message are used solely to reply, and are kept for a maximum of twelve months.</p>
<h4>Your rights</h4><p>You may ask to access, correct or erase data about you, or object to its use, through the <a href="#contact">contact form</a>. You may also lodge a complaint with the CNIL, the French data protection authority.</p>
<h4>Hosting</h4><p>The site is hosted by Netlify, Inc., in the United States. Netlify keeps technical connection logs for its own security needs.</p>` : `<h2>Politique de confidentialité</h2>
<h4>Principe</h4><p>TechnWatt ne demande ni compte ni inscription. Aucune donnée personnelle n'est collectée pour lire le site.</p>
<h4>Mesure d'audience</h4><p>Le site utilise Google Analytics pour compter les visites et savoir quelles pages sont lues. La mesure ne démarre qu'après votre accord dans le bandeau de consentement : tant que vous n'avez pas accepté, aucun cookie de mesure n'est déposé.</p>
<h4>Publicité</h4><p>Le site peut afficher des publicités fournies par Google AdSense. Google et ses partenaires peuvent utiliser des cookies pour proposer des annonces adaptées à vos centres d'intérêt, là encore uniquement après votre consentement. Vous pouvez changer d'avis à tout moment via le lien <a href="#" class="tw-consent">Gérer les cookies</a> en bas de page.</p>
<h4>Formulaire de contact</h4><p>Les messages envoyés via le formulaire de contact sont traités par Netlify Forms et transmis à la boîte de l'éditeur. Le nom, l'adresse e-mail et le message servent uniquement à vous répondre et sont conservés douze mois au maximum.</p>
<h4>Vos droits</h4><p>Vous pouvez demander l'accès, la rectification ou l'effacement des données vous concernant, ou vous opposer à leur utilisation, via le <a href="#contact">formulaire de contact</a>. Vous pouvez également introduire une réclamation auprès de la CNIL.</p>
<h4>Hébergement</h4><p>Le site est hébergé par Netlify, Inc., aux États-Unis. Netlify conserve des journaux techniques de connexion pour ses propres besoins de sécurité.</p>`;

  const contact = L ? `<h2>Contact</h2>
<p>A question, a correction, a press release to pass on? Write to us here, we answer every message.</p>
<form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" class="tw-form">
<input type="hidden" name="form-name" value="contact"/>
<p class="hp"><label>Leave this field empty <input name="bot-field"/></label></p>
<label>Your name<input type="text" name="nom" required=""/></label>
<label>Your email<input type="email" name="email" required=""/></label>
<label>Subject<input type="text" name="sujet"/></label>
<label>Your message<textarea name="message" rows="6" required=""></textarea></label>
<button type="submit" class="cta">Send</button>
</form>` : `<h2>Nous écrire</h2>
<p>Une question, une correction à signaler, un communiqué à nous transmettre ? Écrivez-nous ici, nous répondons à tous les messages.</p>
<form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" class="tw-form">
<input type="hidden" name="form-name" value="contact"/>
<p class="hp"><label>Ne remplissez pas ce champ <input name="bot-field"/></label></p>
<label>Votre nom<input type="text" name="nom" required=""/></label>
<label>Votre e-mail<input type="email" name="email" required=""/></label>
<label>Sujet<input type="text" name="sujet"/></label>
<label>Votre message<textarea name="message" rows="6" required=""></textarea></label>
<button type="submit" class="cta">Envoyer</button>
</form>`;

  return view('mentions', mentions) + view('cgu', cgu) + view('confidentialite', conf) + view('contact', contact);
}

const TXT = {
  fr: { home: 'TechnWatt · Voiture électrique et nouvelles technologies', desc: "Actualités de la voiture électrique et des nouvelles technologies : nouveaux modèles, analyses à bord, comparatifs, smartphones, objets connectés et vidéoprojecteurs.", loc: 'fr_FR' },
  en: { home: 'TechnWatt · Electric cars and new technology', desc: 'News on electric cars and new technology: new models, on-board analyses, comparisons, smartphones, connected devices and projectors.', loc: 'en_GB' },
};
const clip = (t, n = 158) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; };
const abs = (p) => (/^https?:/.test(p) ? p : SITE + '/' + rel(p));
const urlOf = (lang, slug) => SITE + (lang === 'en' ? '/en/' : '/') + (slug || '');

function headTags(lang, o) {
  const alt = (l) => urlOf(l, o.slug);
  const img = abs(o.image || 'img/og-default.jpg');
  const ld = JSON.stringify(o.ld).replace(/</g, '\\u003c');
  return `<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}"/>
<link rel="canonical" href="${alt(lang)}"/>
<link rel="alternate" hreflang="fr" href="${alt('fr')}"/>
<link rel="alternate" hreflang="en" href="${alt('en')}"/>
<link rel="alternate" hreflang="x-default" href="${alt('fr')}"/>
<meta name="robots" content="index,follow,max-image-preview:large"/>
<meta property="og:site_name" content="TechnWatt"/>
<meta property="og:locale" content="${TXT[lang].loc}"/>
<meta property="og:type" content="${o.slug ? 'article' : 'website'}"/>
<meta property="og:title" content="${esc(o.ogTitle || o.title)}"/>
<meta property="og:description" content="${esc(o.desc)}"/>
<meta property="og:url" content="${alt(lang)}"/>
<meta property="og:image" content="${esc(img)}"/>
${o.date ? `<meta property="article:published_time" content="${esc(o.date)}"/>\n` : ''}<meta name="twitter:card" content="summary_large_image"/>
<link rel="icon" href="/favicon.ico" sizes="32x32"/>
<link rel="icon" href="/img/favicon-32.png" type="image/png" sizes="32x32"/>
<link rel="icon" href="/img/icon-192.png" type="image/png" sizes="192x192"/>
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png"/>
<script type="application/ld+json">${ld}</script>
${ADS ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(ADS)}" crossorigin="anonymous"></script><script>window.TW_ADS=1</script>` : ''}
${GA ? `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});gtag('js',new Date());gtag('config','${esc(GA)}');window.TW_GA='${esc(GA)}';</script><script async src="https://www.googletagmanager.com/gtag/js?id=${esc(GA)}"></script>` : ''}`;
}

const PUB = { '@type': 'Organization', name: 'TechnWatt', url: SITE + '/', logo: { '@type': 'ImageObject', url: SITE + '/img/logo-512.png' } };

function finalize(page, lang, o) {
  page = page.replace(/<title>[^<]*<\/title>/, headTags(lang, o));
  page = page.replace(/<html lang="(fr|en)"[^>]*>/, `<html lang="${lang}"${o.slug ? ` data-open="${esc(o.slug)}"` : ''} data-base="${lang === 'en' ? '/en/' : '/'}">`);
  page = page.replace(/class="lang-sw" href="[^"]*"/, `class="lang-sw" href="${lang === 'en' ? '/' : '/en/'}${esc(o.slug || '')}"`);
  page = page.replace(/href="(en|index)\.html"/g, (m, w) => `href="${w === 'en' ? '/en/' : '/'}${esc(o.slug || '')}"`);
  page = page.replace(/(src|data-full|href)="img\//g, '$1="/img/');
  return page;
}

function articleLd(lang, a, url, img) {
  return { '@context': 'https://schema.org', '@type': a.rubrique === 'watt-actualites' ? 'NewsArticle' : 'Article', headline: clip(a.titre, 110), description: clip(a.chapo), image: [abs(img || 'img/og-default.jpg')], datePublished: a.date, dateModified: a.date, inLanguage: lang, mainEntityOfPage: url, author: { '@type': 'Organization', name: 'TechnWatt', url: SITE + '/' }, publisher: PUB };
}

function build() {
  const out = { fr: buildLang('fr'), en: buildLang('en') };
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, 'en'), { recursive: true });
  const urls = [];
  for (const lang of ['fr', 'en']) {
    const b = out[lang], X = TXT[lang];
    const dir = lang === 'en' ? path.join(OUT, 'en') : OUT;
    const home = { slug: '', title: X.home, desc: X.desc, ld: { '@context': 'https://schema.org', '@type': 'WebSite', name: 'TechnWatt', url: urlOf(lang, ''), inLanguage: lang, publisher: PUB } };
    fs.writeFileSync(path.join(dir, 'index.html'), finalize(b.page, lang, home));
    if (lang === 'fr') urls.push({ slug: '', date: (b.arts[0] || {}).date });
    for (const a of b.arts) {
      const img = pic(a);
      const o = { slug: a.slug, title: `${a.titre} | TechnWatt`, ogTitle: a.titre, desc: clip(a.chapo || a.titre), image: img, date: a.date, ld: articleLd(lang, a, urlOf(lang, a.slug), img) };
      fs.writeFileSync(path.join(dir, a.slug + '.html'), finalize(b.page, lang, o));
      if (lang === 'fr') urls.push({ slug: a.slug, date: a.date });
    }
    for (const c of b.cmps) {
      const img = ((c.modeles || [])[0] || {}).image;
      const o = { slug: c.slug, title: `${c.titre} | TechnWatt`, ogTitle: c.titre, desc: clip(c.chapo || c.titre), image: img, date: c.date, ld: articleLd(lang, c, urlOf(lang, c.slug), img) };
      fs.writeFileSync(path.join(dir, c.slug + '.html'), finalize(b.page, lang, o));
      if (lang === 'fr') urls.push({ slug: c.slug, date: c.date });
    }
  }
  // Ancienne adresse de la version anglaise
  fs.writeFileSync(path.join(OUT, '_redirects'), '/en.html /en/ 301\n/index.html / 301\n');
  fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE}/sitemap.xml\n`);
  const sm = urls.map((u) => ['fr', 'en'].map((l) => `<url><loc>${urlOf(l, u.slug)}</loc>${u.date ? `<lastmod>${u.date}</lastmod>` : ''}<xhtml:link rel="alternate" hreflang="fr" href="${urlOf('fr', u.slug)}"/><xhtml:link rel="alternate" hreflang="en" href="${urlOf('en', u.slug)}"/></url>`).join('\n')).join('\n');
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sm}\n</urlset>\n`);
  if (ADS) fs.writeFileSync(path.join(OUT, 'ads.txt'), `google.com, ${ADS.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`);
  for (const file of ['favicon.ico', 'robots.txt', '_headers', '_redirects']) {
    if (fs.existsSync(path.join(ROOT, file))) fs.copyFileSync(path.join(ROOT, file), path.join(OUT, file));
  }
  for (const dir of ['img', 'admin']) {
    if (fs.existsSync(path.join(ROOT, dir))) fs.cpSync(path.join(ROOT, dir), path.join(OUT, dir), { recursive: true });
  }
  console.log(`TechnWatt : ${out.fr.arts.length} articles, ${out.fr.cmps.length} comparatif(s), ${urls.length * 2} pages, pub ${ADS ? 'active' : 'en attente'}, GA ${GA ? 'actif' : 'en attente'}.`);
}
build();
