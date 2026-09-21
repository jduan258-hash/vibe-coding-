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
