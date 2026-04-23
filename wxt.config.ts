import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Email to Calendar',
    description: 'Add calendar events from emails — works fully offline.',
    version: '1.0.0',
    permissions: ['storage', 'downloads', 'tabs', 'activeTab', 'scripting'],
    host_permissions: [
      'https://mail.google.com/*',
      'https://outlook.live.com/*',
      'https://outlook.office.com/*',
      'https://mail.yahoo.com/*',
      'https://www.icloud.com/*',
    ],
    icons: {
      '16': 'icons/icon-16.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png',
    },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
  },
});
