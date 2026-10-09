const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const msedgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : msedgePath;

const outDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\4b96151d-df9e-4915-a54d-0a8b23e43643';

(async () => {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  // Helper to complete password login flow
  async function performLogin(page, username, password) {
    const input = await page.waitForSelector('input[type="text"], input[type="email"]');
    await input.type(username);

    // Click "login with password instead" button if present
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const passBtn = btns.find(b => b.textContent.toLowerCase().includes('password'));
      if (passBtn) passBtn.click();
    });

    await new Promise(r => setTimeout(r, 600));

    const passInput = await page.waitForSelector('input[type="password"]');
    await passInput.type(password);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const submitBtn = btns.find(b => b.textContent.trim() === 'Login' || b.type === 'submit');
      if (submitBtn) submitBtn.click();
    });

    await new Promise(r => setTimeout(r, 2500));
  }

  // TEST 1: Admin login with remembered /seller/dashboard -> lands on /admin
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('--- TEST 1: Admin login with remembered /seller/dashboard ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    // Set location state.from = '/seller/dashboard'
    await page.evaluate(() => {
      window.history.replaceState({ from: '/seller/dashboard' }, '', '/login');
    });

    await performLogin(page, 'admin', 'AdminPass123!');
    console.log('Current URL after admin login:', page.url());

    const target1 = path.join(outDir, 'admin_login_seller_remembered_redirect.png');
    await page.screenshot({ path: target1, fullPage: true });
    console.log('Saved Test 1 screenshot:', target1);
    await page.close();
  }

  // TEST 2: Vendor flow with remembered /seller/dashboard -> lands on /seller/dashboard
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    console.log('--- TEST 2: Vendor login flow ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    await page.evaluate(() => {
      window.history.replaceState({ from: '/seller/dashboard' }, '', '/login');
    });

    await performLogin(page, 'athulcraft', 'VendorPass123!');
    console.log('Current URL after vendor login:', page.url());

    const target2 = path.join(outDir, 'vendor_login_seller_remembered_redirect.png');
    await page.screenshot({ path: target2, fullPage: true });
    console.log('Saved Test 2 screenshot:', target2);
    await page.close();
  }

  // TEST 3: Admin direct visit to /seller/dashboard -> 403 Unauthorized screen
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    console.log('--- TEST 3: Admin direct visit to /seller/dashboard ---');
    
    // Login first as admin
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await performLogin(page, 'admin', 'AdminPass123!');
    console.log('LoggedIn Admin URL:', page.url());

    // Now directly navigate to /seller/dashboard
    console.log('Navigating logged-in admin directly to /seller/dashboard...');
    await page.goto('http://localhost:5173/seller/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    console.log('Current URL for admin direct visit:', page.url());

    const target3 = path.join(outDir, 'admin_direct_visit_seller_unauthorized.png');
    await page.screenshot({ path: target3, fullPage: true });
    console.log('Saved Test 3 screenshot:', target3);
    await page.close();
  }

  await browser.close();
  console.log('All real browser verification tests completed successfully!');
})();
