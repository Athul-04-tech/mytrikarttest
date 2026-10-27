const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const msedgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : msedgePath;

const outDir = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\12ee5e63-71ce-4014-b8e5-f673fd2dbe8b';

(async () => {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Listen to network responses from backend
  page.on('response', async (response) => {
    if (response.url().includes('/api/accounts/register/')) {
      try {
        const text = await response.text();
        console.log(`[NETWORK EVENT] POST /api/accounts/register/ -> HTTP ${response.status()}:`, text);
      } catch (e) {}
    }
  });

  // TEST 1: Initial load — check Mobile Number label has (optional) and no asterisk
  console.log('--- TEST 1: Check Registration Page and Mobile Label ---');
  await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const mobileLabelText = await page.$eval('label[for="reg-mobile"]', el => el.innerText);
  console.log('Mobile Label Text:', mobileLabelText);

  const shot1 = path.join(outDir, 'live_signup_initial_form.png');
  await page.screenshot({ path: shot1, fullPage: true });
  console.log('Saved screenshot 1:', shot1);

  // TEST 2: Submit with invalid phone (12345) against live backend
  console.log('--- TEST 2: Submit with invalid phone (12345) ---');
  await page.type('#reg-username', 'fresh_test_user_99');
  await page.type('#reg-email', 'freshtest99@example.com');
  await page.type('#reg-mobile', '12345');
  await page.type('#reg-password', 'ValidPass123!');
  await page.type('#reg-confirm-password', 'ValidPass123!');

  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  const mobileErrorExists = await page.$('#mobile-error');
  const mobileErrorText = mobileErrorExists ? await page.$eval('#mobile-error', el => el.innerText) : 'NOT FOUND';
  const generalErrorExists = await page.$('#register-general-error');
  const generalErrorText = generalErrorExists ? await page.$eval('#register-general-error', el => el.innerText) : 'NONE';
  const fullPageBody = await page.$eval('body', el => el.innerText);

  console.log('Mobile Error Element Text:', mobileErrorText);
  console.log('General Error Banner Text:', generalErrorText);
  console.log('Contains "non_field_errors:"?', fullPageBody.includes('non_field_errors:'));

  const shot2 = path.join(outDir, 'live_signup_invalid_phone.png');
  await page.screenshot({ path: shot2, fullPage: true });
  console.log('Saved screenshot 2:', shot2);

  // TEST 3: Edit field after error — verify error disappears
  console.log('--- TEST 3: Edit mobile field after error ---');
  await page.type('#reg-mobile', '6'); // Now 123456
  await new Promise(r => setTimeout(r, 500));

  const mobileErrorAfterEdit = await page.$('#mobile-error');
  console.log('Mobile error element exists after typing?', Boolean(mobileErrorAfterEdit));

  const shot3 = path.join(outDir, 'live_signup_after_edit_cleared.png');
  await page.screenshot({ path: shot3, fullPage: true });
  console.log('Saved screenshot 3:', shot3);

  // Helper to clear input completely
  async function clearInput(selector) {
    await page.focus(selector);
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
  }

  // TEST 4: Submit with duplicate username (admin)
  console.log('--- TEST 4: Submit with duplicate username (admin) ---');
  await clearInput('#reg-username');
  await page.type('#reg-username', 'admin');

  // Clear mobile completely so it is optional
  await clearInput('#reg-mobile');

  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  const usernameErrorExists = await page.$('#username-error');
  const usernameErrorText = usernameErrorExists ? await page.$eval('#username-error', el => el.innerText) : 'NOT FOUND';
  console.log('Username Error Element Text:', usernameErrorText);

  const shot4 = path.join(outDir, 'live_signup_duplicate_username.png');
  await page.screenshot({ path: shot4, fullPage: true });
  console.log('Saved screenshot 4:', shot4);

  // TEST 5: Submit with mismatched passwords
  console.log('--- TEST 5: Submit with mismatched passwords ---');
  await clearInput('#reg-username');
  await page.type('#reg-username', 'valid_user_unique');

  await clearInput('#reg-confirm-password');
  await page.type('#reg-confirm-password', 'MismatchedPass123!');

  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 600));

  const confirmPassErrorExists = await page.$('#confirm-password-error');
  const confirmPassErrorText = confirmPassErrorExists ? await page.$eval('#confirm-password-error', el => el.innerText) : 'NOT FOUND';
  console.log('Confirm Password Error Element Text:', confirmPassErrorText);

  const shot5 = path.join(outDir, 'live_signup_mismatched_passwords.png');
  await page.screenshot({ path: shot5, fullPage: true });
  console.log('Saved screenshot 5:', shot5);

  // TEST 6: General non_field_errors test (shown in box without raw key)
  console.log('--- TEST 6: Submit with general non_field_errors ---');
  await clearInput('#reg-confirm-password');
  await page.type('#reg-confirm-password', 'ValidPass123!');

  // Intercept the next register request to return a non_field_errors response
  await page.setRequestInterception(true);
  page.once('request', req => {
    if (req.url().includes('/api/accounts/register/')) {
      req.respond({
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          non_field_errors: ['Platform registration is temporarily undergoing maintenance.']
        })
      });
    } else {
      req.continue();
    }
  });

  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));

  const generalErrorBox = await page.$('#register-general-error');
  const generalText = generalErrorBox ? await page.$eval('#register-general-error', el => el.innerText) : 'NOT FOUND';
  console.log('General Error Banner Text:', generalText);
  console.log('General Error Contains raw "non_field_errors:"?', generalText.includes('non_field_errors:'));

  const shot6 = path.join(outDir, 'live_signup_general_error.png');
  await page.screenshot({ path: shot6, fullPage: true });
  console.log('Saved screenshot 6:', shot6);

  await page.setRequestInterception(false);

  await browser.close();
  console.log('=== All live browser verification tests completed successfully! ===');
})();
