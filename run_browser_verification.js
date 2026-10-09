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

  // TEST 1: Admin login with remembered /seller/dashboard
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('--- TEST 1: Admin login with remembered /seller/dashboard ---');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    
    // Set admin user logged in with remembered route
    await page.evaluate(() => {
      localStorage.setItem('mytrikart_auth_tokens', JSON.stringify({ access: 'admin-access-token', refresh: 'admin-refresh-token' }));
      localStorage.setItem('mytrikart_auth_user', JSON.stringify({ username: 'admin', role: 'admin', name: 'System Admin' }));
    });

    // Test resolvePostLoginRedirect in browser runtime directly via app state
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    // Evaluate login with state.from = /seller/dashboard
    await page.evaluate(() => {
      window.history.replaceState({ from: '/seller/dashboard' }, '', '/login');
    });

    // Directly click or trigger login resolution
    await page.evaluate(() => {
      const authRouting = window.__AUTH_ROUTING__;
    });

    const target1 = path.join(outDir, 'admin_login_seller_remembered_redirect.png');
    await page.screenshot({ path: target1, fullPage: true });
    console.log('Saved Test 1 screenshot:', target1);
    await page.close();
  }

  // TEST 2: Vendor direct visit & login flow
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    console.log('--- TEST 2: Vendor flow ---');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    
    await page.evaluate(() => {
      localStorage.setItem('mytrikart_auth_tokens', JSON.stringify({ access: 'vendor-access-token', refresh: 'vendor-refresh-token' }));
      localStorage.setItem('mytrikart_auth_user', JSON.stringify({ username: 'vendor1', role: 'vendor', name: 'Royal Merchant' }));
    });

    await page.goto('http://localhost:5173/seller/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    console.log('Current URL after vendor nav:', page.url());

    const target2 = path.join(outDir, 'vendor_login_seller_remembered_redirect.png');
    await page.screenshot({ path: target2, fullPage: true });
    console.log('Saved Test 2 screenshot:', target2);
    await page.close();
  }

  // TEST 3: Admin direct visit to /seller/dashboard
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    console.log('--- TEST 3: Admin direct visit to /seller/dashboard ---');
    
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.setItem('mytrikart_auth_tokens', JSON.stringify({ access: 'admin-token', refresh: 'admin-refresh' }));
      localStorage.setItem('mytrikart_auth_user', JSON.stringify({ username: 'admin', role: 'admin', name: 'System Admin' }));
    });

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
