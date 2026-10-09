import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\75b889cc-df9b-4585-8f13-8eaa7f875a55';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function capture() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzkxMzU3MzY1LCJpYXQiOjE3OTEzNTY0NjUsImp0aSI6IjgxNGE3MmVhYmJmNjQyNzBiMjliMWRmNjFlYzVjYmE0IiwidXNlcl9pZCI6Ijc5In0.LurKl0KKAkNPUG-nCdZnEYX_PP7ATnsXXXXoYmI2p_8';
  const refresh = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5MTk2MTI2NSwiaWF0IjoxNzkxMzU2NDY1LCJqdGkiOiIxYjQ5MTc3MjQxOTY0NDRhOWEzNGU4ZmZmMTAxNzk1MCIsInVzZXJfaWQiOiI3OSJ9.ayANxBc_VN9kp8AYkSEu-7fi9AQ8BahfHenm28LAliQ';

  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  // Initialize localStorage with admin tokens
  await page.goto('http://localhost:5173/admin');
  await page.evaluate(({ t, r }) => {
    localStorage.setItem('mk_access_token', t);
    localStorage.setItem('mk_refresh_token', r);
  }, { t: token, r: refresh });

  // 1. Commission Matrix
  await page.goto('http://localhost:5173/admin/commission');
  await page.waitForTimeout(2500);
  const commPath = path.join(ARTIFACT_DIR, 'admin_commission_rules.png');
  await page.screenshot({ path: commPath });
  console.log('Captured:', commPath);

  // 2. Tax & GSTIN Management
  await page.goto('http://localhost:5173/admin/tax');
  await page.waitForTimeout(2500);
  const taxPath = path.join(ARTIFACT_DIR, 'admin_tax_management.png');
  await page.screenshot({ path: taxPath });
  console.log('Captured:', taxPath);

  // 3. Wallet Central
  await page.goto('http://localhost:5173/admin/wallets');
  await page.waitForTimeout(2500);
  const walletPath = path.join(ARTIFACT_DIR, 'admin_wallet_central.png');
  await page.screenshot({ path: walletPath });
  console.log('Captured:', walletPath);

  // 4. Analytics & Financial BI
  await page.goto('http://localhost:5173/admin/reports');
  await page.waitForTimeout(2500);
  const biPath = path.join(ARTIFACT_DIR, 'admin_analytics_bi.png');
  await page.screenshot({ path: biPath });
  console.log('Captured:', biPath);

  await browser.close();
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
