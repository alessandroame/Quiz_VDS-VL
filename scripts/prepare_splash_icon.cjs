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

async function main() {
  const brainDir = 'C:\\Users\\aless\\.gemini\\antigravity\\brain\\7895f15b-0ae5-48a0-a929-6b6e8b3cc02a';
  const masterJpg = path.join(brainDir, 'paraglider_question_icon_1790614519390.jpg');

  if (!fs.existsSync(masterJpg)) {
    throw new Error('Master image not found: ' + masterJpg);
  }

  const rawJpgBase64 = 'data:image/jpeg;base64,' + fs.readFileSync(masterJpg).toString('base64');

  const port = 9370;
  const browser = spawn(BROWSER_BIN, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--window-size=1440,900',
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
    await pageCdp.send('Runtime.enable');

    // 1. Convert master image to optimized 512x512 JPEG data URL and PNG
    console.log('Generating optimized 512x512 image...');
    const result = await pageCdp.send('Runtime.evaluate', {
      expression: `(async () => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 512, 512);

            const jpegData = canvas.toDataURL('image/jpeg', 0.92);
            const pngData = canvas.toDataURL('image/png');

            // Also 192x192
            const c192 = document.createElement('canvas');
            c192.width = 192;
            c192.height = 192;
            const ctx192 = c192.getContext('2d');
            ctx192.drawImage(img, 0, 0, 192, 192);
            const png192 = c192.toDataURL('image/png');

            resolve({ jpegData, pngData, png192 });
          };
          img.onerror = reject;
          img.src = '${rawJpgBase64}';
        });
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    const { jpegData, pngData, png192 } = result.result.value;

    // Save public icons
    const p512Buf = Buffer.from(pngData.replace(/^data:image\/png;base64,/, ''), 'base64');
    const p192Buf = Buffer.from(png192.replace(/^data:image\/png;base64,/, ''), 'base64');

    fs.writeFileSync(path.resolve('public/icons/icon-512x512.png'), p512Buf);
    fs.writeFileSync(path.resolve('public/icons/icon-192x192.png'), p192Buf);
    fs.writeFileSync(path.resolve('public/apple-touch-icon.png'), p192Buf);
    console.log('✅ Updated public/icons/icon-512x512.png, icon-192x192.png, apple-touch-icon.png');

    // Update public/favicon.svg
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="${jpegData}" width="512" height="512" preserveAspectRatio="xMidYMid slice"/>
</svg>`;
    fs.writeFileSync(path.resolve('public/favicon.svg'), svgContent, 'utf8');
    console.log('✅ Updated public/favicon.svg');

    // 2. Update index.html with inline jpegData so it NEVER fails on cold start
    const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
    const updatedIndexHtml = indexHtml.replace(
      /<img\s+src="[^"]*"\s+alt="VDS-VL Quiz Master Icon"\s+class="splash-icon-img"\s*\/>/,
      `<img src="${jpegData}" alt="VDS-VL Quiz Master Icon" class="splash-icon-img" />`
    );
    fs.writeFileSync(path.resolve('index.html'), updatedIndexHtml, 'utf8');
    console.log('✅ Updated index.html with self-contained splash icon');

    // 3. Create standalone preview HTML with the EXACT index.html content (no React)
    const splashHtml = `<!doctype html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background-color: #09090b; }
    #splash-screen {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #09090b;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      user-select: none;
      z-index: 99999;
    }
    .splash-pulse {
      animation: splashPulse 1.8s ease-in-out infinite;
    }
    @keyframes splashPulse {
      0%, 100% { opacity: 0.95; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.02); }
    }
    .splash-icon-img {
      width: min(240px, 62vw);
      height: min(240px, 62vw);
      min-width: 160px;
      min-height: 160px;
      max-width: 280px;
      max-height: 280px;
      border-radius: 54px;
      box-shadow: 0 20px 45px rgba(245, 158, 11, 0.4), 0 0 35px rgba(245, 158, 11, 0.25);
      object-fit: cover;
      display: block;
    }
    .splash-title {
      font-size: clamp(22px, 5.5vw, 32px);
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #f4f4f5;
      text-transform: uppercase;
      margin-top: 24px;
      text-align: center;
    }
    .splash-sub {
      font-size: clamp(11px, 2.8vw, 13px);
      font-weight: 600;
      color: #a1a1aa;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin-top: 6px;
      text-align: center;
    }
    .splash-bar {
      width: min(180px, 48vw);
      height: 3.5px;
      background: #27272a;
      border-radius: 999px;
      overflow: hidden;
      position: relative;
      margin-top: 24px;
    }
    .splash-bar-fill {
      position: absolute;
      top: 0;
      bottom: 0;
      left: -40%;
      width: 60%;
      background: linear-gradient(90deg, transparent, #f59e0b, #fbbf24, transparent);
      border-radius: 999px;
      animation: splashSweep 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    @keyframes splashSweep {
      0% { left: -60%; }
      100% { left: 100%; }
    }
  </style>
</head>
<body>
  <div id="splash-screen">
    <div class="splash-pulse" style="display:flex; flex-direction:column; align-items:center;">
      <img src="${jpegData}" alt="VDS-VL Quiz Master Icon" class="splash-icon-img" />
      <div class="splash-title">
        VDS-VL <span style="color: #f59e0b;">Quiz Master</span>
      </div>
      <div class="splash-sub">
        Volo Libero • AeCI
      </div>
    </div>
    <div class="splash-bar">
      <div class="splash-bar-fill"></div>
    </div>
    <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #71717a; letter-spacing: 0.22em; margin-top: 12px; text-transform: uppercase;">
      Avionics Ready
    </div>
  </div>
</body>
</html>`;

    const previewPath = path.resolve('temp_splash_preview_selfcontained.html');
    fs.writeFileSync(previewPath, splashHtml, 'utf8');

    // 4. Capture Mobile Portrait Screenshot
    console.log('Capturing real mobile screenshot (390x844)...');
    await pageCdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    const fileUrl = `file:///${previewPath.replace(/\\/g, '/')}`;
    await pageCdp.send('Page.navigate', { url: fileUrl });
    await sleep(700);

    // Verify image is actually painted and has naturalWidth > 0
    const imgCheck = await pageCdp.send('Runtime.evaluate', {
      expression: `(() => {
        const img = document.querySelector('.splash-icon-img');
        return {
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          clientWidth: img.clientWidth,
          clientHeight: img.clientHeight,
          complete: img.complete
        };
      })()`,
      returnByValue: true
    });
    console.log('Mobile Image Verification:', imgCheck.result.value);

    const mobileScreen = await pageCdp.send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 390, height: 844, scale: 1 },
      fromSurface: true
    });

    const mobileBrainPath = path.join(brainDir, 'splash_screen_mobile.png');
    const mobilePublicPath = path.resolve('public/splash_screen_mobile.png');
    const mobileBuf = Buffer.from(mobileScreen.data, 'base64');
    fs.writeFileSync(mobileBrainPath, mobileBuf);
    fs.writeFileSync(mobilePublicPath, mobileBuf);
    console.log(`📸 Saved real mobile screenshot: ${mobileBrainPath} (${mobileBuf.length} bytes)`);

    // 5. Capture Desktop Screenshot (1440x900)
    console.log('Capturing real desktop screenshot (1440x900)...');
    await pageCdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await pageCdp.send('Page.navigate', { url: fileUrl });
    await sleep(700);

    const desktopScreen = await pageCdp.send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 1440, height: 900, scale: 1 },
      fromSurface: true
    });

    const desktopBrainPath = path.join(brainDir, 'splash_screen_desktop.png');
    const desktopPublicPath = path.resolve('public/splash_screen_desktop.png');
    const desktopBuf = Buffer.from(desktopScreen.data, 'base64');
    fs.writeFileSync(desktopBrainPath, desktopBuf);
    fs.writeFileSync(desktopPublicPath, desktopBuf);
    console.log(`📸 Saved real desktop screenshot: ${desktopBrainPath} (${desktopBuf.length} bytes)`);

    // Clean up
    if (fs.existsSync(previewPath)) fs.unlinkSync(previewPath);

    pageCdp.close();
    cdp.close();

    // Rebuild splash_viewer.html
    const splashViewerHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    body { margin: 0; padding: 12px; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased">
  <div class="bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-2xl p-4 shadow-2xl max-w-4xl mx-auto">
    <div class="flex items-center justify-between border-b border-[#27272a] pb-3 mb-4">
      <div>
        <h2 class="text-base font-bold text-amber-500 flex items-center gap-2">
          <span>🚀</span> Splash Screen Ufficiale VDS-VL
        </h2>
        <p class="text-xs text-zinc-400 mt-0.5">Icona Master con texture carbonio e cupola ambra avionica</p>
      </div>
      <div class="flex items-center gap-1.5 bg-[#18181b] p-1 rounded-lg border border-[#27272a]">
        <button id="btn-mobile" onclick="showView('mobile')" class="px-3 py-1 text-xs font-bold rounded-md bg-amber-500 text-black transition-all">
          📱 Mobile (390x844)
        </button>
        <button id="btn-desktop" onclick="showView('desktop')" class="px-3 py-1 text-xs font-semibold rounded-md text-zinc-400 hover:text-white transition-all">
          💻 Desktop
        </button>
      </div>
    </div>

    <!-- Mobile View -->
    <div id="view-mobile" class="flex flex-col items-center justify-center p-2">
      <div class="relative rounded-[32px] overflow-hidden border-4 border-[#27272a] shadow-2xl bg-[#09090b] max-w-[280px]">
        <img src="data:image/png;base64,${mobileBuf.toString('base64')}" alt="Splash Screen Mobile" class="w-full h-auto block" />
      </div>
      <span class="text-[11px] text-zinc-400 mt-2">Screenshot reale iPhone (390 x 844 px @2x)</span>
    </div>

    <!-- Desktop View -->
    <div id="view-desktop" class="hidden flex-col items-center justify-center p-2">
      <div class="relative rounded-xl overflow-hidden border-2 border-[#27272a] shadow-2xl bg-[#09090b] w-full max-w-2xl">
        <img src="data:image/png;base64,${desktopBuf.toString('base64')}" alt="Splash Screen Desktop" class="w-full h-auto block" />
      </div>
      <span class="text-[11px] text-zinc-400 mt-2">Screenshot reale Desktop (1440 x 900 px)</span>
    </div>
  </div>

  <script>
    function showView(view) {
      if (view === 'mobile') {
        document.getElementById('view-mobile').classList.remove('hidden');
        document.getElementById('view-desktop').classList.add('hidden');
        document.getElementById('btn-mobile').className = 'px-3 py-1 text-xs font-bold rounded-md bg-amber-500 text-black transition-all';
        document.getElementById('btn-desktop').className = 'px-3 py-1 text-xs font-semibold rounded-md text-zinc-400 hover:text-white transition-all';
      } else {
        document.getElementById('view-mobile').classList.add('hidden');
        document.getElementById('view-desktop').classList.remove('hidden');
        document.getElementById('btn-desktop').className = 'px-3 py-1 text-xs font-bold rounded-md bg-amber-500 text-black transition-all';
        document.getElementById('btn-mobile').className = 'px-3 py-1 text-xs font-semibold rounded-md text-zinc-400 hover:text-white transition-all';
      }
    }
  </script>
</body>
</html>`;

    fs.writeFileSync(path.join(brainDir, 'splash_viewer.html'), splashViewerHtml, 'utf8');
    console.log('✅ splash_viewer.html updated with embedded screenshot data');
  } finally {
    browser.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
