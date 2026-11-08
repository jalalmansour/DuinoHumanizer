const fs = require('fs');
const path = require('path');
const { RotaryBrowser } = require('../paraphraser/scripts/rotary_browser.js');

const ARTIFACT_DIR = 'C:\\Users\\jalal\\.gemini\\antigravity-cli\\brain\\581fbe91-14b1-4ee8-91d7-7f944a1cb191';
const LIVE_URL = 'https://duinizer.vercel.app';

const userEmail = `Dear Sir/Madam,
I hope this email finds you well.
I am writing to express my interest in learning more about the opportunities available within your organization. I would appreciate it if you could provide me with further information regarding the application process and any relevant requirements.
Thank you for your time and consideration. I look forward to hearing from you.
Kind regards,
Jalal Mansour`;

async function verifyLiveVercel() {
  console.log(`======================================================================`);
  console.log(`STARTING LIVE VERCEL VERIFICATION ON: ${LIVE_URL}`);
  console.log(`======================================================================\n`);

  const rb = new RotaryBrowser({ headless: true });

  // -------------------------------------------------------------
  // Test 1: Desktop / Wide Screen (1440 x 900)
  // -------------------------------------------------------------
  console.log('[Phase 1] Desktop Wide Screen Viewport (1440 x 900)...');
  const desktopPage = await rb.newPage();
  await desktopPage.setViewportSize({ width: 1440, height: 900 });

  console.log(`Navigating to ${LIVE_URL}...`);
  await desktopPage.goto(LIVE_URL, { waitUntil: 'domcontentloaded', timeout: 35000 });
  await desktopPage.waitForSelector('.split-panel', { timeout: 15000 });
  await desktopPage.waitForTimeout(1000);

  // Switch to Live Text tab
  const dtLiveTab = desktopPage.locator('.mode-tab-btn:has-text("Live Text")');
  if (await dtLiveTab.count() > 0) {
    await dtLiveTab.click();
    await desktopPage.waitForTimeout(400);
  }

  // Enter user email
  console.log('Entering user email into desktop studio textarea...');
  const dtTextarea = desktopPage.locator('.editor-textarea').first();
  await dtTextarea.fill(userEmail);
  await desktopPage.waitForTimeout(400);

  // Click Humanize & Verify
  console.log('Clicking Humanize Text & Verify on Desktop...');
  const dtHumanizeBtn = desktopPage.locator('.btn-humanize-action');
  await dtHumanizeBtn.click();

  console.log('Waiting for ZeroGPT verification to complete...');
  await desktopPage.waitForFunction(() => {
    const btn = document.querySelector('.btn-humanize-action');
    return btn && !btn.textContent.includes('Humanizing...') && !btn.disabled;
  }, { timeout: 45000 });
  await desktopPage.waitForTimeout(1500);

  const shot1 = path.join(ARTIFACT_DIR, '01_live_vercel_desktop_email_reading.png');
  await desktopPage.screenshot({ path: shot1, fullPage: false });
  console.log(`Saved Desktop Reading View: ${shot1}`);

  // Switch to Word Diff
  const dtWordDiffBtn = desktopPage.locator('.diff-segment-btn:has-text("Word")');
  if (await dtWordDiffBtn.count() > 0) {
    await dtWordDiffBtn.click();
    await desktopPage.waitForTimeout(600);
    const shot2 = path.join(ARTIFACT_DIR, '02_live_vercel_desktop_word_diff.png');
    await desktopPage.screenshot({ path: shot2, fullPage: false });
    console.log(`Saved Desktop Word Diff: ${shot2}`);
  }

  // Open Audit Modal
  const dtAuditBtn = desktopPage.locator('button:has-text("Audit")');
  if (await dtAuditBtn.count() > 0) {
    await dtAuditBtn.click();
    await desktopPage.waitForTimeout(700);
    const shot3 = path.join(ARTIFACT_DIR, '03_live_vercel_desktop_audit_modal.png');
    await desktopPage.screenshot({ path: shot3, fullPage: false });
    console.log(`Saved Desktop Audit Modal: ${shot3}`);

    // Close modal
    const closeBtn = desktopPage.locator('.modal-close, button:has-text("Close")');
    if (await closeBtn.count() > 0) await closeBtn.first().click();
    await desktopPage.waitForTimeout(300);
  }

  // -------------------------------------------------------------
  // Test 2: Mobile Viewport (390 x 844 - iPhone / Mobile)
  // -------------------------------------------------------------
  console.log('\n[Phase 2] Mobile Viewport (390 x 844)...');
  await desktopPage.setViewportSize({ width: 390, height: 844 });
  await desktopPage.waitForTimeout(800);

  const shot4 = path.join(ARTIFACT_DIR, '04_live_vercel_mobile_loaded.png');
  await desktopPage.screenshot({ path: shot4, fullPage: false });
  console.log(`Saved Mobile Initial View: ${shot4}`);

  // Test mobile humanization
  console.log('Testing mobile humanize button touch target & spacing...');
  const mobHumanizeBtn = desktopPage.locator('.btn-humanize-action');
  await mobHumanizeBtn.click();

  await desktopPage.waitForFunction(() => {
    const btn = document.querySelector('.btn-humanize-action');
    return btn && !btn.textContent.includes('Humanizing...') && !btn.disabled;
  }, { timeout: 45000 });
  await desktopPage.waitForTimeout(1500);

  const shot5 = path.join(ARTIFACT_DIR, '05_live_vercel_mobile_email_humanized.png');
  await desktopPage.screenshot({ path: shot5, fullPage: false });
  console.log(`Saved Mobile Humanized View: ${shot5}`);

  // Switch to Word diff on mobile
  const mobWordDiffBtn = desktopPage.locator('.diff-segment-btn:has-text("Word")');
  if (await mobWordDiffBtn.count() > 0) {
    await mobWordDiffBtn.click();
    await desktopPage.waitForTimeout(600);
    const shot6 = path.join(ARTIFACT_DIR, '06_live_vercel_mobile_word_diff.png');
    await desktopPage.screenshot({ path: shot6, fullPage: false });
    console.log(`Saved Mobile Word Diff View: ${shot6}`);
  }

  await desktopPage.close();
  await rb.close();
  console.log(`\n======================================================================`);
  console.log(`LIVE VERCEL VERIFICATION ACROSS DESKTOP & MOBILE COMPLETED SUCCESSFULLY!`);
  console.log(`======================================================================`);
}

verifyLiveVercel().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
