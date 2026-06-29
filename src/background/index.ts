import type { Message } from '../shared/messages';
import { draftProposal } from '../core/llm/gemini';
import { processJobs, type PipelineDeps } from './pipeline';
import {
  seedDefaults,
  getProfile,
  getRules,
  getApiKey,
  getHistory,
  setHistory,
  getStats,
  setStats,
  getEnabled,
  setEnabled,
} from './storage';

const RESCAN_ALARM = 'rescan';
const HOST_GLOBS = [
  'https://*.upwork.com/*',
  'https://*.linkedin.com/*',
  'https://weworkremotely.com/*',
  'https://remoteok.com/*',
];

const deps: PipelineDeps = {
  getProfile,
  getRules,
  getApiKey,
  getHistory,
  saveHistory: setHistory,
};

chrome.runtime.onInstalled.addListener(async () => {
  await seedDefaults();
  chrome.alarms.create(RESCAN_ALARM, { periodInMinutes: 15 });
  const stats = await getStats();
  updateBadge(stats.matches);
});

chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse) => {
  void handle(msg, sendResponse);
  return true; // keep the message channel open for async replies
});

async function handle(msg: Message, reply: (r?: Message) => void): Promise<void> {
  switch (msg.type) {
    case 'JOBS_FOUND':
      await onJobsFound(msg.jobs);
      break;
    case 'GET_STATE': {
      const [history, stats] = await Promise.all([getHistory(), getStats()]);
      reply({
        type: 'STATE',
        matches: history.filter((j) => j.verdict === 'GOOD'),
        history,
        stats,
      });
      break;
    }
    case 'GENERATE_PROPOSAL':
      await onGenerateProposal(msg.jobId, reply);
      break;
    case 'TOGGLE_ENABLED': {
      await setEnabled(msg.enabled);
      const stats = await getStats();
      await setStats({ ...stats, enabled: msg.enabled });
      break;
    }
    default:
      break;
  }
}

async function onJobsFound(jobs: import('../core/types').Job[]): Promise<void> {
  if (!(await getEnabled())) return;
  const result = await processJobs(jobs, deps);
  const history = await getHistory();
  const matches = history.filter((j) => j.verdict === 'GOOD').length;
  const prev = await getStats();
  await setStats({
    enabled: true,
    lastCheck: Date.now(),
    checksRun: prev.checksRun + result.scannedCount,
    matches,
    llmError: result.llmError,
  });
  updateBadge(matches);
  if (result.newMatches.length) {
    notify(result.newMatches.length);
  }
}

async function onGenerateProposal(jobId: string, reply: (r?: Message) => void): Promise<void> {
  const history = await getHistory();
  const job = history.find((j) => j.id === jobId);
  if (!job) return reply({ type: 'PROPOSAL_READY', jobId, error: 'Job not found' });
  const apiKey = await getApiKey();
  if (!apiKey) {
    return reply({ type: 'PROPOSAL_READY', jobId, error: 'Add a Gemini key in Settings to draft proposals' });
  }
  try {
    const profile = await getProfile();
    const proposal = await draftProposal(job, profile, apiKey);
    job.proposal = proposal;
    await setHistory(history);
    reply({ type: 'PROPOSAL_READY', jobId, proposal });
  } catch (e) {
    reply({ type: 'PROPOSAL_READY', jobId, error: (e as Error).message });
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== RESCAN_ALARM) return;
  if (!(await getEnabled())) return;
  const tabs = await chrome.tabs.query({ url: HOST_GLOBS });
  for (const tab of tabs) {
    if (tab.id !== undefined) {
      chrome.tabs.sendMessage(tab.id, { type: 'RESCAN' } satisfies Message).catch(() => {});
    }
  }
});

function updateBadge(count: number): void {
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
}

function notify(count: number): void {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('public/icon-128.png'),
    title: 'Sift',
    message: count === 1 ? '1 new match worth your time' : `${count} new matches worth your time`,
    priority: 1,
  });
}
