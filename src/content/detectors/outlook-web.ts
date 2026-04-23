import type { EmailDetector } from './index';
import type { EmailData } from '../../shared/types';

const BODY_SELECTOR = '[class*="ReadingPaneContent"]';
const SUBJECT_SELECTOR = '[data-testid="subject"]';
const TOOLBAR_SELECTOR = '[class*="commandBar"]';
const BUTTON_ID = 'e2c-fab-outlook';

export class OutlookWebDetector implements EmailDetector {
  readonly name = 'Outlook Web';
  readonly hostname = ['outlook.live.com', 'outlook.office.com'];

  isEmailOpen(): boolean {
    return document.querySelector(BODY_SELECTOR) !== null;
  }

  extractEmailData(): EmailData | null {
    const bodyEl = document.querySelector(BODY_SELECTOR);
    const subjectEl = document.querySelector(SUBJECT_SELECTOR);
    if (!bodyEl || !subjectEl) return null;

    const senderEl = document.querySelector('[data-testid="senderAddress"]');
    return {
      subject: subjectEl.textContent?.trim() ?? '',
      body: bodyEl.innerHTML ?? '',
      sender: senderEl?.textContent?.trim() ?? null,
    };
  }

  injectButton(onClick: () => void): () => void {
    const existing = document.getElementById(BUTTON_ID);
    if (existing) existing.remove();

    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.className = 'e2c-fab';
    btn.title = 'Add to Calendar';
    btn.textContent = '📅 Add to Calendar';
    btn.addEventListener('click', onClick);

    const toolbar = document.querySelector(TOOLBAR_SELECTOR);
    if (toolbar) {
      toolbar.insertAdjacentElement('afterend', btn);
    } else {
      document.body.appendChild(btn);
    }

    return () => btn.remove();
  }
}
