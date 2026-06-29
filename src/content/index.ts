import { adapterFor } from '../adapters/adapter';
import '../adapters/upwork';
import '../adapters/linkedin';
import '../adapters/remote';
import type { Message } from '../shared/messages';

const adapter = adapterFor(location.href);

if (adapter) {
  let lastSent = '';

  const scan = () => {
    let jobs;
    try {
      jobs = adapter.parse(document);
    } catch (e) {
      console.debug('[Sift] parse error', e);
      return;
    }
    if (!jobs.length) return;
    const signature = jobs.map((j) => j.id).join('|');
    if (signature === lastSent) return; // nothing new since last scan
    lastSent = signature;
    chrome.runtime.sendMessage({ type: 'JOBS_FOUND', jobs } satisfies Message).catch(() => {});
  };

  // Initial scan once the page settles.
  scan();

  // Debounced re-scan on DOM changes (infinite scroll / SPA navigation).
  let timer: ReturnType<typeof setTimeout> | undefined;
  const observer = new MutationObserver(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(scan, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Manual rescan requested by the background alarm.
  chrome.runtime.onMessage.addListener((msg: Message) => {
    if (msg.type === 'RESCAN') {
      lastSent = ''; // force a resend
      scan();
    }
  });
}
