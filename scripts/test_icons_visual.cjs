const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const { spawn } = require('child_process');

const POSSIBLE_PATHS = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
  path.join(os.homedir(), 'AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe')
].filter(Boolean);

const BROWSER_BIN = POSSIBLE_PATHS.find(p => fs.existsSync(p));
if (!BROWSER_BIN) {
  console.error('No Chrome/Edge browser found.');
  process.exit(1);
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const port = 9333;
  const tempProfile = path.join(os.tmpdir(), `chrome_quiz_icons_${port}`);

  const browser = spawn(BROWSER_BIN, [
    '--headless=new',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-webgl',
    '--enable-webgl',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await sleep(200);
      try {
        const pages = await getJson(`http://127.0.0.1:${port}/json`);
        const targetPage = pages.find(p => p.type === 'page' && p.webSocketDebuggerUrl);
        if (targetPage) {
          wsUrl = targetPage.webSocketDebuggerUrl;
          break;
        }
      } catch (e) {}
    }

    if (!wsUrl) throw new Error('Could not connect to Chrome CDP');

    const ws = new globalThis.WebSocket(wsUrl);
    let msgId = 1;
    const pending = new Map();
    const consoleLogs = [];
    const failedRequests = [];

    const send = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await new Promise(r => ws.onopen = r);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      } else if (data.method === 'Runtime.consoleAPICalled') {
        const type = data.params.type;
        const text = (data.params.args || []).map(a => a.value || a.description || '').join(' ');
        consoleLogs.push({ type, text });
      } else if (data.method === 'Runtime.exceptionThrown') {
        consoleLogs.push({ type: 'error', text: data.params.exceptionDetails.text || 'Uncaught Exception' });
      } else if (data.method === 'Network.responseReceived') {
        const status = data.params.response.status;
        const url = data.params.response.url;
        if (status >= 400) {
          failedRequests.push({ url, status });
        }
      }
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');

    // Emulate mobile portrait 390x844
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      screenOrientation: { type: 'portraitPrimary', angle: 0 }
    });

    console.log('Navigating to http://localhost:5173...');
    await send('Page.navigate', { url: 'http://localhost:5173' });

    // Wait for splash screen to disappear and root app to mount
    let navbarLogoLoaded = false;
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      const evalRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const img = document.querySelector('#navbar-app-logo');
          if (!img) return null;
          return {
            src: img.src,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          };
        })()`,
        returnByValue: true
      });

      if (evalRes?.result?.value && evalRes.result.value.complete && evalRes.result.value.naturalWidth > 0) {
        navbarLogoLoaded = true;
        console.log('✅ Navbar logo loaded successfully:', evalRes.result.value);
        break;
      }
    }

    if (!navbarLogoLoaded) {
      throw new Error('Navbar logo failed to load or render properly');
    }

    // Take screenshot of home screen with navbar
    const homeShot = await send('Page.captureScreenshot', { format: 'png' });
    const homeShotPath = path.resolve('public/test_navbar_icon_verified.png');
    fs.writeFileSync(homeShotPath, Buffer.from(homeShot.data, 'base64'));
    console.log(`Saved screenshot: ${homeShotPath}`);

    // Click Settings button
    console.log('Opening Settings modal...');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('#btn-settings')?.click()`,
    });
    await sleep(600);

    // Expand About section in Settings
    console.log('Expanding About accordion...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('#tab-about');
        if (btn) btn.click();
      })()`,
    });
    await sleep(600);

    // Assert Settings About Logo
    const aboutLogoRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const img = document.querySelector('#settings-about-app-logo');
        if (!img) return null;
        return {
          src: img.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        };
      })()`,
      returnByValue: true
    });

    console.log('Settings About logo status:', aboutLogoRes?.result?.value);
    if (!aboutLogoRes?.result?.value || !aboutLogoRes.result.value.complete || aboutLogoRes.result.value.naturalWidth === 0) {
      throw new Error('Settings About logo failed to load or render');
    }

    const settingsShot = await send('Page.captureScreenshot', { format: 'png' });
    const settingsShotPath = path.resolve('public/test_settings_about_icon_verified.png');
    fs.writeFileSync(settingsShotPath, Buffer.from(settingsShot.data, 'base64'));
    console.log(`Saved screenshot: ${settingsShotPath}`);

    // Open BuildInfoModal
    console.log('Opening BuildInfoModal...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('#settings-version-badge');
        if (btn) btn.click();
      })()`,
    });
    await sleep(600);

    // Assert BuildInfo Modal Logo
    const buildInfoLogoRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const img = document.querySelector('#build-info-app-logo');
        if (!img) return null;
        return {
          src: img.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        };
      })()`,
      returnByValue: true
    });

    console.log('BuildInfoModal logo status:', buildInfoLogoRes?.result?.value);
    if (!buildInfoLogoRes?.result?.value || !buildInfoLogoRes.result.value.complete || buildInfoLogoRes.result.value.naturalWidth === 0) {
      throw new Error('BuildInfoModal logo failed to load or render');
    }

    const buildInfoShot = await send('Page.captureScreenshot', { format: 'png' });
    const buildInfoShotPath = path.resolve('public/test_build_info_icon_verified.png');
    fs.writeFileSync(buildInfoShotPath, Buffer.from(buildInfoShot.data, 'base64'));
    console.log(`Saved screenshot: ${buildInfoShotPath}`);

    const errors = consoleLogs.filter(l => l.type === 'error');
    console.log(`Errors in console: ${errors.length}`);
    if (errors.length > 0) {
      console.error('Console errors:', errors);
      throw new Error('Console errors encountered');
    }

    console.log(`Failed HTTP requests: ${failedRequests.length}`);
    if (failedRequests.length > 0) {
      console.error('Failed requests:', failedRequests);
      throw new Error('Failed HTTP requests encountered');
    }

    console.log('🎉 ALL VISUAL AND ICON ASSERTIONS PASSED WITH ZERO ERRORS!');
  } finally {
    browser.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch (e) {}
  }
}

main().catch(err => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
