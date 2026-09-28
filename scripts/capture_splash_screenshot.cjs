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
  return new Promise(r => setTimeout(r, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const ws = new globalThis.WebSocket(this.wsUrl);
      this.ws = ws;
      ws.onopen = resolve;
      ws.onerror = reject;
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data.toString());
        if (data.id && this.callbacks.has(data.id)) {
          const { resolve, reject } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) reject(new Error(data.error.message));
          else resolve(data.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function captureViewport(htmlPath, width, height, scale, outputPath) {
  const port = 9360;
  const browser = spawn(BROWSER_BIN, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    `--window-size=${width},${height}`,
    'about:blank'
  ]);

  try {
    await sleep(800);
    const versionInfo = await getJson(`http://127.0.0.1:${port}/json/version`);
    const cdp = new CDPClient(versionInfo.webSocketDebuggerUrl);
    await cdp.connect();

    const targets = await getJson(`http://127.0.0.1:${port}/json/list`);
    const pageTarget = targets.find(t => t.type === 'page');
    const pageCdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await pageCdp.connect();

    await pageCdp.send('Page.enable');
    await pageCdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: scale,
      mobile: width < 600
    });

    const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
    await pageCdp.send('Page.navigate', { url: fileUrl });
    await sleep(600); // Wait for CSS animation

    const { data } = await pageCdp.send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width, height, scale: 1 },
      fromSurface: true
    });

    fs.writeFileSync(outputPath, Buffer.from(data, 'base64'));
    console.log(`📸 Screenshot captured: ${outputPath} (${width}x${height} @${scale}x)`);

    pageCdp.close();
    cdp.close();
  } finally {
    browser.kill();
  }
}

async function main() {
  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');

  // Create isolated preview of index.html WITHOUT the script tag importing main.tsx
  const previewHtml = indexHtml.replace('<script type="module" src="/src/main.tsx"></script>', '<!-- React disabled for static splash preview -->');
  const tempPreviewPath = path.resolve('temp_splash_preview.html');
  fs.writeFileSync(tempPreviewPath, previewHtml, 'utf8');

  const brainDir = 'C:\\Users\\aless\\.gemini\\antigravity\\brain\\7895f15b-0ae5-48a0-a929-6b6e8b3cc02a';
  const publicDir = path.resolve('public');

  const mobileBrain = path.join(brainDir, 'splash_screen_mobile.png');
  const desktopBrain = path.join(brainDir, 'splash_screen_desktop.png');
  const mobilePublic = path.join(publicDir, 'splash_screen_mobile.png');
  const desktopPublic = path.join(publicDir, 'splash_screen_desktop.png');

  try {
    // 1. Mobile Portrait (iPhone 14 style: 390x844)
    console.log('Capturing Mobile Portrait Splash...');
    await captureViewport(tempPreviewPath, 390, 844, 2, mobileBrain);
    fs.copyFileSync(mobileBrain, mobilePublic);

    // 2. Desktop (1440x900)
    console.log('Capturing Desktop Splash...');
    await captureViewport(tempPreviewPath, 1440, 900, 1, desktopBrain);
    fs.copyFileSync(desktopBrain, desktopPublic);

    console.log('🎉 Splash screen screenshots captured successfully!');
  } finally {
    if (fs.existsSync(tempPreviewPath)) fs.unlinkSync(tempPreviewPath);
  }
}

main().catch(err => {
  console.error('Error capturing screenshot:', err);
  process.exit(1);
});
