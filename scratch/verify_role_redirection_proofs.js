import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\64d83a64-4358-43b2-b6f6-0f3826395690';

(async () => {
  console.log('Starting Playwright Role Redirection & UI Gating Verification...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  
  try {
    // 1. Logged in Customer ("Athulb") on "/" marketplace home
    const contextCust = await browser.newContext();
    const pageCust = await contextCust.newPage();
    await pageCust.goto('http://localhost:5173/login');
    await pageCust.waitForSelector('input[name="identifier"]');
    await pageCust.fill('input[name="identifier"]', 'Athulb');
    await pageCust.click('button:has-text("Login with Password instead")');
    await pageCust.waitForSelector('input[id="user-password"]');
    await pageCust.fill('input[id="user-password"]', 'Athulb@123'); // Or password
    await pageCust.click('button[type="submit"]:has-text("Login")');
    
    // Wait for redirect to home
    await pageCust.waitForURL('http://localhost:5173/', { timeout: 10000 }).catch(() => {});
    await pageCust.waitForTimeout(2000);
    
    const custUrl = pageCust.url();
    console.log('Customer post-login URL:', custUrl);
    
    // Check topbar and promo card buttons
    const reviewerBarCount = await pageCust.locator('text=UX Prototype: Design Review Controls').count();
    const sellerHubBtnCount = await pageCust.locator('text=Open Seller Hub Dashboard').count();
    const adminOpsBtnCount = await pageCust.locator('text=Admin Ops').count();
    
    console.log(`Customer UI checks - ReviewerBar: ${reviewerBarCount}, SellerHubBtn: ${sellerHubBtnCount}, AdminOpsBtn: ${adminOpsBtnCount}`);
    
    await pageCust.screenshot({
      path: path.join(ARTIFACT_DIR, 'customer_home_clean_ui.png'),
      fullPage: false
    });
    
    // 2. Logged-out Customer attempts forbidden /seller/dashboard -> bounced to /login -> logs in -> lands on /
    const contextBounce = await browser.newContext();
    const pageBounce = await contextBounce.newPage();
    await pageBounce.goto('http://localhost:5173/seller/dashboard');
    await pageBounce.waitForURL('**/login**');
    console.log('Bounced URL with state.from:', pageBounce.url());
    
    await pageBounce.waitForSelector('input[name="identifier"]');
    await pageBounce.fill('input[name="identifier"]', 'Athulb');
    await pageBounce.click('button:has-text("Login with Password instead")');
    await pageBounce.waitForSelector('input[id="user-password"]');
    await pageBounce.fill('input[id="user-password"]', 'Athulb@123');
    await pageBounce.click('button[type="submit"]:has-text("Login")');
    
    await pageBounce.waitForTimeout(2000);
    const bouncedPostLoginUrl = pageBounce.url();
    console.log('Customer bounced post-login URL:', bouncedPostLoginUrl);
    
    await pageBounce.screenshot({
      path: path.join(ARTIFACT_DIR, 'customer_bounced_from_seller_lands_on_home.png'),
      fullPage: false
    });
    
    // 3. Real Vendor login -> /seller/dashboard
    const contextVendor = await browser.newContext();
    const pageVendor = await contextVendor.newPage();
    await pageVendor.goto('http://localhost:5173/login');
    await pageVendor.waitForSelector('input[name="identifier"]');
    await pageVendor.fill('input[name="identifier"]', 'testvendor');
    await pageVendor.click('button:has-text("Login with Password instead")');
    await pageVendor.waitForSelector('input[id="user-password"]');
    await pageVendor.fill('input[id="user-password"]', 'VendorPass123!');
    await pageVendor.click('button[type="submit"]:has-text("Login")');
    
    await pageVendor.waitForTimeout(2000);
    console.log('Vendor post-login URL:', pageVendor.url());
    await pageVendor.screenshot({
      path: path.join(ARTIFACT_DIR, 'vendor_lands_on_seller_dashboard.png'),
      fullPage: false
    });
    
    // 4. Vendor legitimate preserved route (/seller/dashboard)
    const contextVendorPreserve = await browser.newContext();
    const pageVendorPreserve = await contextVendorPreserve.newPage();
    await pageVendorPreserve.goto('http://localhost:5173/seller/dashboard');
    await pageVendorPreserve.waitForURL('**/login**');
    await pageVendorPreserve.fill('input[name="identifier"]', 'testvendor');
    await pageVendorPreserve.click('button:has-text("Login with Password instead")');
    await pageVendorPreserve.fill('input[id="user-password"]', 'VendorPass123!');
    await pageVendorPreserve.click('button[type="submit"]:has-text("Login")');
    
    await pageVendorPreserve.waitForTimeout(2000);
    console.log('Vendor preserved post-login URL:', pageVendorPreserve.url());
    await pageVendorPreserve.screenshot({
      path: path.join(ARTIFACT_DIR, 'vendor_preserved_destination_held.png'),
      fullPage: false
    });

    // 5. Admin login -> /admin
    const contextAdmin = await browser.newContext();
    const pageAdmin = await contextAdmin.newPage();
    await pageAdmin.goto('http://localhost:5173/login');
    await pageAdmin.waitForSelector('input[name="identifier"]');
    await pageAdmin.fill('input[name="identifier"]', 'admin');
    await pageAdmin.click('button:has-text("Login with Password instead")');
    await pageAdmin.waitForSelector('input[id="user-password"]');
    await pageAdmin.fill('input[id="user-password"]', 'AdminPass123!');
    await pageAdmin.click('button[type="submit"]:has-text("Login")');
    
    await pageAdmin.waitForTimeout(2000);
    console.log('Admin post-login URL:', pageAdmin.url());
    await pageAdmin.screenshot({
      path: path.join(ARTIFACT_DIR, 'admin_lands_on_admin_dashboard.png'),
      fullPage: false
    });

  } catch (err) {
    console.error('Error during Playwright verification:', err);
  } finally {
    await browser.close();
  }
})();
