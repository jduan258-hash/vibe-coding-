const IMAGE_EXT = /\.(jpe?g|png|gif)(?:$|[?#])/i;
const LAZY_ATTRS = ['data-src', 'data-original', 'data-lazy-src', 'data-url', 'data-image', 'data-flickity-lazyload', 'data-bg', 'data-background-image'];

function absolute(value, base) {
  try { return new URL(value, base).href; } catch { return ''; }
}
function formatOf(url, type = '') {
  const mime = type.toLowerCase();
  if (mime.includes('gif') || /\.gif(?:$|[?#])/i.test(url)) return 'gif';
  if (mime.includes('png') || /\.png(?:$|[?#])/i.test(url)) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg') || IMAGE_EXT.test(url)) return 'jpg';
  return '';
}
function candidatesFromSrcset(value) {
  return (value || '').split(',').map(part => part.trim().split(/\s+/)[0]).filter(Boolean);
}
function addUrl(set, value, base, type = '') {
  const url = absolute(value, base);
  const format = formatOf(url, type);
  if (url && format) set.set(url, format);
}
function cssUrls(value) {
  return [...(value || '').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)].map(m => m[1]);
}

function scanDocument(doc, base, output, seenDocs) {
  if (!doc || seenDocs.has(doc)) return;
  seenDocs.add(doc);
  const add = (value, type) => addUrl(output, value, base, type);
  doc.querySelectorAll('img, source').forEach(el => {
    add(el.currentSrc || el.getAttribute('src'), el.getAttribute('type') || '');
    for (const value of candidatesFromSrcset(el.getAttribute('srcset'))) add(value, el.getAttribute('type') || '');
    for (const attr of LAZY_ATTRS) add(el.getAttribute(attr), '');
  });
  doc.querySelectorAll('*').forEach(el => {
    const style = el.getAttribute('style');
    cssUrls(style).forEach(add);
    try { cssUrls(getComputedStyle(el).backgroundImage).forEach(add); } catch {}
    if (el.shadowRoot) scanDocument(el.shadowRoot, el.ownerDocument?.baseURI || base, output, seenDocs);
  });
  try { [...doc.styleSheets].forEach(sheet => { [...(sheet.cssRules || [])].forEach(rule => cssUrls(rule.cssText).forEach(add)); }); } catch {}
}

function collectAssets() {
  const found = new Map();
  const docs = new Set();
  scanDocument(document, document.baseURI, found, docs);
  document.querySelectorAll('iframe').forEach(frame => { try { scanDocument(frame.contentDocument, frame.contentDocument.baseURI, found, docs); } catch {} });
  return [...found].map(([url, format], index) => ({ url, format, index }));
}
globalThis.__pageAssetGrabberScan = collectAssets;
