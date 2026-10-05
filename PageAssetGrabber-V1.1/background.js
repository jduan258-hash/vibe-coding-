const MAX_RETRIES = 3;

function safeName(value) {
  return String(value || "asset").replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").replace(/\s+/g, " ").trim().slice(0, 160) || "asset";
}

function extension(asset) {
  const type = String(asset.type || "").toLowerCase();
  if (type.includes("gif") || asset.format === "gif") return "gif";
  if (type.includes("png") || asset.format === "png") return "png";
  return "jpg";
}

async function downloadOne(asset, index, folder) {
  const ext = extension(asset);
  const base = safeName(asset.name || `asset-${String(index + 1).padStart(3, "0")}`);
  const filename = `${folder}/${String(index + 1).padStart(3, "0")}-${base.replace(/\.[a-z0-9]{2,5}$/i, "")}.${ext}`;
  let lastError = "unknown error";
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await new Promise((resolve, reject) => chrome.downloads.download({ url: asset.url, filename, conflictAction: "uniquify", saveAs: false }, id => {
        const error = chrome.runtime.lastError;
        if (error || id == null) reject(new Error(error?.message || "download did not start")); else resolve(id);
      }));
      return { ok: true, index };
    } catch (error) { lastError = error.message; if (attempt < MAX_RETRIES) await new Promise(r => setTimeout(r, 250 * attempt)); }
  }
  return { ok: false, index, error: lastError };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "download-assets") return false;
  (async () => {
    const results = [];
    for (let i = 0; i < message.assets.length; i += 1) {
      results.push(await downloadOne(message.assets[i], i, message.folder));
      chrome.runtime.sendMessage({ type: "download-progress", done: i + 1, total: message.assets.length }).catch(() => {});
    }
    sendResponse({ results });
  })();
  return true;
});
