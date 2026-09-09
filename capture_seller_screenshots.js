import { chromium } from 'playwright';
import path from 'path';

async function capture() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Login as dummy seller
  await page.goto('http://localhost:5173/seller/dashboard');
  await page.waitForTimeout(2000);

  // Take screenshot 1: Dashboard with real store name & GSTIN
  await page.screenshot({ path: 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\64d83a64-4358-43b2-b6f6-0f3826395690\\seller_dashboard_real_profile.png' });
  console.log("Captured seller_dashboard_real_profile.png");

  // Navigate to Settlements
  await page.goto('http://localhost:5173/seller/settlements');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\64d83a64-4358-43b2-b6f6-0f3826395690\\seller_settlements_real_wallet.png' });
  console.log("Captured seller_settlements_real_wallet.png");

  // Click Sign Out
  await page.goto('http://localhost:5173/seller/dashboard');
  await page.waitForTimeout(1000);
  const signOutBtn = page.locator('button:has-text("Sign Out")').first();
  if (await signOutBtn.isVisible()) {
    await signOutBtn.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\64d83a64-4358-43b2-b6f6-0f3826395690\\seller_sign_out_cleared.png' });
  console.log("Captured seller_sign_out_cleared.png");

  await browser.close();
}

capture().catch(err => console.error("Capture error:", err));
