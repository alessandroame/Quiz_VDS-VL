const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const { spawn } = require('child_process');

const masterJpg = path.resolve('public/proposals/paraglider_question_icon_light_1790762286012.jpg');
if (!fs.existsSync(masterJpg)) {
  console.error('Master image not found at ' + masterJpg);
  process.exit(1);
}

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

async function renderMasterIcons() {
  const masterBuf = fs.readFileSync(masterJpg);
  const masterBase64 = 'data:image/jpeg;base64,' + masterBuf.toString('base64');

  // 1. Generate favicon-light.svg
  const svgLight = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="${masterBase64}" width="512" height="512" preserveAspectRatio="xMidYMid slice"/>
</svg>`;
  const faviconLightSvg = path.resolve('public/favicon-light.svg');
  fs.writeFileSync(faviconLightSvg, svgLight, 'utf8');
  console.log(`✅ Saved SVG Favicon Light: ${faviconLightSvg}`);

  if (!BROWSER_BIN) {
    console.warn('⚠️ No Chrome browser found for PNG generation. SVG generated.');
    return;
  }

  const port = 9338;
  const tempProfile = path.join(os.tmpdir(), `chrome_icon_light_${port}`);

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

    if (!wsUrl) throw new Error('Failed to connect to headless Chrome on port ' + port);

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();

    const targets = await getJson(`http://127.0.0.1:${port}/json/list`);
    const pageTarget = targets.find(t => t.type === 'page');
    const pageCdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await pageCdp.connect();
    await pageCdp.send('Page.enable');

    const sizes = [
      { size: 512, out: path.resolve('public/icons/icon-light-512x512.png') },
      { size: 192, out: path.resolve('public/icons/icon-light-192x192.png') },
      { size: 180, out: path.resolve('public/apple-touch-icon-light.png') }
    ];

    for (const item of sizes) {
      const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${item.size}px; height: ${item.size}px; overflow: hidden; background: #ffffff; }
    img { width: ${item.size}px; height: ${item.size}px; display: block; object-fit: cover; }
  </style>
</head>
<body>
  <img src="${masterBase64}" />
</body>
</html>`;

      const tempHtmlPath = path.resolve(`./temp_icon_light_render_${item.size}.html`);
      fs.writeFileSync(tempHtmlPath, html, 'utf8');

      await pageCdp.send('Emulation.setDeviceMetricsOverride', {
        width: item.size,
        height: item.size,
        deviceScaleFactor: 1,
        mobile: false
      });

      const fileUrl = `file:///${tempHtmlPath.replace(/\\/g, '/')}`;
      await pageCdp.send('Page.navigate', { url: fileUrl });
      await sleep(400);

      const { data } = await pageCdp.send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: 0, y: 0, width: item.size, height: item.size, scale: 1 },
        fromSurface: true
      });

      fs.writeFileSync(item.out, Buffer.from(data, 'base64'));
      console.log(`✅ Saved PNG icon: ${item.out} (${item.size}x${item.size})`);
      if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
    }

    pageCdp.close();
    cdp.close();
  } finally {
    browser.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch (e) {}
  }

  console.log('🎉 Light theme icon assets successfully generated!');
}

renderMasterIcons().catch(err => {
  console.error('Fatal error generating light theme icons:', err);
  process.exit(1);
});
