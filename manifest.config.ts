import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'Sift — AI Job Filter & Scorer for Upwork, LinkedIn & Remote Jobs',
  short_name: 'Sift',
  version: '0.1.0',
  description:
    'Auto-score every job 1-10 against your stack, flag red flags, and skip the noise.',
  icons: {
    '16': 'public/icon-16.png',
    '48': 'public/icon-48.png',
    '128': 'public/icon-128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_icon: {
      '16': 'public/icon-16.png',
      '48': 'public/icon-48.png',
      '128': 'public/icon-128.png',
    },
  },
  background: { service_worker: 'src/background/index.ts', type: 'module' },
  permissions: ['storage', 'alarms', 'notifications'],
  host_permissions: [
    'https://*.upwork.com/*',
    'https://*.linkedin.com/*',
    'https://weworkremotely.com/*',
    'https://remoteok.com/*',
  ],
  content_scripts: [
    {
      matches: [
        'https://*.upwork.com/*',
        'https://*.linkedin.com/*',
        'https://weworkremotely.com/*',
        'https://remoteok.com/*',
      ],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
});
