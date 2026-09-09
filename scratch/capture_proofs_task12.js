const { chromium } = require('c:/Users/USER/OneDrive/Desktop/EuroLink/MytriKart/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\64d83a64-4358-43b2-b6f6-0f3826395690';
const SCRATCH_DIR = path.join(ARTIFACTS_DIR, 'scratch');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--window-size=1280,900']
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to login...');
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(1000);

  // Login as dummy seller
  await page.fill('input[type="text"], input[type="email"]', 'dummy-seller-f40a98fd');
  await page.click('button:has-text("Login with Password")');
  await page.waitForTimeout(500);
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Create 2 distinct test PNG images
  if (!fs.existsSync(SCRATCH_DIR)) fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  const img1Path = path.join(SCRATCH_DIR, 'test_studio_asset_1.png');
  const img2Path = path.join(SCRATCH_DIR, 'test_studio_asset_2.png');

  // Red pixel PNG & Blue pixel PNG
  const redPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const bluePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

  fs.writeFileSync(img1Path, redPng);
  fs.writeFileSync(img2Path, bluePng);

  // Navigate to Add Product Page
  console.log('Navigating to Add Product / Studio Gallery...');
  await page.goto('http://localhost:5173/seller/products/new');
  await page.waitForTimeout(1500);

  // Scroll to Studio Gallery Section
  const mediaSection = page.locator('section:has-text("4. Studio Gallery & Visual Media")');
  await mediaSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // Upload 2 images
  console.log('Uploading 2 images...');
  const fileInput = mediaSection.locator('input[type="file"]');
  await fileInput.setInputFiles([img1Path, img2Path]);
  await page.waitForTimeout(2500);

  // Screenshot 1: Uploaded 2 images in grid
  console.log('Capturing multi-image upload grid screenshot...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'seller_multi_image_upload_grid.png'),
    fullPage: false
  });

  // Click "Set Primary" on the 2nd image if available
  console.log('Setting 2nd image as primary...');
  const setPrimaryBtns = mediaSection.locator('button:has-text("Set Primary")');
  if (await setPrimaryBtns.count() > 0) {
    await setPrimaryBtns.first().click();
    await page.waitForTimeout(1500);
  }

  // Screenshot 2: Updated Primary selection
  console.log('Capturing updated primary selection screenshot...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'seller_primary_image_selected.png'),
    fullPage: false
  });

  // Navigate to Product Catalog List
  console.log('Navigating to Seller Products Catalog...');
  await page.goto('http://localhost:5173/seller/products');
  await page.waitForTimeout(1500);

  // Screenshot 3: Catalog list with View Detail link
  console.log('Capturing product catalog list screenshot...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'seller_products_catalog_list.png'),
    fullPage: false
  });

  // Click "View Detail" or first product link
  console.log('Navigating to Single Product Detail Page...');
  const viewDetailBtn = page.locator('a:has-text("View Detail")').first();
  if (await viewDetailBtn.isVisible()) {
    await viewDetailBtn.click();
    await page.waitForTimeout(2000);
  } else {
    await page.goto('http://localhost:5173/seller/products/1');
    await page.waitForTimeout(2000);
  }

  // Screenshot 4: Single Product Detail Page
  console.log('Capturing Single Product Detail Page screenshot...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'seller_product_detail_page.png'),
    fullPage: false
  });

  await browser.close();
  console.log('Proof capture completed successfully!');
})();
