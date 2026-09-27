// scripts/visual_check.js - Zero-dependency Headless Visual & Interactive Testing Tool using native Chrome/Edge CDP
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const POSSIBLE_PATHS = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
  path.join(os.homedir(), 'AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe')
].filter(Boolean);

const BROWSER_BIN = POSSIBLE_PATHS.find(p => fs.existsSync(p)) || null;

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, orientation: { type: 'portraitPrimary', angle: 0 } },
  'mobile-portrait': { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, orientation: { type: 'portraitPrimary', angle: 0 } },
  'mobile-landscape': { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, orientation: { type: 'landscapePrimary', angle: 90 } },
  tablet: { width: 820, height: 1180, deviceScaleFactor: 2, isMobile: false }
};

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

async function runSingleViewportCheck(viewportName, options = {}) {
  const targetUrl = options.url || 'http://localhost:5173';
  const outputPath = options.output || path.join(os.tmpdir(), `quiz_vds_${viewportName}_preview.png`);
  const vp = VIEWPORTS[viewportName] || VIEWPORTS.desktop;
  const port = 9222 + Math.floor(Math.random() * 500);
  const tempProfile = path.join(os.tmpdir(), `chrome_quiz_vds_${port}`);

  if (!BROWSER_BIN) {
    console.error('ERRORE: Nessun eseguibile Chrome o Edge rilevato sul sistema host.');
    process.exit(1);
  }

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

  const consoleLogs = [];
  let ws = null;

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await sleep(150);
      try {
        const pages = await getJson(`http://localhost:${port}/json/list`);
        const targetPage = pages.find(p => p.type === 'page' && p.webSocketDebuggerUrl);
        if (targetPage) {
          wsUrl = targetPage.webSocketDebuggerUrl;
          break;
        }
      } catch (e) {}
    }

    if (!wsUrl) {
      throw new Error(`Impossibile connettersi al CDP Chrome sulla porta ${port}`);
    }

    ws = new globalThis.WebSocket(wsUrl);
    let msgId = 1;
    const pending = new Map();

    const send = (method, params = {}, timeoutMs = 15000) => {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const timer = setTimeout(() => {
          if (pending.has(id)) {
            pending.delete(id);
            reject(new Error(`Timeout (${timeoutMs}ms) invocazione CDP ${method}`));
          }
        }, timeoutMs);
        pending.set(id, {
          resolve: (res) => { clearTimeout(timer); resolve(res); },
          reject: (err) => { clearTimeout(timer); reject(err); }
        });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await new Promise(res => ws.onopen = res);

    ws.onmessage = (event) => {
      try {
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
        }
      } catch (e) {
        console.error('Errore parsing messaggio CDP:', e);
      }
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });

    // Imposta dimensioni viewport
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.deviceScaleFactor,
      mobile: vp.isMobile,
      screenOrientation: vp.orientation || { type: 'portraitPrimary', angle: 0 }
    });

    console.log(`[HEADLESS-CHECK] Navigazione verso ${targetUrl} (${viewportName}: ${vp.width}x${vp.height})...`);
    await send('Page.navigate', { url: targetUrl });
    await sleep(options.waitMs || 1500);

    // Esegui click interattivo opzionale su selettore CSS (o sequenza separata da virgola)
    if (options.clickSelector) {
      console.log(`[HEADLESS-CHECK] Interazione click su selettore: '${options.clickSelector}'...`);
      const clickRes = await send('Runtime.evaluate', {
        expression: `
          (async () => {
            const selectors = ${JSON.stringify(options.clickSelector)}.split(',').map(s => s.trim()).filter(Boolean);
            for (const sel of selectors) {
              const el = document.querySelector(sel);
              if (!el) return { success: false, reason: 'Elemento non trovato: ' + sel };
              el.scrollIntoView({ behavior: 'instant', block: 'center' });
              el.click();
              await new Promise(r => setTimeout(r, 300));
            }
            return { success: true };
          })()
        `,
        awaitPromise: true,
        returnByValue: true
      });
      if (!clickRes.result.value.success) {
        console.warn(`[HEADLESS-CHECK] Avviso click: ${clickRes.result.value.reason}`);
      }
      await sleep(500);
    }

    // Cattura screenshot PNG
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outputPath, Buffer.from(shot.data, 'base64'));
    console.log(`[HEADLESS-CHECK] Screenshot salvato: [${outputPath}](file:///${outputPath.replace(/\\/g, '/')})`);

    // Report console
    const errors = consoleLogs.filter(l => l.type === 'error');
    const warnings = consoleLogs.filter(l => l.type === 'warning');

    console.log(`[HEADLESS-CHECK] Console: ${consoleLogs.length} log, ${warnings.length} warning, ${errors.length} errori.`);
    if (errors.length > 0) {
      console.error('❌ Rilevati errori console:');
      errors.forEach(e => console.error(`  - ${e.text}`));
      return { success: false, outputPath, errors };
    }

    return { success: true, outputPath, errors: [] };

  } catch (err) {
    console.error(`❌ Errore durante l'esecuzione del test headless:`, err.message);
    return { success: false, error: err.message };
  } finally {
    if (ws && ws.readyState === 1) {
      try { ws.close(); } catch (e) {}
    }
    browser.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch (e) {}
  }
}

// CLI Runner
async function main() {
  const args = process.argv.slice(2);
  const targetViewport = args[0] || 'mobile-portrait';
  const targetUrl = args[1] || 'http://localhost:5173';
  const clickSelector = args[2] || null;
  const customOutput = args[3] || null;

  if (targetViewport === 'all') {
    const viewports = ['mobile-portrait', 'mobile-landscape', 'desktop'];
    let allPassed = true;
    for (const vp of viewports) {
      const res = await runSingleViewportCheck(vp, { url: targetUrl, clickSelector, output: customOutput });
      if (!res.success) allPassed = false;
    }
    process.exit(allPassed ? 0 : 1);
  } else {
    const res = await runSingleViewportCheck(targetViewport, { url: targetUrl, clickSelector, output: customOutput });
    process.exit(res.success ? 0 : 1);
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main();
}

export { runSingleViewportCheck, VIEWPORTS };
