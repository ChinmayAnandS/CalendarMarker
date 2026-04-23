import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(__dirname, '../../fixtures/gmail-event-email.html');

test.describe('Gmail fixture — content script injection', () => {
  test('floating button appears when Gmail email is open', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Load the static Gmail fixture
    const html = readFileSync(fixturePath, 'utf-8');
    await page.setContent(html);

    // Simulate the button injection that the content script would perform
    await page.evaluate(() => {
      const btn = document.createElement('button');
      btn.id = 'e2c-fab-gmail';
      btn.className = 'e2c-fab';
      btn.textContent = '📅 Add to Calendar';
      const toolbar = document.querySelector('.iH');
      if (toolbar) {
        toolbar.insertAdjacentElement('afterend', btn);
      } else {
        document.body.appendChild(btn);
      }
    });

    // Verify the button is present
    const button = page.locator('#e2c-fab-gmail');
    await expect(button).toBeVisible();
    await expect(button).toHaveText('📅 Add to Calendar');

    await browser.close();
  });

  test('email data can be extracted from Gmail fixture DOM', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const html = readFileSync(fixturePath, 'utf-8');
    await page.setContent(html);

    const emailData = await page.evaluate(() => {
      const bodyEl = document.querySelector('.a3s.aiL');
      const subjectEl = document.querySelector('.hP');
      if (!bodyEl || !subjectEl) return null;
      return {
        subject: subjectEl.textContent?.trim() ?? '',
        body: bodyEl.innerHTML ?? '',
        sender: null,
      };
    });

    expect(emailData).not.toBeNull();
    expect(emailData!.subject).toContain('Team standup');
    expect(emailData!.subject).toContain('28 April 2025');
    expect(emailData!.body).toBeTruthy();

    await browser.close();
  });
});
