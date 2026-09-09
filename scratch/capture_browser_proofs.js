import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\64d83a64-4358-43b2-b6f6-0f3826395690';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const { resolve, reject } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

(async () => {
  console.log('Starting Edge CDP Browser Verification with Verified Credentials...');
  
  const edgeProc = spawn(EDGE_PATH, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,960',
    'about:blank'
  ]);

  await sleep(2000);

  try {
    const versionRes = await fetch('http://127.0.0.1:9222/json/version');
    const versionData = await versionRes.json();
    console.log('Connected to Edge CDP:', versionData.Browser);

    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    const pages = await listRes.json();
    const targetPage = pages.find((p) => p.type === 'page');

    const client = new CDPClient(targetPage.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Network.enable');

    const takeScreenshot = async (filename) => {
      const { data } = await client.send('Page.captureScreenshot', { format: 'png' });
      const filePath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
      console.log(`Saved screenshot: ${filename}`);
    };

    const evaluate = async (expression) => {
      const res = await client.send('Runtime.evaluate', { expression, returnByValue: true });
      return res.result?.value;
    };

    const typeIntoElement = async (selector, text) => {
      await evaluate(`document.querySelector('${selector}')?.focus()`);
      await client.send('Input.insertText', { text });
      await sleep(200);
    };

    // -------------------------------------------------------------
    // SCENARIO 1: Customer Login -> / (Marketplace Home)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 1: Customer Login ---');
    await evaluate('localStorage.clear(); sessionStorage.clear();');
    await client.send('Page.navigate', { url: 'http://localhost:5173/login' });
    await sleep(2000);

    await typeIntoElement('#user-identifier', 'Athulb');
    await evaluate(`
      const passBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Login with Password instead'));
      if (passBtn) passBtn.click();
    `);
    await sleep(1000);

    await typeIntoElement('#user-password', 'AthulbPass123!');
    await evaluate(`
      const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b => b.textContent.trim() === 'Login');
      if (submitBtn) submitBtn.click();
    `);
    await sleep(4000);

    const custUrl = await evaluate('window.location.href');
    console.log('Customer Post-Login URL:', custUrl);

    // Verify UI gating on Home page
    const reviewerBarExists = await evaluate(`Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('UX Prototype: Design Review Controls'))`);
    const sellerHubBtnExists = await evaluate(`Array.from(document.querySelectorAll('button, a')).some(el => el.textContent && el.textContent.includes('Open Seller Hub Dashboard'))`);
    const adminOpsBtnExists = await evaluate(`Array.from(document.querySelectorAll('button, a')).some(el => el.textContent && el.textContent.includes('Admin Ops'))`);

    console.log('Customer Home Page Link Gating Checks:');
    console.log('  ReviewerTopBar visible:', reviewerBarExists);
    console.log('  Seller Hub Dashboard button visible:', sellerHubBtnExists);
    console.log('  Admin Ops button visible:', adminOpsBtnExists);

    await takeScreenshot('customer_home_clean_ui.png');

    // -------------------------------------------------------------
    // SCENARIO 2: Logged-Out Customer attempts /seller/dashboard -> /login -> Customer Login -> / (Home)
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: Cross-Role Redirect Bouncing (Customer trying /seller/dashboard) ---');
    await evaluate('localStorage.clear(); sessionStorage.clear();');
    await client.send('Page.navigate', { url: 'http://localhost:5173/seller/dashboard' });
    await sleep(2000);

    const bouncedUrl = await evaluate('window.location.href');
    console.log('Bounced URL (should be /login):', bouncedUrl);

    await typeIntoElement('#user-identifier', 'Athulb');
    await evaluate(`
      const passBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Login with Password instead'));
      if (passBtn) passBtn.click();
    `);
    await sleep(1000);

    await typeIntoElement('#user-password', 'AthulbPass123!');
    await evaluate(`
      const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b => b.textContent.trim() === 'Login');
      if (submitBtn) submitBtn.click();
    `);
    await sleep(4000);

    const finalCustUrl = await evaluate('window.location.href');
    console.log('Customer Bounced Post-Login URL (must be / with 0 error):', finalCustUrl);

    await takeScreenshot('customer_bounced_from_seller_lands_on_home.png');

    // -------------------------------------------------------------
    // SCENARIO 3: Logged-Out Vendor attempts /seller/dashboard -> /login -> Vendor Login -> /seller/dashboard
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: Legitimate Preserved Destination (Vendor accessing /seller/dashboard) ---');
    await evaluate('localStorage.clear(); sessionStorage.clear();');
    await client.send('Page.navigate', { url: 'http://localhost:5173/seller/dashboard' });
    await sleep(2000);

    await typeIntoElement('#user-identifier', 'athulcraft');
    await evaluate(`
      const passBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Login with Password instead'));
      if (passBtn) passBtn.click();
    `);
    await sleep(1000);

    await typeIntoElement('#user-password', 'VendorPass123!');
    await evaluate(`
      const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b => b.textContent.trim() === 'Login');
      if (submitBtn) submitBtn.click();
    `);
    await sleep(4000);

    const vendorPostLoginUrl = await evaluate('window.location.href');
    console.log('Vendor Post-Login URL (must be /seller/dashboard):', vendorPostLoginUrl);

    await takeScreenshot('vendor_preserved_destination_held.png');

    // -------------------------------------------------------------
    // SCENARIO 4: Admin Login -> /admin
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: Admin Login -> /admin ---');
    await evaluate('localStorage.clear(); sessionStorage.clear();');
    await client.send('Page.navigate', { url: 'http://localhost:5173/login' });
    await sleep(2000);

    await typeIntoElement('#user-identifier', 'admin');
    await evaluate(`
      const passBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Login with Password instead'));
      if (passBtn) passBtn.click();
    `);
    await sleep(1000);

    await typeIntoElement('#user-password', 'AdminPass123!');
    await evaluate(`
      const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b => b.textContent.trim() === 'Login');
      if (submitBtn) submitBtn.click();
    `);
    await sleep(4000);

    const adminPostLoginUrl = await evaluate('window.location.href');
    console.log('Admin Post-Login URL (must be /admin):', adminPostLoginUrl);

    await takeScreenshot('admin_lands_on_admin_dashboard.png');

    client.close();
  } catch (err) {
    console.error('CDP script error:', err);
  } finally {
    edgeProc.kill();
  }
})();
