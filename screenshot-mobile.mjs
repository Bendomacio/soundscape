import puppeteer from 'puppeteer';

const APP_URL = 'http://localhost:5173';
const OUTPUT = '/tmp/claude-1000/-home-benhook-soundscape-soundscape/c0698a00-cec6-4e1f-96a3-e325a239642e/scratchpad';

async function capture() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // iPhone 14 Pro dimensions
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1');

  console.log('Loading app...');
  await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for the map/app to load
  await new Promise(r => setTimeout(r, 3000));

  // Screenshot 1: Main view (map + player bar)
  await page.screenshot({ path: `${OUTPUT}/mobile-main.png`, fullPage: false });
  console.log('Captured main view');

  // Try to click a song marker on the map
  const markers = await page.$$('.mapboxgl-marker');
  console.log(`Found ${markers.length} map markers`);

  if (markers.length > 0) {
    // Click the first marker
    await markers[0].click();
    await new Promise(r => setTimeout(r, 1500));

    // Screenshot 2: Song detail panel open
    await page.screenshot({ path: `${OUTPUT}/mobile-detail-top.png`, fullPage: false });
    console.log('Captured detail panel (top)');

    // Scroll down the detail panel to see more content
    const detailContent = await page.$('.song-detail-content');
    if (detailContent) {
      await page.evaluate(el => el.scrollTop = 400, detailContent);
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: `${OUTPUT}/mobile-detail-mid.png`, fullPage: false });
      console.log('Captured detail panel (middle)');

      await page.evaluate(el => el.scrollTop = 800, detailContent);
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: `${OUTPUT}/mobile-detail-scroll1.png`, fullPage: false });
      console.log('Captured detail panel (scroll 1)');

      await page.evaluate(el => el.scrollTop = 1200, detailContent);
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: `${OUTPUT}/mobile-detail-scroll2.png`, fullPage: false });
      console.log('Captured detail panel (scroll 2)');

      await page.evaluate(el => el.scrollTop = el.scrollHeight, detailContent);
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: `${OUTPUT}/mobile-detail-bottom.png`, fullPage: false });
      console.log('Captured detail panel (bottom)');
    }
  } else {
    console.log('No markers found');
    await page.screenshot({ path: `${OUTPUT}/mobile-nomarkers.png`, fullPage: false });
  }

  await browser.close();
  console.log('Done!');
}

capture().catch(err => { console.error(err); process.exit(1); });
