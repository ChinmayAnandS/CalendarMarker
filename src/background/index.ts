import type { Message } from '../shared/messages';

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse) => {
    if (msg.type === 'DOWNLOAD_ICS') {
      const blob = new Blob([msg.payload.icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      chrome.downloads.download(
        { url, filename: msg.payload.filename, saveAs: false },
        () => {
          URL.revokeObjectURL(url);
          sendResponse({ ok: true });
        }
      );
      return true; // keep message channel open for async response
    }

    if (msg.type === 'OPEN_URL') {
      chrome.tabs.create({ url: msg.payload.url }, () => {
        sendResponse({ ok: true });
      });
      return true;
    }

    return false;
  });
});
