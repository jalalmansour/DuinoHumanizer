const { RotaryBrowser } = require('../paraphraser/scripts/rotary_browser.js');
const path = require('path');

const userEmail = `Dear Sir/Madam,
I hope this email finds you well.
I am writing to express my interest in learning more about the opportunities available within your organization. I would appreciate it if you could provide me with further information regarding the application process and any relevant requirements.
Thank you for your time and consideration. I look forward to hearing from you.
Kind regards,
Jalal Mansour`;

const artifactDir = path.resolve('C:/Users/jalal/.gemini/antigravity-cli/brain/581fbe91-14b1-4ee8-91d7-7f944a1cb191');

async function verifyResponsive() {
  const rb = new RotaryBrowser({ headless: true });

  // -------------------------------------------------------------
  // Test 1: Mobile Screen (390 x 844 - iPhone / Mobile)
  // -------------------------------------------------------------
  console.log('--- 1. Testing Mobile Viewport (390 x 844) ---');
  const mobilePage = await rb.newPage({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
  });
  await mobilePage.setViewportSize({ width: 390, height: 844 });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
  await mobilePage.waitForTimeout(1500);

  // Switch to Live Text tab
  const liveTab = mobilePage.locator('.mode-tab-btn:has-text("Live Text")');
  if (await liveTab.count() > 0) {
    await liveTab.click();
    await mobilePage.waitForTimeout(600);
  }

  await mobilePage.screenshot({ path: path.join(artifactDir, 'mobile_01_loaded.png'), fullPage: false });
  console.log('Captured mobile_01_loaded.png');

  // Fill in user email in the input editor
  const textarea = mobilePage.locator('.editor-textarea').first();
  await textarea.fill(userEmail);
  await mobilePage.waitForTimeout(300);

  // Click Humanize Text & Verify
  console.log('Clicking Humanize Text & Verify on Mobile...');
  const humanizeBtn = mobilePage.locator('.btn-humanize-action');
  await humanizeBtn.click();

  // Wait for completion (up to 45s)
  await mobilePage.waitForSelector('.verified-pill, .toast-badge', { timeout: 45000 });
  await mobilePage.waitForTimeout(1200);

  await mobilePage.screenshot({ path: path.join(artifactDir, 'mobile_02_email_humanized.png'), fullPage: false });
  console.log('Captured mobile_02_email_humanized.png');

  // Switch to Word Diff view
  const wordDiffBtn = mobilePage.locator('.diff-segment-btn:has-text("Word")');
  if (await wordDiffBtn.count() > 0) {
    await wordDiffBtn.click();
    await mobilePage.waitForTimeout(600);
  }

  await mobilePage.screenshot({ path: path.join(artifactDir, 'mobile_03_word_diff.png'), fullPage: false });
  console.log('Captured mobile_03_word_diff.png');

  await mobilePage.close();

  // -------------------------------------------------------------
  // Test 2: Wide Screen (1440 x 900 - Desktop Studio)
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Wide Screen Viewport (1440 x 900) ---');
  const desktopPage = await rb.newPage({
    viewport: { width: 1440, height: 900 }
  });
  await desktopPage.setViewportSize({ width: 1440, height: 900 });
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
  await desktopPage.waitForTimeout(1500);

  const dtLiveTab = desktopPage.locator('.mode-tab-btn:has-text("Live Text")');
  if (await dtLiveTab.count() > 0) {
    await dtLiveTab.click();
    await desktopPage.waitForTimeout(600);
  }

  const dtTextarea = desktopPage.locator('.editor-textarea').first();
  await dtTextarea.fill(userEmail);
  await desktopPage.waitForTimeout(300);

  const dtHumanizeBtn = desktopPage.locator('.btn-humanize-action');
  await dtHumanizeBtn.click();

  await desktopPage.waitForSelector('.verified-pill, .toast-badge', { timeout: 45000 });
  await desktopPage.waitForTimeout(1200);

  await desktopPage.screenshot({ path: path.join(artifactDir, 'wide_01_email_humanized.png'), fullPage: false });
  console.log('Captured wide_01_email_humanized.png');

  // Open Audit modal
  const auditBtn = desktopPage.locator('button:has-text("Audit")');
  if (await auditBtn.count() > 0) {
    await auditBtn.click();
    await desktopPage.waitForTimeout(700);
  }

  await desktopPage.screenshot({ path: path.join(artifactDir, 'wide_02_audit_modal.png'), fullPage: false });
  console.log('Captured wide_02_audit_modal.png');

  await desktopPage.close();
  await rb.close();
  console.log('All responsive Playwright tests completed successfully!');
}

verifyResponsive().catch(console.error);
