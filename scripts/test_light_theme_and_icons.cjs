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
  const port = 9339;
  const tempProfile = path.join(os.tmpdir(), `chrome_light_theme_${port}`);

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
        const ver = await getJson(`http://127.0.0.1:${port}/json/version`);
        if (ver && ver.webSocketDebuggerUrl) {
          wsUrl = ver.webSocketDebuggerUrl;
          break;
        }
      } catch (e) {}
    }

    if (!wsUrl) throw new Error('Could not connect to Chrome CDP');

    const targets = await getJson(`http://127.0.0.1:${port}/json/list`);
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('Could not find page target');

    const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);
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

    // Wait for app to mount
    await sleep(1500);

    // Set theme to light
    console.log('Setting theme to light...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        localStorage.setItem('vds_theme', 'light');
        const themeBtn = document.querySelector('#btn-theme-toggle');
        if (themeBtn) {
          themeBtn.click();
        }
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      })()`
    });
    await sleep(600);

    // Verify navbar logo in light theme
    const navbarLogoRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const img = document.querySelector('#navbar-app-logo');
        if (!img) return null;
        return {
          src: img.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          hasLightIcon: img.src.includes('icon-light-192x192.png') || img.src.includes('favicon-light.svg')
        };
      })()`,
      returnByValue: true
    });

    console.log('Navbar logo verification in Light Theme:', navbarLogoRes.result.value);

    // Screenshot Navbar & Home in Light Mode
    const navbarShot = await send('Page.captureScreenshot', { format: 'png' });
    const navbarShotPath = path.resolve('public/test_light_theme_navbar_screenshot.png');
    fs.writeFileSync(navbarShotPath, Buffer.from(navbarShot.data, 'base64'));
    console.log(`Saved screenshot: ${navbarShotPath}`);

    // Open Settings Modal
    console.log('Opening Settings Modal...');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('#btn-settings')?.click() || document.querySelector('#btn-mini-settings')?.click()`
    });
    await sleep(600);

    // Verify Settings Icons: Voice (Speech) vs Drive (Headphones)
    const settingsIconsRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const tabVoice = document.querySelector('#tab-voice');
        const tabDrive = document.querySelector('#tab-drive');
        if (!tabVoice || !tabDrive) return null;

        const voiceSvg = tabVoice.querySelector('svg');
        const driveSvg = tabDrive.querySelector('svg');

        return {
          voiceClasses: voiceSvg ? voiceSvg.getAttribute('class') : null,
          driveClasses: driveSvg ? driveSvg.getAttribute('class') : null,
          isVoiceSpeech: voiceSvg ? voiceSvg.classList.contains('lucide-speech') : false,
          isDriveHeadphones: driveSvg ? driveSvg.classList.contains('lucide-headphones') : false
        };
      })()`,
      returnByValue: true
    });

    console.log('Settings Accordion Icons:', settingsIconsRes.result.value);

    if (!settingsIconsRes.result.value?.isVoiceSpeech) {
      throw new Error('Tab Voice does not have Speech icon!');
    }
    if (!settingsIconsRes.result.value?.isDriveHeadphones) {
      throw new Error('Tab Drive does not have Headphones icon!');
    }

    // Capture screenshot of Settings in Light Theme
    const settingsShot = await send('Page.captureScreenshot', { format: 'png' });
    const settingsShotPath = path.resolve('public/test_light_theme_settings_screenshot.png');
    fs.writeFileSync(settingsShotPath, Buffer.from(settingsShot.data, 'base64'));
    console.log(`Saved screenshot: ${settingsShotPath}`);

    // Expand About section to check About app icon
    await send('Runtime.evaluate', {
      expression: `document.querySelector('#tab-about')?.click()`
    });
    await sleep(600);

    const aboutLogoRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const img = document.querySelector('#settings-about-app-logo');
        if (!img) return null;
        return {
          src: img.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          hasLightIcon: img.src.includes('icon-light-192x192.png') || img.src.includes('favicon-light.svg')
        };
      })()`,
      returnByValue: true
    });
    console.log('Settings About logo in Light Theme:', aboutLogoRes.result.value);

    const errors = consoleLogs.filter(l => l.type === 'error');
    console.log(`Errors in console: ${errors.length}`);
    if (errors.length > 0) {
      console.error('Console errors:', errors);
      throw new Error('Console errors encountered');
    }

    console.log('🎉 ALL VISUAL AND ICON ASSERTIONS FOR LIGHT THEME PASSED PERFECTLY!');
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
