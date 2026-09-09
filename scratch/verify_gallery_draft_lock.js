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
  console.log('Starting Edge CDP Gallery Draft Lock Verification...');
  
  const edgeProc = spawn(EDGE_PATH, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--disable-gpu',
    '--window-size=1280,960',
    'about:blank'
  ]);

  let versionRes = null;
  for (let i = 0; i < 10; i++) {
    await sleep(1000);
    try {
      versionRes = await fetch('http://127.0.0.1:9222/json/version');
      if (versionRes.ok) break;
    } catch {}
  }

  try {
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
    // Step 1: Login as Vendor (athulcraft / VendorPass123!)
    // -------------------------------------------------------------
    console.log('\n--- Step 1: Vendor Login ---');
    await evaluate('localStorage.clear(); sessionStorage.clear();');
    await client.send('Page.navigate', { url: 'http://localhost:5173/login' });
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
    await sleep(3500);

    const postLoginUrl = await evaluate('window.location.href');
    console.log('Vendor Post-Login URL:', postLoginUrl);

    // -------------------------------------------------------------
    // Step 2: Open /seller/products/new without saving draft
    // -------------------------------------------------------------
    console.log('\n--- Step 2: Add Product Page Unsaved Draft Check ---');
    await client.send('Page.navigate', { url: 'http://localhost:5173/seller/products/new' });
    await sleep(2500);

    // Verify blocked state in Gallery section
    const isBlockedStateVisible = await evaluate(`!!document.querySelector('[data-testid="media-section-blocked-state"]')`);
    const isDropzoneVisible = await evaluate(`Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Drag & Drop Studio Images Here'))`);
    const isPickerVisible = await evaluate(`!!document.querySelector('#product-media-select')`);

    console.log('Unsaved Product Add Page Gallery Checks:');
    console.log('  Blocked Banner Visible:', isBlockedStateVisible);
    console.log('  Upload Dropzone Visible:', isDropzoneVisible);
    console.log('  Product Picker Dropdown Visible:', isPickerVisible);

    await takeScreenshot('gallery_section_blocked_before_save.png');

    // -------------------------------------------------------------
    // Step 3: Fill Title and Click Save Draft
    // -------------------------------------------------------------
    console.log('\n--- Step 3: Fill Title & Save Draft ---');
    await evaluate(`
      const titleInput = Array.from(document.querySelectorAll('input')).find(i => i.value && i.value.includes('Apex Titan'));
      if (titleInput) {
        const tracker = titleInput._valueTracker;
        if (tracker) tracker.setValue('');
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(titleInput, 'Test Studio Camera Rig Pro 2026');
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await sleep(500);

    await evaluate(`
      const saveDraftBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save Draft'));
      if (saveDraftBtn) saveDraftBtn.click();
    `);
    await sleep(4000);

    // -------------------------------------------------------------
    // Step 4: Verify Gallery Section Unlocks for New Product Draft
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Unlocked Gallery Section Verification ---');
    const isBlockedAfterSave = await evaluate(`!!document.querySelector('[data-testid="media-section-blocked-state"]')`);
    const isDropzoneAfterSave = await evaluate(`Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Drag & Drop Studio Images Here'))`);
    const galleryHeaderText = await evaluate(`
      const heading = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('4. Studio Gallery'));
      heading ? heading.parentElement.textContent : ''
    `);

    console.log('Post-Draft Save Gallery Checks:');
    console.log('  Blocked Banner Visible:', isBlockedAfterSave);
    console.log('  Upload Dropzone Unlocked:', isDropzoneAfterSave);
    console.log('  Gallery Header Info:', galleryHeaderText);

    await takeScreenshot('gallery_section_unlocked_after_save.png');

    client.close();
  } catch (err) {
    console.error('CDP script error:', err);
  } finally {
    edgeProc.kill();
  }
})();
