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

async function renderImageToPng(sourceImagePath, size, outputPath) {
  const imgBuffer = fs.readFileSync(sourceImagePath);
  const b64 = 'data:image/jpeg;base64,' + imgBuffer.toString('base64');

  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${size}px; height: ${size}px; overflow: hidden; background: #09090b; }
    img { width: ${size}px; height: ${size}px; display: block; object-fit: cover; }
  </style>
</head>
<body>
  <img src="${b64}" />
</body>
</html>`;

  const tempHtmlPath = path.resolve(`./temp_icon_render_${size}.html`);
  fs.writeFileSync(tempHtmlPath, html, 'utf8');

  const port = 9345;
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
    console.log(`✅ Saved PNG icon: ${outputPath} (${size}x${size})`);

    pageCdp.close();
    cdp.close();
  } finally {
    browser.kill();
    if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
  }
}

// Generate the matching SVG Favicon with the Paraglider Question Mark motif
function generateParagliderSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background Gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="85%" stop-color="#09090b"/>
      <stop offset="100%" stop-color="#040405"/>
    </radialGradient>

    <!-- Warm Aviation Amber Gradient -->
    <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="25%" stop-color="#fbbf24"/>
      <stop offset="70%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>

    <!-- Soft Ambient Glow -->
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Intense Outer Glow -->
    <filter id="outerGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur1"/>
      <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur1"/>
        <feMergeNode in="blur2"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Base Squircle Container -->
  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#bgGrad)" stroke="#27272a" stroke-width="4"/>

  <!-- Instrument Precision Ring & Compass Marks -->
  <circle cx="256" cy="256" r="218" fill="none" stroke="#27272a" stroke-width="1.5" stroke-dasharray="3 7" opacity="0.5"/>
  <line x1="256" y1="20" x2="256" y2="34" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
  <line x1="256" y1="478" x2="256" y2="492" stroke="#71717a" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
  <line x1="20" y1="256" x2="34" y2="256" stroke="#71717a" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
  <line x1="478" y1="256" x2="492" y2="256" stroke="#71717a" stroke-width="2" stroke-linecap="round" opacity="0.6"/>

  <!-- Glowing Glow Layer underneath -->
  <g filter="url(#outerGlow)" opacity="0.35">
    <!-- Paraglider Wing Canopy Hook -->
    <path d="M 148,225 C 142,165 195,108 268,108 C 345,108 392,156 375,230 C 362,284 308,298 288,326 C 278,340 278,352 278,356 L 244,356 C 244,340 248,324 262,306 C 282,280 326,268 334,228 C 344,180 315,146 265,146 C 215,146 178,180 182,224 Z" fill="#f59e0b"/>
    <!-- Pilot Dot -->
    <circle cx="260" cy="404" r="16" fill="#f59e0b"/>
  </g>

  <!-- Main Paraglider Question Mark (Crisp Vector) -->
  <g filter="url(#softGlow)">
    <!-- Aerodynamic Paraglider Canopy (Top Loop of Question Mark) -->
    <path d="M 148,222 C 142,160 196,104 270,104 C 348,104 394,154 378,226 C 365,280 312,296 292,324 C 282,338 281,348 281,354 L 243,354 C 243,338 248,322 262,302 C 282,274 328,264 336,224 C 346,176 317,142 267,142 C 215,142 180,178 184,222 Z" fill="url(#amberGrad)" stroke="#fef08a" stroke-width="1.5"/>

    <!-- Paraglider Cell Ribs (Inner Wing Structure) -->
    <path d="M 215,116 C 210,126 206,140 205,158" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
    <path d="M 268,105 L 268,142" stroke="#fef08a" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
    <path d="M 320,118 C 324,128 326,144 324,162" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>

    <!-- Suspension Lines (Cordini di Fascio) -->
    <line x1="247" y1="354" x2="242" y2="384" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>
    <line x1="277" y1="354" x2="274" y2="384" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>

    <!-- Pilot Silhouette (Bottom Dot of Question Mark) -->
    <!-- Helmet -->
    <circle cx="258" cy="385" r="10" fill="url(#amberGrad)" stroke="#fef08a" stroke-width="1"/>
    <!-- Pilot Body / Harness (Cocoon Pod) -->
    <path d="M 242,392 C 238,405 244,424 262,424 C 274,424 280,414 276,402 L 268,392 Z" fill="url(#amberGrad)"/>
    <!-- Arms holding toggles -->
    <path d="M 242,386 L 248,396" stroke="#fef08a" stroke-width="2.5" stroke-linecap="round"/>
    <path x="0" d="M 274,386 L 268,396" stroke="#fef08a" stroke-width="2.5" stroke-linecap="round"/>
  </g>
</svg>`;
}

async function main() {
  const masterJpg = path.resolve('public/proposals/paraglider_question_icon_1790614519390.jpg');
  if (!fs.existsSync(masterJpg)) {
    throw new Error('Master image not found at ' + masterJpg);
  }

  // 1. Generate 512x512 and 192x192 PNGs
  const pwa512 = path.resolve('public/icons/icon-512x512.png');
  const pwa192 = path.resolve('public/icons/icon-192x192.png');
  const appleIcon = path.resolve('public/apple-touch-icon.png');

  console.log('Rendering PWA icons from Paraglider Question Master...');
  await renderImageToPng(masterJpg, 512, pwa512);
  await renderImageToPng(masterJpg, 192, pwa192);
  await renderImageToPng(masterJpg, 180, appleIcon);

  // 2. Save vector SVG favicon
  const svgContent = generateParagliderSvg();
  const faviconSvg = path.resolve('public/favicon.svg');
  fs.writeFileSync(faviconSvg, svgContent, 'utf8');
  console.log(`✅ Saved SVG Favicon: ${faviconSvg}`);

  console.log('🚀 All icon assets successfully updated!');
}

main().catch(err => {
  console.error('Error deploying icon:', err);
  process.exit(1);
});
