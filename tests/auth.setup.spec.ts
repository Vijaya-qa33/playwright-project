import { test, expect } from '@playwright/test';
import type { Frame, Page, BrowserContext } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { testData } from '../utils/temp';

const authFile = path.resolve(
  process.cwd(),
  'playwright',
  '.auth',
  'amazon.json'
);

const authCheckpointPath = /\/ap\/signin|\/ap\/cvf\//i;
const transactionApprovalPath = /\/ap\/cvf\/transactionapproval/i;
const amazonAuthCookies = new Set([
  'session-token',
  'at-acbin',
  'sess-at-acbin'
]);

function isAuthenticationCheckpoint(url: URL): boolean {
  return authCheckpointPath.test(url.pathname);
}

async function verifySignedIn(
  page: Page,
  context: BrowserContext
): Promise<void> {
  if (isAuthenticationCheckpoint(new URL(page.url()))) {
    throw new Error(
      `Amazon authentication is still pending at ${new URL(page.url()).pathname}`
    );
  }

  const accountLabel = page.locator(
    '#nav-link-accountList-nav-line-1'
  );

  await expect(accountLabel).toBeVisible({
    timeout: 30000
  });
  await expect(accountLabel).not.toContainText(/sign in/i, {
    timeout: 30000
  });

  const cookies = await context.cookies('https://www.amazon.in');
  const hasAmazonAuthCookie = cookies.some(cookie =>
    cookie.domain.endsWith('amazon.in') &&
    amazonAuthCookies.has(cookie.name)
  );

  if (!hasAmazonAuthCookie) {
    throw new Error(
      'Amazon showed a signed-in account label, but no Amazon authentication cookie was present. Storage state was not saved.'
    );
  }
}

test('Amazon login and save authentication', async ({ page, context }) => {
  test.setTimeout(480000);

  await page.goto(testData.baseUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  const continueButton = page.getByRole('button', {
    name: /continue shopping/i
  }).first();

  if (await continueButton.isVisible()) {
    await continueButton.click();
  }

  await page.locator('#nav-link-accountList').click();

  const phoneField = page.locator(
    'input[type="tel"], input[name="email"], input#ap_email'
  ).first();

  await phoneField.waitFor({
    state: 'visible',
    timeout: 30000
  });
  await phoneField.fill(testData.phoneNumber);

  await page.getByRole('button', {
    name: /continue/i
  }).click();

  const passwordField = page.locator(
    '#ap_password, input[name="password"]'
  ).first();

  await passwordField.waitFor({
    state: 'visible',
    timeout: 30000
  });
  await passwordField.fill(testData.password);

  let approvalNoticeShown = false;
  const announceTransactionApproval = (frame: Frame): void => {
    if (
      frame === page.mainFrame() &&
      transactionApprovalPath.test(new URL(frame.url()).pathname) &&
      !approvalNoticeShown
    ) {
      approvalNoticeShown = true;
      console.info(
        'Amazon requires transaction approval. Approve the notification in the Amazon Shopping App; this test will wait and will not save state until approval completes.'
      );
    }
  };

  page.on('framenavigated', announceTransactionApproval);

  try {
    await page.locator('#signInSubmit').click();

    if (transactionApprovalPath.test(new URL(page.url()).pathname)) {
      announceTransactionApproval(page.mainFrame());
    }

    await page.waitForURL(
      url => !isAuthenticationCheckpoint(url),
      { timeout: 240000 }
    );
  } finally {
    page.off('framenavigated', announceTransactionApproval);
  }

  await page.goto(testData.baseUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  await verifySignedIn(page, context);

  await mkdir(path.dirname(authFile), {
    recursive: true
  });
  await context.storageState({
    path: authFile
  });
});
