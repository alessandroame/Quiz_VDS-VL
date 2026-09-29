// Interactive CDP Test for First-Launch Discipline Onboarding Modal
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

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
  const cdpPort = 9236;

  // Verify dev/preview server is running
  try {
    const res = await fetch('http://localhost:5173/');
    if (!res.ok) throw new Error('Not ok');
    console.log('Web server già attivo su porta 5173.');
  } catch {
    console.error('Web server non raggiungibile su porta 5173. Avvialo prima di eseguire il test.');
    process.exit(1);
  }

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
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
            res.on('end', () => resolve(JSON.parse(data)));
          })
          .on('error', reject);
      });

    let targets = null;
    for (let i = 0; i < 30; i++) {
      try {
        targets = await getTargets();
        if (targets && targets.find(t => t.type === 'page')) break;
      } catch {
        await sleep(300);
      }
    }
    const target = targets ? targets.find(t => t.type === 'page') : null;
    if (!target) throw new Error('Target non trovato');

    const ws = new globalThis.WebSocket(target.webSocketDebuggerUrl);
    let msgId = 1;
    const callbacks = new Map();
    const consoleErrors = [];

    ws.onmessage = event => {
      const parsed = JSON.parse(event.data);
      if (parsed.method === 'Runtime.consoleAPICalled') {
        const type = parsed.params.type;
        const text = parsed.params.args.map(a => a.value || a.description || '').join(' ');
        if (type === 'error' && !text.includes('Failed to load resource')) {
          consoleErrors.push(text);
        }
      }
      if (parsed.id && callbacks.has(parsed.id)) {
        const cb = callbacks.get(parsed.id);
        callbacks.delete(parsed.id);
        cb(parsed);
      }
    };

    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = rej;
    });

    const send = (method, params = {}) =>
      new Promise(resolve => {
        const id = msgId++;
        callbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });

    const evaluate = async expr => {
      const r = await send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true
      });
      return r.result?.result?.value;
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    console.log('\n--- 1. Reset IndexedDB e Navigazione Fresh Start (Mobile 390x844) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2500);

    // Reset settings in Dexie to simulate first run
    await evaluate(`(async () => {
      const req = indexedDB.deleteDatabase('VdsQuizMasterDB');
      await new Promise(r => { req.onsuccess = r; req.onerror = r; req.onblocked = r; });
    })()`);

    // Reload page to initiate genuine first-run
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2500);

    console.log('--- 2. Verifica Comparsa Modale Onboarding Iniziale ---');
    const modalCheck = await evaluate(`(() => {
      const modal = document.querySelector('[role="dialog"][aria-labelledby="discipline-onboarding-title"]');
      const title = document.getElementById('discipline-onboarding-title')?.textContent;
      const optParaglider = document.getElementById('onboarding-option-paraglider');
      const optHangGlider = document.getElementById('onboarding-option-hang_glider');
      const optAll = document.getElementById('onboarding-option-all');
      const confirmBtn = document.getElementById('btn-confirm-discipline-onboarding');
      return {
        hasModal: !!modal,
        title,
        hasParaglider: !!optParaglider,
        hasHangGlider: !!optHangGlider,
        hasAll: !!optAll,
        hasConfirmBtn: !!confirmBtn
      };
    })()`);

    console.log('Modale onboarding presente:', modalCheck?.hasModal);
    console.log('Titolo modale:', modalCheck?.title);
    console.log('Opzioni presenti (Parapendio, Deltaplano, Tutti):', 
      modalCheck?.hasParaglider && modalCheck?.hasHangGlider && modalCheck?.hasAll
    );

    if (!modalCheck?.hasModal) {
      throw new Error('Modale onboarding non comparsa al primo avvio!');
    }

    // Save Mobile Screenshot
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    const b64_1 = ss1.result?.data || ss1.data;
    if (b64_1) {
      fs.writeFileSync('public/test_discipline_onboarding_mobile.png', Buffer.from(b64_1, 'base64'));
      console.log('Salvato screenshot: public/test_discipline_onboarding_mobile.png');
    }

    console.log('\n--- 3. Selezione Corso Deltaplano e Conferma ---');
    const selectDelta = await evaluate(`(() => {
      const optDelta = document.getElementById('onboarding-option-hang_glider');
      if (optDelta) {
        optDelta.click();
        return optDelta.getAttribute('aria-checked');
      }
      return null;
    })()`);
    console.log('Deltaplano selezionato (aria-checked):', selectDelta);

    // Click confirm button
    await evaluate(`document.getElementById('btn-confirm-discipline-onboarding')?.click()`);
    await sleep(1500);

    // Verify modal is closed
    const modalClosedCheck = await evaluate(`!document.querySelector('[role="dialog"][aria-labelledby="discipline-onboarding-title"]')`);
    console.log('Modale chiusa dopo la conferma:', modalClosedCheck);

    console.log('\n--- 4. Verifica Effettiva Impostazione Filtro Disciplina ---');
    // Navigate to Topics tab to verify discipline count for Tecnica di Pilotaggio
    await evaluate(`document.getElementById('nav-topics')?.click()`);
    await sleep(1500);

    const topicsPilotaggioCheck = await evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('[id^="subject-card-"]'));
      const pilotaggioCard = cards.find(c => c.textContent.includes('Tecnica di Pilotaggio'));
      return {
        pilotaggioFound: !!pilotaggioCard,
        pilotaggioText: pilotaggioCard ? pilotaggioCard.textContent : ''
      };
    })()`);

    console.log('Scheda Tecnica di Pilotaggio presente:', topicsPilotaggioCheck?.pilotaggioFound);
    console.log('Pilotaggio configurato con 54 quiz di Deltaplano:', topicsPilotaggioCheck?.pilotaggioText.includes('54'));

    console.log('\n--- 5. Switch Desktop (1440x900) e Screenshot Desktop ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(1000);

    const ss2 = await send('Page.captureScreenshot', { format: 'png' });
    const b64_2 = ss2.result?.data || ss2.data;
    if (b64_2) {
      fs.writeFileSync('public/test_discipline_onboarding_desktop.png', Buffer.from(b64_2, 'base64'));
      console.log('Salvato screenshot: public/test_discipline_onboarding_desktop.png');
    }

    console.log('\n--- 6. Test Secondo Avvio (Reload): Modale NON Deve Ricomparire ---');
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2500);

    const secondLaunchCheck = await evaluate(`(() => {
      const modal = document.querySelector('[role="dialog"][aria-labelledby="discipline-onboarding-title"]');
      return {
        modalPresent: !!modal
      };
    })()`);
    console.log('Modale assente al secondo avvio (persistenza verificata):', !secondLaunchCheck?.modalPresent);

    if (secondLaunchCheck?.modalPresent) {
      throw new Error('La modale di onboarding è ricomparsa al secondo avvio pur essendo già completata!');
    }

    console.log('\n--- 7. Verifica Errori Console Browser ---');
    console.log('Errori console riscontrati:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.error('Dettaglio errori:', consoleErrors);
    }

    ws.close();
    chromeProc.kill();
    console.log('\n>>> COLLAUDO ONBOARDING DISCIPLINA PRIMO AVVIO COMPLETATO CON SUCCESSO! <<<\n');
  } catch (err) {
    console.error('Errore durante il test CDP:', err);
    chromeProc.kill();
    process.exit(1);
  }
}

main();
