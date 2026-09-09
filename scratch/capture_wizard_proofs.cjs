const { chromium } = require('c:/Users/USER/OneDrive/Desktop/EuroLink/MytriKart/node_modules/playwright-core');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\64d83a64-4358-43b2-b6f6-0f3826395690';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--window-size=1280,900']
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to Seller Registration Wizard...');
  await page.goto('http://localhost:5173/seller/register');
  await page.waitForTimeout(1000);

  // Step 1: Personal Info
  console.log('Filling Step 1 Personal Info...');
  await page.fill('input[placeholder="e.g. Aarav"]', 'Audit');
  await page.fill('input[placeholder="e.g. Sharma"]', 'Merchant');
  await page.fill('input[placeholder="aarav@business.com"]', 'audit.merchant@brand.com');
  await page.fill('input[placeholder="10-digit mobile number"]', '9876543210');
  await page.fill('input[placeholder="e.g. aarav_sharma_crafts"]', 'audit_merchant');
  await page.fill('input[placeholder="Min. 6 characters"]', 'Password123!');
  await page.fill('input[placeholder="Re-enter password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // Step 2: Business Info
  console.log('Filling Step 2 Business Info...');
  await page.fill('input[placeholder="e.g. Royal Silk & Spices"]', 'Audit Direct Store');
  await page.fill('input[placeholder="e.g. Royal Heritage Enterprises Pvt Ltd"]', 'Audit Brand Pvt Ltd');
  await page.fill('input[placeholder="e.g. 27AAAAA0000A1Z5"]', '27AAACA12341Z5');
  await page.fill('input[placeholder="CIN / Udyam / Trade License No."]', 'U74999MH2026PTC123456');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // Step 3: Store Info
  console.log('Capturing Step 3 Store Info screenshot...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'seller_register_step3_store_info.png'),
    fullPage: false
  });

  // Fill Step 3 & Continue
  await page.fill('textarea', 'Handcrafted organic spices and specialty food products from sustainable farms.');
  await page.selectOption('select', 'Organic Foods & Spices');
  await page.click('button:has-text("Organic Foods & Spices")');
  await page.fill('input[placeholder="e.g. Unit 402, Signature Tower, Industrial Estate"]', '123 Market Road');
  await page.fill('input[placeholder="e.g. Mumbai"]', 'Mumbai');
  await page.fill('input[placeholder="e.g. Maharashtra"]', 'Maharashtra');
  await page.fill('input[placeholder="e.g. 400001"]', '400001');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // Step 4: Contact Info
  console.log('Capturing Step 4 Contact Info screenshot...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'seller_register_step4_contact_info.png'),
    fullPage: false
  });

  // Fill Step 4 & Continue
  await page.fill('input[placeholder="care@yourbrand.com"]', 'support@auditbrand.com');
  await page.fill('input[placeholder="+91 8000 123 456"]', '+91 8000 123 456');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  // Step 5: Payment Details
  console.log('Capturing Step 5 Payment Details screenshot...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'seller_register_step5_payment_details.png'),
    fullPage: false
  });

  await browser.close();
  console.log('Wizard proof capture complete!');
})();
