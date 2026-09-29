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
  const cdpPort = 9226;

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
    '--autoplay-policy=no-user-gesture-required',
    'about:blank'
  ]);

  try {
    await sleep(2000);

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

    await new Promise(r => (ws.onopen = r));

    const errors = [];
    ws.addEventListener('message', event => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        if (msg.params.type === 'error') {
          errors.push(text);
          console.error('[Browser Error]', text);
        }
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');

    console.log('1. Caricamento applicazione su http://localhost:5173/...');
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2500);

    // Reset driveModeIntroPlayed in database per test pulito
    await send('Runtime.evaluate', {
      expression: `(async () => {
        const req = indexedDB.open('VdsQuizMasterDB');
        req.onsuccess = () => {
          const db = req.result;
          if (db.objectStoreNames.contains('settings')) {
            const tx = db.transaction('settings', 'readwrite');
            tx.objectStore('settings').put({ key: 'driveModeIntroPlayed', value: false });
            tx.objectStore('settings').put({ key: 'audioOfflinePromptDismissed', value: true });
          }
        };
      })()`,
      awaitPromise: true
    });
    await sleep(500);

    console.log('2. Apertura Modalità Alla Guida per la prima volta...');
    // Clicca sul pulsante auto nella Navbar
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-drive-mode')?.click()`
    });
    await sleep(1000);

    // Verifica presenza del banner Guida Vocale Iniziale
    const eval1 = await send('Runtime.evaluate', {
      expression: `(() => {
        const banner = document.getElementById('btn-skip-drive-intro');
        const replay = document.getElementById('btn-replay-drive-intro');
        return { hasBanner: !!banner, hasReplay: !!replay };
      })()`,
      returnByValue: true
    });

    const check1 = eval1?.result?.value;
    console.log('Verifica 1 (Primo avvio):', check1);
    if (!check1 || !check1.hasBanner || !check1.hasReplay) {
      throw new Error(`Banner introduttivo non rilevato al primo avvio: ${JSON.stringify(check1)}`);
    }

    console.log('3. Test tasto Salta per completare l\'introduzione...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-skip-drive-intro').click()`
    });
    await sleep(500);

    // Verifica che il banner sia scomparso
    const eval2 = await send('Runtime.evaluate', {
      expression: `!document.getElementById('btn-skip-drive-intro')`,
      returnByValue: true
    });
    const check2 = eval2?.result?.value;
    console.log('Verifica 2 (Banner scomparso dopo Salta):', check2);
    if (!check2) {
      throw new Error('Il banner non è scomparso dopo il click su Salta');
    }

    // Chiudi Modalità Guida
    console.log('4. Chiusura e riapertura Modalità Guida (verifica run-once)...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-drive-exit').click()`
    });
    await sleep(500);

    // Riapri Modalità Guida
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-drive-mode')?.click()`
    });
    await sleep(1000);

    // Verifica che il banner NON appaia più automaticamente
    const eval3 = await send('Runtime.evaluate', {
      expression: `!document.getElementById('btn-skip-drive-intro')`,
      returnByValue: true
    });
    const check3 = eval3?.result?.value;
    console.log('Verifica 3 (Non viene rieseguito automaticamente):', check3);
    if (!check3) {
      throw new Error('Il banner è riapparso automaticamente nonostante fosse già stato eseguito!');
    }

    // Test riascolto on-demand
    console.log('5. Test riascolto on-demand dal pulsante Spiegazione Vocale...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-replay-drive-intro').click()`
    });
    await sleep(600);

    const eval4 = await send('Runtime.evaluate', {
      expression: `!!document.getElementById('btn-skip-drive-intro')`,
      returnByValue: true
    });
    const check4 = eval4?.result?.value;
    console.log('Verifica 4 (Riascolto on-demand attivato):', check4);
    if (!check4) {
      throw new Error('Il pulsante Riascolta Spiegazione non ha riattivato il banner');
    }

    // Salta e chiudi guida
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-skip-drive-intro').click()`
    });
    await sleep(300);
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-drive-exit').click()`
    });
    await sleep(500);

    // Test Scheda Impostazioni -> Guida
    console.log('6. Test scheda Impostazioni (Guida) e Riattiva all\'avvio...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-settings')?.click()`
    });
    await sleep(500);

    // Seleziona tab Guida
    await send('Runtime.evaluate', {
      expression: `document.getElementById('tab-drive')?.click()`
    });
    await sleep(500);

    const evalSettings = await send('Runtime.evaluate', {
      expression: `(() => {
        const replay = document.getElementById('btn-settings-replay-intro');
        const toggle = document.getElementById('btn-settings-toggle-intro');
        return {
          hasReplay: !!replay,
          hasToggle: !!toggle,
          toggleText: toggle ? toggle.textContent : ''
        };
      })()`,
      returnByValue: true
    });
    const checkSettings = evalSettings?.result?.value;
    console.log('Verifica 5 (Scheda Impostazioni Guida):', checkSettings);
    if (!checkSettings || !checkSettings.hasReplay || !checkSettings.hasToggle) {
      throw new Error(`Controlli impostazioni non trovati: ${JSON.stringify(checkSettings)}`);
    }

    // Clicca "Riattiva all'avvio"
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-settings-toggle-intro').click()`
    });
    await sleep(500);

    // Chiudi impostazioni
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-close-settings')?.click()`
    });
    await sleep(500);

    // Riapri Modalità Guida: deve partire di nuovo automaticamente perché è stata riattivata!
    console.log('7. Riapertura Modalità Guida dopo averla riattivata da impostazioni...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-drive-mode')?.click()`
    });
    await sleep(1000);

    const evalReactivated = await send('Runtime.evaluate', {
      expression: `!!document.getElementById('btn-skip-drive-intro')`,
      returnByValue: true
    });
    const checkReactivated = evalReactivated?.result?.value;
    console.log('Verifica 6 (Ripartita automaticamente dopo riattivazione):', checkReactivated);
    if (!checkReactivated) {
      throw new Error('La spiegazione non è ripartita automaticamente dopo la riattivazione!');
    }

    // Salta e chiudi
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-skip-drive-intro').click()`
    });
    await sleep(300);
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-drive-exit').click()`
    });

    console.log('--- Collaudo completato con successo al 100%! ---');
    console.log('Errori browser:', errors.length);
    if (errors.length > 0) {
      console.warn('Avviso errori:', errors);
    }
  } finally {
    chromeProc.kill();
    if (previewProc) previewProc.kill();
  }
}

main().catch(err => {
  console.error('Collaudo fallito:', err);
  process.exit(1);
});
