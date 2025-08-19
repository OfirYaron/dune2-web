const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const url = 'http://localhost:8080/index.html';
  console.log('Opening', url);
  await page.goto(url, { waitUntil: 'load' }).catch(e => {
    console.error('Failed to load page:', e.message);
    process.exit(2);
  });

  // Report counts before
  const before = await page.evaluate(() => ({
    hudCount: document.querySelectorAll('#hud').length,
    tooltipCount: document.querySelectorAll('#tooltip').length,
    iframes: Array.from(document.querySelectorAll('iframe')).length,
    title: document.title,
  }));
  console.log('Before:', before);

  // Unregister service workers
  const sws = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { unregistered: 0 };
    const regs = await navigator.serviceWorker.getRegistrations();
    const count = regs.length;
    await Promise.all(regs.map(r => r.unregister()));
    // Clear caches
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    return { unregistered: count };
  });
  console.log('Unregistered service workers:', sws.unregistered);

  // Remove duplicate hud/tooltip nodes, keep first
  const removed = await page.evaluate(() => {
    const removed = { hud: 0, tooltip: 0 };
    const huds = Array.from(document.querySelectorAll('#hud'));
    huds.slice(1).forEach(n => { n.remove(); removed.hud++; });
    const tips = Array.from(document.querySelectorAll('#tooltip'));
    tips.slice(1).forEach(n => { n.remove(); removed.tooltip++; });
    return removed;
  });
  console.log('Removed duplicates:', removed);

  // Report counts after
  const after = await page.evaluate(() => ({
    hudCount: document.querySelectorAll('#hud').length,
    tooltipCount: document.querySelectorAll('#tooltip').length,
    iframes: Array.from(document.querySelectorAll('iframe')).length,
  }));
  console.log('After:', after);

  await browser.close();
  process.exit(0);
})();
