const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://elmansa-client-tau.vercel.app/login', { waitUntil: 'networkidle2' });
  
  // Fill the login form
  await page.type('input[type="email"]', 'admin@elmansa.com');
  await page.type('input[type="password"]', 'Admin@123456');
  
  // Click submit
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]')
  ]);
  
  // Take screenshot
  await page.screenshot({ path: 'd:/elmansa/login-result.png' });
  
  console.log('Current URL:', page.url());
  
  await browser.close();
})();
