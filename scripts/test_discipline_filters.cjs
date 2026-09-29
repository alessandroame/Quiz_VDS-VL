// Interactive CDP Test for Discipline Filtering and Tagging (Fase 8.1)
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
  const cdpPort = 9235;

  // Start preview server if not running
  let previewProc = null;
  try {
    const res = await fetch('http://localhost:5173/');
    if (!res.ok) throw new Error('Not ok');
    console.log('Preview server già attivo.');
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
    const target = targets.find(t => t.type === 'page');
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

    await send('Runtime.enable');
    await send('Page.enable');

    console.log('\n--- 1. Impostazione Viewport Mobile (390x844) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2500);

    // Reset settings in Dexie to test clean defaults
    await evaluate(`
      (async () => {
        if (window.indexedDB) {
          const req = window.indexedDB.open('VdsQuizMasterDB');
          req.onsuccess = () => {
            const db = req.result;
            if (db.objectStoreNames.contains('settings')) {
              const tx = db.transaction('settings', 'readwrite');
              tx.objectStore('settings').delete('activeSession');
            }
          };
        }
      })()
    `);
    await sleep(500);

    console.log('--- 2. Verifica Schermata Esame & Selettore Disciplina ---');
    const examSelectorFound = await evaluate(`
      Boolean(document.getElementById('exam-discipline-all') &&
              document.getElementById('exam-discipline-paraglider') &&
              document.getElementById('exam-discipline-hang_glider'))
    `);
    console.log('Selettori disciplina presenti in Schermata Esame:', examSelectorFound);
    if (!examSelectorFound) throw new Error('DisciplineSelector mancante in Esame');

    console.log('--- 3. Navigazione in Materie & Test Switch Disciplina ---');
    await evaluate(`document.getElementById('nav-topics')?.click()`);
    await sleep(1000);

    const topicsSelectorFound = await evaluate(`
      Boolean(document.getElementById('topics-discipline-all') &&
              document.getElementById('topics-discipline-paraglider') &&
              document.getElementById('topics-discipline-hang_glider'))
    `);
    console.log('Selettori disciplina presenti in Materie:', topicsSelectorFound);

    // Default 'all': Tecnica di pilotaggio ha 79 quesiti
    const allCountPilotaggio = await evaluate(`
      (() => {
        const text = document.body.innerText;
        return text.includes('79 quesiti') || text.includes('Tutte (79)');
      })()
    `);
    console.log('Tecnica di Pilotaggio con 79 quesiti in modalità Tutti:', allCountPilotaggio);

    // Click su Parapendio
    console.log('Switch su Parapendio...');
    await evaluate(`document.getElementById('topics-discipline-paraglider')?.click()`);
    await sleep(1000);

    // Parapendio: Tecnica di pilotaggio deve mostrare 61 quesiti (79 - 18 = 61)
    const pgCountPilotaggio = await evaluate(`
      (() => {
        const text = document.body.innerText;
        return text.includes('61 quesiti') || text.includes('Tutte (61)');
      })()
    `);
    console.log('Tecnica di Pilotaggio con 61 quesiti in modalità Parapendio:', pgCountPilotaggio);
    if (!pgCountPilotaggio) throw new Error('Conteggio 61 quesiti non trovato per Parapendio');

    // Click su Deltaplano
    console.log('Switch su Deltaplano...');
    await evaluate(`document.getElementById('topics-discipline-hang_glider')?.click()`);
    await sleep(1000);

    // Deltaplano: Tecnica di pilotaggio deve mostrare 54 quesiti (79 - 25 = 54)
    const hgCountPilotaggio = await evaluate(`
      (() => {
        const text = document.body.innerText;
        return text.includes('54 quesiti') || text.includes('Tutte (54)');
      })()
    `);
    console.log('Tecnica di Pilotaggio con 54 quesiti in modalità Deltaplano:', hgCountPilotaggio);
    if (!hgCountPilotaggio) throw new Error('Conteggio 54 quesiti non trovato per Deltaplano');

    console.log('--- 4. Avvio Sessione Studio e Verifica Assenza Quesiti Parapendio in Deltaplano ---');
    // Avvia sessione materia 7 (Tecnica di pilotaggio)
    await evaluate(`document.getElementById('btn-topic-all-7')?.click()`);
    await sleep(1000);

    const sessionTotal = await evaluate(`
      (() => {
        const span = document.querySelector('.font-mono.text-amber-400');
        return span ? span.innerText : '';
      })()
    `);
    console.log('Contatore sessione pilotaggio deltaplano:', sessionTotal);

    // Cattura screenshot mobile
    const snapMobile = await send('Page.captureScreenshot', { format: 'png' });
    const rawMobile = snapMobile.result?.data || snapMobile.data;
    fs.writeFileSync('public/test_discipline_selector_mobile.png', Buffer.from(rawMobile, 'base64'));
    console.log('Salvato screenshot: public/test_discipline_selector_mobile.png');

    // Esci dalla sessione
    await evaluate(`
      const buttons = Array.from(document.querySelectorAll('button'));
      const esciBtn = buttons.find(b => b.innerText.includes('Esci'));
      if (esciBtn) esciBtn.click();
    `);
    await sleep(500);

    console.log('--- 5. Navigazione in Archivio & Test Filtro Disciplina ---');
    await evaluate(`document.getElementById('nav-archive')?.click()`);
    await sleep(1000);

    const archiveSelectorFound = await evaluate(`
      Boolean(document.getElementById('archive-discipline-all') &&
              document.getElementById('archive-discipline-paraglider') &&
              document.getElementById('archive-discipline-hang_glider'))
    `);
    console.log('Selettori disciplina presenti in Archivio:', archiveSelectorFound);

    // In archivio, filtra su Deltaplano e cerca #7062
    await evaluate(`document.getElementById('archive-discipline-hang_glider')?.click()`);
    await sleep(500);
    const has7062InHG = await evaluate(`document.getElementById('archive-item-7062') !== null`);
    console.log('Quesito #7062 (Deltaplano) presente in archivio Deltaplano:', has7062InHG);

    // Passa a Parapendio: #7062 deve sparire!
    await evaluate(`document.getElementById('archive-discipline-paraglider')?.click()`);
    await sleep(500);
    const has7062InPG = await evaluate(`document.getElementById('archive-item-7062') !== null`);
    console.log('Quesito #7062 (Deltaplano) escluso in archivio Parapendio:', !has7062InPG);
    if (has7062InPG) throw new Error('#7062 non doveva essere presente in archivio Parapendio');

    // In Parapendio, #7036 deve essere presente
    const has7036InPG = await evaluate(`document.getElementById('archive-item-7036') !== null`);
    console.log('Quesito #7036 (Parapendio) presente in archivio Parapendio:', has7036InPG);

    console.log('--- 6. Verifica Desktop (1440x900) & Screenshot ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(1000);

    const snapDesktop = await send('Page.captureScreenshot', { format: 'png' });
    const rawDesktop = snapDesktop.result?.data || snapDesktop.data;
    fs.writeFileSync('public/test_discipline_selector_desktop.png', Buffer.from(rawDesktop, 'base64'));
    console.log('Salvato screenshot: public/test_discipline_selector_desktop.png');

    console.log('\n--- 7. Verifica Errori Console Browser ---');
    console.log('Errori console riscontrati:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(e => console.error('  Console Error:', e));
      throw new Error('Rilevati errori in console JavaScript!');
    }

    console.log('\n>>> COLLAUDO FILTRO DISCIPLINA COMPLETATO CON SUCCESSO! <<<');
  } finally {
    try {
      chromeProc.kill();
    } catch {}
    if (previewProc) {
      try {
        previewProc.kill();
      } catch {}
    }
  }
}

main().catch(err => {
  console.error('\nTEST FALLITO:', err);
  process.exit(1);
});
