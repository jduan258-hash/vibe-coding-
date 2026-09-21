const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

chrome.commands.onCommand.addListener(async command => {
  if (command !== 'scan-page') return;
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab?.id) chrome.action.openPopup().catch(() => {});
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'download-assets') return;
  downloadAssets(message.items, message.folder).then(result => sendResponse({ ok: true, ...result }))
    .catch(error => sendResponse({ ok: false, error: error.message }));
  return true;
});

function safeName(value) {
  return (value || 'page').replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80) || 'page';
}

function extFor(item) {
  if (item.format === 'gif') return 'gif';
  if (item.format === 'png') return 'png';
  return 'jpg';
}

async function downloadAssets(items, folder) {
  const results = [];
  for (const item of items) {
    const name = safeName(item.name || `image-${item.index + 1}`);
    const filename = `${folder}/${name}.${extFor(item)}`;
    let lastError = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const id = await chrome.downloads.download({ url: item.url, filename, conflictAction: 'uniquify', saveAs: false });
        const state = await waitForDownload(id, 60000);
        if (state !== 'complete') throw new Error(`Download ${state || 'timeout'}`);
        results.push({ id, url: item.url, ok: true });
        lastError = '';
        break;
      } catch (error) {
        lastError = error.message;
        await sleep(350 * (attempt + 1));
      }
    }
    if (lastError) results.push({ url: item.url, ok: false, error: lastError });
  }
  return { results };
}

function waitForDownload(id, timeoutMs) {
  return new Promise(resolve => {
    let settled = false;
    const finish = state => { if (settled) return; settled = true; clearTimeout(timer); chrome.downloads.onChanged.removeListener(listener); resolve(state); };
    const listener = delta => {
      if (delta.id !== id) return;
      if (delta.state?.current === 'complete') finish('complete');
      if (delta.state?.current === 'interrupted') finish('interrupted');
    };
    const timer = setTimeout(() => finish('timeout'), timeoutMs);
    chrome.downloads.onChanged.addListener(listener);
    chrome.downloads.search({ id }).then(rows => {
      const state = rows[0]?.state;
      if (state === 'complete' || state === 'interrupted') finish(state);
    });
  });
}
