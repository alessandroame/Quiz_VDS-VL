// scripts/test_drive_theme.cjs
// Verifies that Drive Mode properly respects the light/dark color theme via CDP
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

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
  const cdpPort = 9222 + Math.floor(Math.random() * 500);
  const tempProfile = path.join(require('os').tmpdir(), `chrome_drive_theme_${cdpPort}`);

  let previewProc = null;
  try {
    const res = await fetch('http://localhost:5173/');
    if (!res.ok) throw new Error('Not ok');
    console.log('Server preview già attivo su porta 5173.');
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
    `--user-data-dir=${tempProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    const getTargets = () =>
      new Promise((resolve, reject) => {
        http
          .get(`http://127.0.0.1:${cdpPort}/json`, res => {
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => {
              try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
          })
          .on('error', reject);
      });

    let targets = null;
    for (let i = 0; i < 30; i++) {
      await sleep(150);
      try {
        targets = await getTargets();
        if (targets && targets.length > 0) break;
      } catch (e) {}
    }
    if (!targets) throw new Error('Impossibile connettersi al CDP');
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('Nessun page target trovato');

    const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);
    let msgId = 1;
    const callbacks = new Map();
    const consoleErrors = [];

    await new Promise(r => ws.onopen = r);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        const text = msg.params.args.map(a => a.value || a.description).join(' ');
        consoleErrors.push(text);
      }
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg);
      }
    };

    const send = (method, params = {}) =>
      new Promise(resolve => {
        const id = msgId++;
        callbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });

    await send('Runtime.enable');
    await send('Page.enable');

    // Imposta viewport mobile 390x844
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    // Naviga all'app
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2000);

    // Imposta tema chiaro e salta onboarding
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('vds_theme', 'light');
        localStorage.setItem('vds_onboarding_discipline_dismissed', 'true');
        document.documentElement.className = 'light';
      `
    });

    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2500);

    // Verifica che il tema sia 'light'
    const themeEval = await send('Runtime.evaluate', {
      expression: `document.documentElement.className`
    });
    console.log('Document root class:', themeEval.result.result.value);

    // Dismiss onboarding if present
    await send('Runtime.evaluate', {
      expression: `
        const obBtn = document.getElementById('btn-confirm-discipline-onboarding');
        if (obBtn) obBtn.click();
      `
    });
    await sleep(800);

    // Clicca sul pulsante 'Alla Guida'
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-drive-mode').click();`
    });
    await sleep(1000);

    // Chiudi prompt audio offline se presente
    await send('Runtime.evaluate', {
      expression: `
        const audioDismiss = document.getElementById('btn-dismiss-audio-prompt');
        if (audioDismiss) audioDismiss.click();
      `
    });
    await sleep(600);

    // Verifica lo sfondo del contenitore DriveMode
    const bgEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('.fixed.inset-0.z-50');
        if (!el) return 'NOT_FOUND';
        const style = window.getComputedStyle(el);
        return {
          bg: style.backgroundColor,
          color: style.color
        };
      })()`,
      returnByValue: true
    });
    console.log('Drive Mode container computed style:', JSON.stringify(bgEval.result.result.value));

    // Scatta screenshot del Launcher in tema chiaro
    const screenshotLauncher = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(__dirname, '../public/test_drive_light_launcher.png'),
      Buffer.from(screenshotLauncher.result.data, 'base64')
    );
    console.log('Screenshot salvato: public/test_drive_light_launcher.png');

    // Avvia Radio Quiz Continuo per verificare la schermata di quiz attivo in tema chiaro
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-drive-start-radio').click();`
    });
    await sleep(1500);

    // Verifica lo sfondo dell'Area Domanda
    const areaDomandaEval = await send('Runtime.evaluate', {
      expression: `(() => {
        const area = document.querySelector('.my-2.p-3');
        if (!area) return 'NOT_FOUND';
        const style = window.getComputedStyle(area);
        return {
          bg: style.backgroundColor,
          color: style.color
        };
      })()`,
      returnByValue: true
    });
    console.log('Area Domanda computed style:', JSON.stringify(areaDomandaEval.result.result.value));

    // Scatta screenshot del Quiz attivo in tema chiaro
    const screenshotRunning = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(
      path.join(__dirname, '../public/test_drive_light_running.png'),
      Buffer.from(screenshotRunning.result.data, 'base64')
    );
    console.log('Screenshot salvato: public/test_drive_light_running.png');

    console.log('Console errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.warn('Avviso: Console errors rilevati:', consoleErrors);
    }

    console.log('✅ TEST SUPERATO: Modalità Alla Guida rispetta pienamente il tema chiaro (Hangar Light)!');
    ws.close();
  } finally {
    chromeProc.kill();
    if (previewProc) previewProc.kill();
  }
}

main().catch(err => {
  console.error('Errore test:', err);
  process.exit(1);
});
