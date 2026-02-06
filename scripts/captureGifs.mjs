import puppeteer from 'puppeteer';
import GIFEncoder from 'gif-encoder-2';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { PNG } from 'pngjs';
import path from 'path';

const OUTPUT_DIR = './public/welcome-gifs';
const APP_URL = 'http://localhost:5173';
const FRAME_DELAY = 400; // ms between frames in GIF

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function createGif(frames, outputPath, width, height) {
  const encoder = new GIFEncoder(width, height, 'neuquant', true);
  const writeStream = createWriteStream(outputPath);

  encoder.createReadStream().pipe(writeStream);
  encoder.start();
  encoder.setDelay(FRAME_DELAY);
  encoder.setQuality(10);
  encoder.setRepeat(0); // Loop forever

  for (const frame of frames) {
    const png = PNG.sync.read(frame);
    encoder.addFrame(png.data);
  }

  encoder.finish();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

async function setupPage(browser, width, height) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(APP_URL);
  await page.evaluate(() => localStorage.setItem('hasSeenWelcome', 'true'));
  await page.reload();
  await new Promise(r => setTimeout(r, 3500)); // Wait for map to fully load
  return page;
}

async function main() {
  console.log('Launching browser...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // GIF 1: Map with markers - full view
    console.log('\n1. Capturing: Map markers...');
    {
      const page = await setupPage(browser, 480, 320);
      const frames = [];

      // Capture a few frames of the map
      for (let i = 0; i < 3; i++) {
        frames.push(await page.screenshot({ type: 'png' }));
        await new Promise(r => setTimeout(r, 300));
      }

      await createGif(frames, path.join(OUTPUT_DIR, 'map-markers.gif'), 480, 320);
      console.log('   ✓ Created map-markers.gif');
      await page.close();
    }

    // GIF 2: Mode switching - capture the toggle between Nearby/Explore/Trip
    console.log('\n2. Capturing: Mode switching...');
    {
      const page = await setupPage(browser, 420, 450);
      const frames = [];

      // Click on the discovery panel header to expand it
      await page.evaluate(() => {
        const panel = document.querySelector('.discovery-panel');
        if (panel) {
          const header = panel.querySelector('div[style*="cursor: pointer"]') || panel.firstElementChild;
          if (header) header.click();
        }
      });
      await new Promise(r => setTimeout(r, 400));

      // Screenshot the discovery panel area (expanded)
      const clip = { x: 8, y: 60, width: 350, height: 320 };

      // Capture Nearby mode (default)
      frames.push(await page.screenshot({ type: 'png', clip }));

      // Click Explore mode
      await page.evaluate(() => {
        const buttons = [...document.querySelectorAll('button')];
        const btn = buttons.find(b => b.textContent?.trim() === 'Explore');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 500));
      frames.push(await page.screenshot({ type: 'png', clip }));

      // Click Trip mode
      await page.evaluate(() => {
        const buttons = [...document.querySelectorAll('button')];
        const btn = buttons.find(b => b.textContent?.trim() === 'Trip');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 500));
      frames.push(await page.screenshot({ type: 'png', clip }));

      // Back to Nearby
      await page.evaluate(() => {
        const buttons = [...document.querySelectorAll('button')];
        const btn = buttons.find(b => b.textContent?.trim() === 'Nearby');
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 500));
      frames.push(await page.screenshot({ type: 'png', clip }));

      await createGif(frames, path.join(OUTPUT_DIR, 'mode-switching.gif'), 350, 320);
      console.log('   ✓ Created mode-switching.gif');
      await page.close();
    }

    // GIF 3: Show the player area and map with markers
    console.log('\n3. Capturing: Player area...');
    {
      const page = await setupPage(browser, 420, 140);
      const frames = [];

      // Get the viewport height to capture the bottom player bar
      // The player is at the bottom of the screen
      const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
      const clip = { x: 0, y: 0, width: 420, height: 140 };

      // Capture the player bar area at the bottom
      await page.setViewport({ width: 420, height: 900 });
      await new Promise(r => setTimeout(r, 500));

      // Screenshot the bottom portion where player lives
      const bottomClip = { x: 0, y: 760, width: 420, height: 140 };

      for (let i = 0; i < 3; i++) {
        frames.push(await page.screenshot({ type: 'png', clip: bottomClip }));
        await new Promise(r => setTimeout(r, 400));
      }

      await createGif(frames, path.join(OUTPUT_DIR, 'playback.gif'), 420, 140);
      console.log('   ✓ Created playback.gif');
      await page.close();
    }

    // GIF 4: Submit flow - show modal opening
    console.log('\n4. Capturing: Submit flow...');
    {
      const page = await setupPage(browser, 400, 550);
      const frames = [];

      // Initial state - capture header area with Submit button visible
      frames.push(await page.screenshot({ type: 'png' }));
      await new Promise(r => setTimeout(r, 500));
      frames.push(await page.screenshot({ type: 'png' }));

      // Click Submit Song button (the pink button in header)
      const clicked = await page.evaluate(() => {
        const buttons = [...document.querySelectorAll('button')];
        const btn = buttons.find(b => b.textContent?.includes('Submit Song') || b.textContent?.includes('Submit'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      console.log('   Submit button clicked:', clicked);

      // Wait for modal animation
      await new Promise(r => setTimeout(r, 800));

      // Capture the auth modal
      frames.push(await page.screenshot({ type: 'png' }));
      await new Promise(r => setTimeout(r, 300));
      frames.push(await page.screenshot({ type: 'png' }));
      await new Promise(r => setTimeout(r, 300));
      frames.push(await page.screenshot({ type: 'png' }));

      await createGif(frames, path.join(OUTPUT_DIR, 'submit-flow.gif'), 400, 550);
      console.log('   ✓ Created submit-flow.gif');
      await page.close();
    }

    console.log('\n✅ All GIFs captured!');
    console.log(`   Output: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('Error during capture:', error);
  } finally {
    await browser.close();
  }
}

main();
