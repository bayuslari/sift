import type { Message } from '../shared/messages';

export const hasChrome =
  typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;

/** Promise wrapper around chrome.runtime.sendMessage; resolves undefined off-extension. */
export function send(msg: Message): Promise<Message | undefined> {
  if (!hasChrome) return Promise.resolve(undefined);
  return chrome.runtime.sendMessage(msg).catch(() => undefined);
}

/** Subscribe to local storage changes (history/stats/etc). Returns an unsubscribe fn. */
export function onStorageChanged(fn: () => void): () => void {
  if (!hasChrome || !chrome.storage?.onChanged) return () => {};
  const handler = (_changes: unknown, area: string) => {
    if (area === 'local') fn();
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}
