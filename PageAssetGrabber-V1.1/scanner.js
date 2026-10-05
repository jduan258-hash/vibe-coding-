globalThis.__PAG_SCAN_RESULT = (async function () {
  const IMAGE_TYPES = /^(image\/(?:jpeg|jpg|png|gif))(?:;|$)/i;
  const EXT = /\.(jpe?g|png|gif)(?:$|[?#])/i;
  const LAZY = ["data-src", "data-original", "data-lazy-src", "data-lazy", "data-url", "data-image", "data-background", "data-bg", "data-fallback-src"];
  const seen = new Map();
  const isDeep = globalThis.__PAG_SCAN_MODE === "deep";
  const absolute = value => { try { return new URL(String(value).trim(), document.baseURI).href; } catch { return ""; } };
  const add = (raw, source, node, hint = "") => {
    if (!raw || /^data:|^blob:|^javascript:/i.test(raw)) return;
    const url = absolute(raw.replace(/^url\(["']?|["']?\)$/gi, ""));
    if (!url || seen.has(url)) return;
    const rect = node?.getBoundingClientRect?.();
    const width = Number(node?.naturalWidth || node?.width || rect?.width || 0) || 0;
    const height = Number(node?.naturalHeight || node?.height || rect?.height || 0) || 0;
    const format = /\.gif(?:$|[?#])/i.test(url) || /gif/i.test(hint) ? "gif" : /\.png(?:$|[?#])/i.test(url) || /png/i.test(hint) ? "png" : "jpg";
    const name = (() => { try { return decodeURIComponent(new URL(url).pathname.split("/").pop() || "asset"); } catch { return "asset"; } })();
    seen.set(url, { url, baseURI: document.baseURI, source, frame: location.href, document: document.title, width: Math.round(width), height: Math.round(height), area: Math.round(width * height), format, type: `image/${format === "jpg" ? "jpeg" : format}`, name });
  };
  const urls = value => { const out = []; const re = /url\(\s*(["']?)(.*?)\1\s*\)/gi; let m; while ((m = re.exec(String(value || "")))) out.push(m[2]); return out; };
  const srcset = value => String(value || "").split(",").map(x => x.trim().split(/\s+/)[0]).filter(Boolean);
  const inspectElement = el => {
    const tag = el.tagName?.toLowerCase();
    if (tag === "img" || tag === "source" || tag === "input" && el.type === "image") { add(el.currentSrc || el.src || el.getAttribute("src"), `${tag}.src`, el); srcset(el.getAttribute("srcset")).forEach(x => add(x, `${tag}.srcset`, el)); }
    if (tag === "video") add(el.poster, "video.poster", el);
    ["background", ...LAZY].forEach(a => add(el.getAttribute?.(a), `${tag || "element"}[${a}]`, el));
    if (isDeep && el.shadowRoot) scanRoot(el.shadowRoot, "shadow-dom");
    const style = getComputedStyle(el); [style.backgroundImage, style.listStyleImage, style.borderImageSource, style.content].forEach(v => urls(v).forEach(u => add(u, `${tag || "element"}.computed-style`, el)));
    if (el.getAttribute?.("style")) urls(el.getAttribute("style")).forEach(u => add(u, "inline-style", el));
  };
  const scanCss = (sheet, source) => { let rules; try { rules = sheet.cssRules; } catch { return; } for (const rule of rules || []) { if (rule.style) [rule.style.backgroundImage, rule.style.listStyleImage, rule.style.borderImageSource, rule.style.content].forEach(v => urls(v).forEach(u => add(u, source + ".css", null))); if (rule.cssRules) scanCss(rule, source + ".nested"); } };
  const scanRoot = (root, source = "document") => { root.querySelectorAll?.("*").forEach(inspectElement); root.querySelectorAll?.("img,source,input[type=image],video").forEach(inspectElement); if (isDeep) root.querySelectorAll?.("[shadowrootmode]").forEach(inspectElement); if (source === "document") document.querySelectorAll("style").forEach(s => { try { scanCss(s.sheet, "stylesheet"); } catch {} }); };
  scanRoot(document);
  const probeMime = async asset => {
    if (EXT.test(asset.url)) return asset;
    try {
      const response = await fetch(asset.url, { method: "HEAD", credentials: "include" });
      const mime = response.headers.get("content-type") || "";
      const match = mime.match(IMAGE_TYPES);
      if (match) { asset.type = match[1].toLowerCase().replace("jpg", "jpeg"); asset.format = /gif/i.test(mime) ? "gif" : /png/i.test(mime) ? "png" : "jpg"; }
    } catch { /* CORS/auth failures leave the DOM candidate intact. */ }
    return asset;
  };
  return Promise.all([...seen.values()].map(probeMime)).then(list => list.map(x => ({ ...x, mode: isDeep ? "deep" : "fast" })));
})();
