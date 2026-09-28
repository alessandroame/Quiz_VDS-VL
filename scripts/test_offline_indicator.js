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

const BROWSER_BIN = POSSIBLE_PATHS.find(p => fs.existsSync(p)) || null;

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('--- Collaudo Visivo e Funzionale: Indicatore Offline PWA ---');

  if (!BROWSER_BIN) {
    console.error('ERRORE: Nessun browser Chrome/Edge trovato.');
    process.exit(1);
  }

  const port = 9444;
  const tempProfile = path.join(os.tmpdir(), `chrome_quiz_offline_${port}`);
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const preview = spawn('npx', ['vite', 'preview', '--port', '5173'], {
    shell: true,
    stdio: 'ignore'
  });

  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://localhost:5173/');
      if (res.ok) break;
    } catch {
      await sleep(250);
    }
  }
  await sleep(500);

  const browser = spawn(BROWSER_BIN, [
    '--headless=new',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-sync',
    'about:blank'
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await sleep(200);
      try {
        const list = await getJson(`http://127.0.0.1:${port}/json/list`);
        if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
          wsUrl = list[0].webSocketDebuggerUrl;
          break;
        }
      } catch (e) {}
    }

    if (!wsUrl) {
      throw new Error('Impossibile ottenere WebSocket CDP');
    }

    const ws = new globalThis.WebSocket(wsUrl);
    let msgId = 1;
    const pending = new Map();
    const consoleErrors = [];

    await new Promise(resolve => (ws.onopen = resolve));

    ws.onmessage = event => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = (msg.params.args || []).map(a => a.value || a.description || '').join(' ');
        console.log(`[BROWSER ${msg.params.type.toUpperCase()}] ${text}`);
        if (msg.params.type === 'error') {
          consoleErrors.push(text);
        }
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
        consoleErrors.push(msg.params.exceptionDetails.text || 'Exception');
      }
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    const send = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    const evaluate = async expr => {
      const res = await send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true
      });
      return res.result ? res.result.value : null;
    };

    const captureScreenshot = async filename => {
      const shotRes = await send('Page.captureScreenshot', { format: 'png' });
      const filePath = path.join(screenshotsDir, filename);
      fs.writeFileSync(filePath, Buffer.from(shotRes.data, 'base64'));
      console.log(`[CDP] Screenshot salvato: ${filePath}`);
      return filePath;
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Network.enable');

    // Imposta viewport Mobile Portrait 390x844
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log('[CDP] Navigazione verso http://localhost:5173...');
    await send('Page.navigate', { url: 'http://localhost:5173' });
    
    // Attendi che l'app React sia idratata
    let appReady = false;
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      const hasHeader = await evaluate(`!!document.querySelector('header')`);
      const readyState = await evaluate(`document.readyState`);
      const bodySnippet = await evaluate(`document.body.innerHTML.slice(0, 100)`);
      if (hasHeader) {
        appReady = true;
        console.log(`[CDP] App React idratata in ${(i + 1) * 500}ms`);
        break;
      } else {
        console.log(`[CDP] Attesa idratazione... state: ${readyState}, body: ${bodySnippet}`);
      }
    }

    if (!appReady) {
      throw new Error("L'applicazione React non si è caricata in tempo utile");
    }

    // 1. Verifica iniziale: Online nominale (nessun badge offline)
    const initialOfflineBtn = await evaluate(`!!document.getElementById('btn-offline-status')`);
    console.log(`[TEST 1] Badge offline presente da online? ${initialOfflineBtn} (Atteso: false)`);
    if (initialOfflineBtn) {
      throw new Error('Badge offline non dovrebbe essere visibile quando online');
    }

    // 2. Simula evento offline
    console.log('[CDP] Trigger evento offline...');
    await send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0
    });
    await evaluate(`window.dispatchEvent(new Event('offline'))`);
    await sleep(600);

    const debugInfo = await evaluate(`({
      online: navigator.onLine,
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.id || b.innerText),
      headerHtml: document.querySelector('header')?.innerHTML
    })`);
    console.log('[DEBUG] Browser state:', JSON.stringify(debugInfo, null, 2));

    // Verifica comparsa badge e banner
    const isBadgeVisible = await evaluate(`!!document.getElementById('btn-offline-status')`);
    const badgeText = await evaluate(`document.getElementById('btn-offline-status')?.innerText || ''`);
    const isBannerVisible = await evaluate(`!!document.getElementById('offline-banner')`);

    console.log(`[TEST 2] Badge offline visibile: ${isBadgeVisible}, Testo: "${badgeText.trim()}", Banner: ${isBannerVisible}`);
    if (!isBadgeVisible || !badgeText.includes('OFFLINE') || !isBannerVisible) {
      throw new Error('Indicatore o banner offline non comparsi dopo evento offline');
    }

    await captureScreenshot('offline_mobile_banner_badge.png');

    // 3. Test click su badge -> Apertura Modal Briefing
    console.log('[CDP] Click sul badge offline per aprire la modale informativa...');
    await evaluate(`document.getElementById('btn-offline-status')?.click()`);
    await sleep(400);

    const hasModal = await evaluate(`document.body.innerText.includes('Modalità Offline') && document.body.innerText.includes('100% Autonomo')`);
    console.log(`[TEST 3] Modale informativa aperta: ${hasModal} (Atteso: true)`);
    if (!hasModal) {
      throw new Error('Modale informativa offline non aperta correttamente');
    }

    await captureScreenshot('offline_modal_briefing.png');

    // Chiudi modale cliccando su Ricevuto
    await evaluate(`document.getElementById('btn-confirm-offline-modal')?.click()`);
    await sleep(400);

    // 4. Test Drive Mode: verifica tag offline nel cockpit HUD
    console.log('[CDP] Ingresso in Modalità Alla Guida...');
    await evaluate(`document.getElementById('btn-drive-mode')?.click()`);
    await sleep(600);

    const driveDebug = await evaluate(`({
      hasDriveExit: !!document.getElementById('btn-drive-exit'),
      hasDriveTag: !!document.getElementById('drive-offline-tag'),
      h1: document.querySelector('h1')?.innerText,
      bodyText: document.body.innerText.slice(0, 200)
    })`);
    console.log('[DEBUG DRIVE]', JSON.stringify(driveDebug, null, 2));

    const isDriveOfflineTagVisible = await evaluate(`!!document.getElementById('drive-offline-tag')`);
    const driveTagText = await evaluate(`document.getElementById('drive-offline-tag')?.innerText || ''`);
    console.log(`[TEST 4] Tag offline in Drive Mode presente: ${isDriveOfflineTagVisible}, Testo: "${driveTagText.trim()}"`);
    if (!isDriveOfflineTagVisible || !driveTagText.includes('OFFLINE')) {
      throw new Error('Tag offline non visibile nell HUD di Drive Mode');
    }

    await captureScreenshot('offline_drive_mode_hud.png');

    // Esci da Drive Mode
    await evaluate(`document.getElementById('btn-drive-exit')?.click()`);
    await sleep(400);

    // 5. Test transizione Online
    console.log('[CDP] Trigger evento online (ripristino connettività)...');
    await send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1
    });
    await evaluate(`window.dispatchEvent(new Event('online'))`);
    await sleep(600);

    const onlineBadgeText = await evaluate(`document.getElementById('btn-offline-status')?.innerText || ''`);
    const isOnlineBanner = await evaluate(`document.getElementById('offline-banner')?.innerText.includes('Ripristinata') || false`);
    console.log(`[TEST 5] Badge riconnessione: "${onlineBadgeText.trim()}", Banner: ${isOnlineBanner}`);
    if (!onlineBadgeText.includes('ONLINE') || !isOnlineBanner) {
      throw new Error('Transizione alla riconnessione online fallita');
    }

    await captureScreenshot('reconnected_online_feedback.png');

    // Verifica assenza errori console
    console.log(`[CONSOLE] Errori JavaScript intercettati: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error('Errori console rilevati:', consoleErrors);
      throw new Error('Rilevati errori in console durante il collaudo!');
    }

    console.log('✅ TUTTI I TEST COLLAUDO OFFLINE SUPERATI CON SUCCESSO!');
    ws.close();
  } finally {
    browser.kill();
    preview.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch (e) {}
  }
}

run().catch(err => {
  console.error('Test fallito:', err);
  process.exit(1);
});
