import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const chromePath = chromePaths.find(p => fs.existsSync(p));
if (!chromePath) {
  console.error('Browser non trovato');
  process.exit(1);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const cdpPort = 9228;

  let previewProc = null;
  try {
    const res = await fetch('http://localhost:5173/');
    if (!res.ok) throw new Error('Not ok');
  } catch {
    console.log('Avvio vite preview su porta 5173...');
    previewProc = spawn('npx', ['vite', 'preview', '--port', '5173'], {
      shell: true,
      stdio: 'ignore'
    });
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch('http://localhost:5173/');
        if (res.ok) break;
      } catch {
        await sleep(250);
      }
    }
  }

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await sleep(1500);

    const getTargets = () =>
      new Promise((resolve, reject) => {
        http
          .get(`http://127.0.0.1:${cdpPort}/json`, res => {
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => resolve(JSON.parse(data)));
          })
          .on('error', reject);
      });

    const targets = await getTargets();
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('Target page non trovato');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let msgId = 1;
    const send = (method, params = {}) =>
      new Promise(resolve => {
        const id = msgId++;
        const handler = event => {
          const msg = JSON.parse(event.data);
          if (msg.id === id) {
            ws.removeEventListener('message', handler);
            resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });

    await new Promise(r => ws.addEventListener('open', r));

    const errors = [];
    ws.addEventListener('message', event => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        errors.push(msg.params.args.map(a => a.value || a.description).join(' '));
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');

    // 1. Mobile Portrait Test (390x844)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log('[1] Caricamento applicazione su http://localhost:5173...');
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await sleep(2000);

    console.log('[2] Apertura Schermata Impostazioni...');
    const evalOpenSettings = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('btn-settings') ||
                    document.querySelector('button[aria-label="Impostazioni"]') || 
                    document.querySelector('button:has(svg.lucide-settings)');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true
    });
    console.log('   Pulsante impostazioni cliccato:', evalOpenSettings.result.value);
    await sleep(500);

    console.log('[3] Verifica dimensioni fullscreen (Mobile 390x844)...');
    const evalFullscreenMetrics = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.querySelector('div[role="dialog"][aria-label="Impostazioni"]');
        if (!modal) return { found: false };
        const rect = modal.getBoundingClientRect();
        const computed = window.getComputedStyle(modal);
        return {
          found: true,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          position: computed.position,
          hasCloseBtn: Boolean(document.getElementById('btn-close-settings')),
          hasCloseXBtn: Boolean(document.getElementById('btn-close-settings-x')),
          hasFsToggle: Boolean(document.getElementById('btn-toggle-fullscreen')),
          tabsCount: document.querySelectorAll('[id^="tab-"]').length
        };
      })()`,
      returnByValue: true
    });
    console.log('   Metriche rilevate:', JSON.stringify(evalFullscreenMetrics.result.value, null, 2));

    const metrics = evalFullscreenMetrics.result.value;
    if (!metrics.found) throw new Error('Schermata impostazioni non trovata nel DOM');
    if (metrics.width !== 390 || metrics.height !== 844) {
      throw new Error(`Dimensioni non fullscreen: ${metrics.width}x${metrics.height} (atteso: 390x844)`);
    }

    console.log('[4] Cattura screenshot Mobile Portrait (390x844)...');
    const screenshotMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/test_settings_fullscreen_mobile.png', Buffer.from(screenshotMobile.data, 'base64'));
    console.log('   Screenshot salvato in public/test_settings_fullscreen_mobile.png');

    // 2. Desktop Test (1440x900)
    console.log('[5] Passaggio a risoluzione Desktop (1440x900)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(500);

    const evalDesktopMetrics = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.querySelector('div[role="dialog"][aria-label="Impostazioni"]');
        if (!modal) return { found: false };
        const rect = modal.getBoundingClientRect();
        return {
          found: true,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left
        };
      })()`,
      returnByValue: true
    });
    console.log('   Metriche Desktop:', JSON.stringify(evalDesktopMetrics.result.value, null, 2));

    if (evalDesktopMetrics.result.value.width !== 1440 || evalDesktopMetrics.result.value.height !== 900) {
      throw new Error(`Dimensioni desktop non fullscreen: ${evalDesktopMetrics.result.value.width}x${evalDesktopMetrics.result.value.height}`);
    }

    console.log('[6] Cattura screenshot Desktop (1440x900)...');
    const screenshotDesktop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/test_settings_fullscreen_desktop.png', Buffer.from(screenshotDesktop.data, 'base64'));
    console.log('   Screenshot salvato in public/test_settings_fullscreen_desktop.png');

    // 3. Test Chiusura Impostazioni
    console.log('[7] Test chiusura impostazioni con pulsante Indietro...');
    const evalClose = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('btn-close-settings');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true
    });
    console.log('   Pulsante indietro cliccato:', evalClose.result.value);
    await sleep(400);

    const evalClosedCheck = await send('Runtime.evaluate', {
      expression: `Boolean(document.querySelector('div[role="dialog"][aria-label="Impostazioni"]'))`,
      returnByValue: true
    });
    console.log('   Schermata impostazioni ancora aperta?', evalClosedCheck.result.value);
    if (evalClosedCheck.result.value) {
      throw new Error('La schermata impostazioni non si è chiusa correttamente');
    }

    console.log('[8] Verifica assenza errori console JavaScript...');
    if (errors.length > 0) {
      console.warn('   Errori rilevati in console:', errors);
      throw new Error('Rilevati errori JavaScript in console durante il test');
    } else {
      console.log('   0 errori in console JavaScript! Test superato al 100%.');
    }

    ws.close();
  } finally {
    chromeProc.kill();
    if (previewProc) previewProc.kill();
  }
}

main().catch(err => {
  console.error('Test fallito:', err);
  process.exit(1);
});
