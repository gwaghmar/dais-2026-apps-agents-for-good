import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

let testArtifactsDir: string;
let consoleLogs: string[] = [];
let consoleErrors: string[] = [];
let pageErrors: string[] = [];
let failedRequests: string[] = [];

test('smoke test - app loads and shows Referral Copilot', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Referral Copilot')).toBeVisible();
  await expect(page.getByText('Find Facilities')).toBeVisible();
});

test('smoke test - navigation links are visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Find Facilities' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Shortlist' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Dataset Overview' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'AI Copilot' })).toBeVisible();
});

test('smoke test - search page has inputs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByPlaceholder('Care need (e.g. Dialysis, Oncology, ICU...)')).toBeVisible();
  await expect(page.getByPlaceholder('Location (city or state)')).toBeVisible();
});

test('smoke test - shortlist page loads', async ({ page }) => {
  await page.goto('/shortlist');
  await expect(page.getByRole('heading', { name: 'Shortlist' })).toBeVisible();
});

test('smoke test - AI copilot page loads', async ({ page }) => {
  await page.goto('/ai');
  await expect(page.getByText('AI Copilot')).toBeVisible();
  await expect(page.getByPlaceholder('Ask about facilities, care needs, locations…')).toBeVisible();
});

test.beforeEach(async ({ page }) => {
  consoleLogs = [];
  consoleErrors = [];
  pageErrors = [];
  failedRequests = [];

  testArtifactsDir = join(process.cwd(), '.smoke-test');
  mkdirSync(testArtifactsDir, { recursive: true });

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (!text.trim() || /^%[osd]$/.test(text.trim())) return;
    const location = msg.location();
    const locationStr = location.url ? ` at ${location.url}:${location.lineNumber}:${location.columnNumber}` : '';
    consoleLogs.push(`[${type}] ${text}${locationStr}`);
    if (type === 'error') consoleErrors.push(`${text}${locationStr}`);
  });

  page.on('pageerror', (error) => {
    const errorDetails = `Page error: ${error.message}\nStack: ${error.stack || 'No stack trace available'}`;
    pageErrors.push(errorDetails);
    console.error('Page error detected:', errorDetails);
  });

  page.on('requestfailed', (request) => {
    failedRequests.push(`Failed request: ${request.url()} - ${request.failure()?.errorText}`);
  });
});

test.afterEach(async ({ page }, testInfo) => {
  const testName = testInfo.title.replace(/ /g, '-').toLowerCase();
  const screenshotPath = join(testArtifactsDir, `${testName}-app-screenshot.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const logsPath = join(testArtifactsDir, `${testName}-console-logs.txt`);
  const allLogs = [
    '=== Console Logs ===', ...consoleLogs,
    '\n=== Console Errors ===', ...consoleErrors,
    '\n=== Page Errors ===', ...pageErrors,
    '\n=== Failed Requests ===', ...failedRequests,
  ];
  writeFileSync(logsPath, allLogs.join('\n'), 'utf-8');

  if (consoleErrors.length > 0) console.log('Console errors detected:', consoleErrors);
  if (pageErrors.length > 0) console.log('Page errors detected:', pageErrors);

  await page.close();
});
