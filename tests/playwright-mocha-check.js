// playwright-mocha-check.js
// Script to check Mocha results in the browser and exit with non-zero code if any test fails

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/tests/index.html', { waitUntil: 'networkidle' });

  // Wait for Mocha to finish running
  await page.waitForSelector('#mocha-report');
  await page.waitForTimeout(1000); // Give Mocha time to render results

  // Get number of failures from the Mocha UI
  const failures = await page.$eval('.failures em', el => parseInt(el.textContent, 10));
  await browser.close();

  if (failures > 0) {
    console.error(`Test suite failed: ${failures} test(s) failed.`);
    process.exit(1);
  } else {
    console.log('All tests passed!');
    process.exit(0);
  }
})();
