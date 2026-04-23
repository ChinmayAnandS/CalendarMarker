import { findDetector } from './detectors/index';
import type { Message } from '../shared/messages';

export default defineContentScript({
  matches: [
    'https://mail.google.com/*',
    'https://outlook.live.com/*',
    'https://outlook.office.com/*',
    'https://mail.yahoo.com/*',
    'https://www.icloud.com/*',
  ],
  main() {
    const detector = findDetector(window.location.hostname);
    if (!detector) return;

    let cleanup: (() => void) | null = null;
    let isEmailCurrentlyOpen = false;

    // Handle popup requesting email data
    chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse) => {
      if (msg.type === 'SCRAPE_REQUEST') {
        const emailData = detector.extractEmailData();
        if (emailData) {
          sendResponse({ type: 'SCRAPE_RESULT', payload: emailData } satisfies Message);
        } else {
          sendResponse({ type: 'SCRAPE_ERROR', payload: 'Could not extract email content.' } satisfies Message);
        }
        return false;
      }
      return false;
    });

    function handleButtonClick() {
      const emailData = detector!.extractEmailData();
      const msg: Message = emailData
        ? { type: 'SCRAPE_RESULT', payload: emailData }
        : { type: 'SCRAPE_ERROR', payload: 'Could not extract email content.' };
      chrome.runtime.sendMessage(msg);
    }

    function checkEmailState() {
      const open = detector!.isEmailOpen();
      if (open && !isEmailCurrentlyOpen) {
        isEmailCurrentlyOpen = true;
        cleanup = detector!.injectButton(handleButtonClick);
      } else if (!open && isEmailCurrentlyOpen) {
        isEmailCurrentlyOpen = false;
        cleanup?.();
        cleanup = null;
      }
    }

    checkEmailState();

    const observer = new MutationObserver(() => {
      checkEmailState();
    });

    observer.observe(document.body, { childList: true, subtree: true });
  },
});
