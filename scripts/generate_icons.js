import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

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

async function renderIcon(svgContent, size, outputPath) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; }
    svg { width: ${size}px; height: ${size}px; display: block; }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`;

  const tempHtmlPath = path.resolve(`./temp_icon_${size}.html`);
  fs.writeFileSync(tempHtmlPath, html, 'utf8');

  const port = 9333;
  const browser = spawn(BROWSER_BIN, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    `--window-size=${size},${size}`,
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
      width: size,
      height: size,
      deviceScaleFactor: 1,
      mobile: false
    });

    const fileUrl = `file:///${tempHtmlPath.replace(/\\/g, '/')}`;
    await pageCdp.send('Page.navigate', { url: fileUrl });
    await sleep(500);

    const { data } = await pageCdp.send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: size, height: size, scale: 1 },
      fromSurface: true
    });

    fs.writeFileSync(outputPath, Buffer.from(data, 'base64'));
    console.log(`Saved: ${outputPath} (${size}x${size})`);

    pageCdp.close();
    cdp.close();
  } finally {
    browser.kill();
    if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
  }
}

async function main() {
  const svgPath = path.resolve('./public/favicon.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  await renderIcon(svgContent, 192, path.resolve('./public/icons/icon-192x192.png'));
  await renderIcon(svgContent, 512, path.resolve('./public/icons/icon-512x512.png'));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
