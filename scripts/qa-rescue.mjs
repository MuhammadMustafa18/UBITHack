import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const base = process.env.QA_URL || 'http://127.0.0.1:4173';
const executablePath = process.env.CHROME_PATH || [
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync);
const browser = await puppeteer.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  await page.setViewport({ width: 1366, height: 768 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.url() === `${base}/__qa_rescue__`) {
      request.respond({ contentType: 'text/html', body: '<!doctype html><html lang="en"><title>Rescue QA</title><body style="margin:0"></body></html>' });
    } else request.continue();
  });
  await page.goto(`${base}/__qa_rescue__`, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: readFileSync('src/ui/styles/rescue-dashboard.css', 'utf8') });
  await page.evaluate(async () => {
    const { RescueDashboardUI } = await import('/src/ui/rescueDashboard.js');
    const { ResourceDefenseGame } = await import('/src/simulation/resourceDefenseGame.js');
    window.game = new ResourceDefenseGame(null, null);
    window.dashboard = new RescueDashboardUI({ resourceDefenseGame: window.game,
      tacticalAiCommander: { config: {} },
      onReturnToMap: () => { window.returnedToMap = true; window.dashboard.unmount(); },
      onLocateOnGlobe: (incident) => { window.locatedIncident = incident.id; },
    });
    window.dashboard.mount();
  });
  await page.waitForSelector('#rescue-dispatch');
  await page.click('[data-filter="supply"]');
  assert.equal(await page.$$eval('.rescue-incident-card', (cards) => cards.length), 1);
  await page.click('[data-filter="all"]');
  await page.click('#rescue-access');
  assert.equal(await page.$eval('#rescue-dispatch', (button) => button.disabled), true);
  await page.click('#rescue-access');
  await page.click('#rescue-dispatch');
  assert.equal(await page.evaluate(() => window.game.pool.boats), 39);
  assert.match(await page.$eval('.rescue-assignment-status', (el) => el.textContent), /EN ROUTE/);
  await page.evaluate(() => { window.game.dispatches[0].startTime -= 15000; window.game._updateDispatches(); });
  assert.equal(await page.$eval('#rescue-complete', (button) => button.disabled), false);
  await page.click('#rescue-complete');
  assert.equal(await page.evaluate(() => window.game.pool.boats), 40);
  assert.match(await page.$eval('.rescue-assignment-status', (el) => el.textContent), /COMPLETED/);
  await page.click('#rescue-inject');
  const count = await page.evaluate(() => window.dashboard.signals.length);
  await page.click('#rescue-inject');
  assert.equal(await page.evaluate(() => window.dashboard.signals.length), count);
  assert.equal(await page.evaluate(() => window.game.incidentAssignments.size), 1);
  await page.type('#rescue-copilot-input', 'Which incident should be helped first?');
  await page.click('#rescue-copilot-form [type="submit"]');
  await page.waitForFunction(() => document.querySelector('.gemini-chat-messages').textContent.includes('Rule-based context')).catch(async (error) => {
    console.log('Copilot state:', await page.evaluate(() => ({ messages: window.dashboard.chatMessages,
      busy: window.dashboard.chatBusy, input: document.querySelector('#rescue-copilot-input').value,
      form: document.querySelector('#rescue-copilot-form').innerText })), errors);
    throw error;
  });
  assert.equal(await page.evaluate(() => window.game.incidentAssignments.size), 1);
  await page.click('#rescue-locate');
  assert.ok(await page.evaluate(() => window.locatedIncident));
  await page.click('.rescue-report-form summary');
  await page.type('#report-message', 'Bachay pani mein phansay hain');
  // Check a rejected AI request without a paid provider call.
  await page.setRequestInterception(false);
  await page.setRequestInterception(true);
  page.removeAllListeners('request');
  page.on('request', (request) => request.url().endsWith('/api/openai/rescue-triage')
    ? request.respond({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'AI unavailable. Set fields manually.' }) })
    : request.continue());
  await page.click('#rescue-ai-extract');
  await page.waitForFunction(() => document.querySelector('#rescue-ai-status').textContent.includes('manually'));
  await page.type('#report-district', '<img src=x onerror=alert(1)> Test district');
  await page.type('#report-lon', '71.98');
  await page.type('#report-lat', '34.01');
  await page.select('#report-danger', 'medical');
  await page.click('#rescue-report-form [type="submit"]');
  assert.equal(await page.evaluate(() => window.dashboard.signals.length), count + 1);
  assert.equal(await page.$$('.rescue-detail-card img').then((items) => items.length), 0);
  await page.click('#rescue-review-next');
  await page.click('.rescue-report-form summary');
  await page.type('#report-message', 'Draft must survive a resource update');
  await page.evaluate(() => { window.game.pool.boats -= 1; window.game._notify(); });
  assert.match(await page.$eval('#report-message', (el) => el.value), /Draft must survive/);
  await page.click('.rescue-report-form summary');
  await page.evaluate(() => {
    window.game.pool.boats += 1;
    window.game._notify();
    document.activeElement?.blur();
    document.querySelector('.rescue-detail-column').scrollTop = 0;
  });
  const output = process.env.QA_OUTPUT_DIR || 'qa-shots/rescue';
  mkdirSync(output, { recursive: true });
  await page.screenshot({ path: path.join(output, 'desktop.png') });
  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(output, 'mobile.png'), fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert.equal(overflow, false, 'Mobile viewport must not overflow horizontally');
  await page.click('#btn-return-globe');
  assert.equal(await page.evaluate(() => window.returnedToMap), true);
  await page.evaluate(() => { window.dashboard.mount(); window.dashboard.destroy(); window.game.destroy(); });
  assert.equal(await page.$('#rescue-dashboard-container'), null);
  assert.deepEqual(errors, []);
  console.log('PASS: filters, access, shared dispatch/arrival/completion, deduplication, new reports, AI fallback, escaping, draft preservation, responsive layout and navigation.');
} finally {
  await browser.close();
}
