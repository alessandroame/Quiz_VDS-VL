// scripts/test_navigator_visual.cjs - Test visuale CDP per il navigatore quiz comprimibile
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

async function run() {
  console.log('--- Collaudo Visivo Headless: Navigatore Quiz Comprimibile ---');

  // Avvia vite preview su porta 5173
  const preview = spawn('npx', ['vite', 'preview', '--port', '5173'], {
    shell: true,
    stdio: 'pipe'
  });

  await sleep(2000);

  const port = 9335;
  const tempProfile = path.join(os.tmpdir(), `chrome_quiz_nav_${port}`);

  const browser = spawn(BROWSER_BIN, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

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

    if (!wsUrl) throw new Error('Impossibile agganciare target CDP');

    // Usa WebSocket nativo di Node 22 o modulo
    const ws = new (globalThis.WebSocket || WebSocket)(wsUrl);
    await new Promise(res => ws.onopen = res);

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const reqId = id++;
        const handler = (evt) => {
          const msg = JSON.parse(typeof evt.data === 'string' ? evt.data : evt);
          if (msg.id === reqId) {
            ws.removeEventListener('message', handler);
            resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    // Console logs listener
    const consoleErrors = [];
    ws.addEventListener('message', (evt) => {
      const msg = JSON.parse(typeof evt.data === 'string' ? evt.data : evt);
      if (msg.method === 'Runtime.consoleAPICalled' && (msg.params.type === 'error' || msg.params.type === 'warning')) {
        consoleErrors.push(msg.params);
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');

    // Emula viewport mobile (390 x 844, 2x)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      screenOrientation: { angle: 0, type: 'portraitPrimary' }
    });

    console.log('Navigazione a http://localhost:5173...');
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await sleep(2500);

    // Assicura stato espanso iniziale per il collaudo
    await send('Runtime.evaluate', {
      expression: `localStorage.removeItem('vds_exam_nav_compressed');`
    });

    // Clicca su TUTOR o ESAME nella Home per avviare
    const clickExam = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const tutorBtn = document.getElementById('hub-card-tutor') || document.querySelector('button[id*="tutor"]');
          if (tutorBtn) { tutorBtn.click(); return 'tutor_clicked'; }
          const examBtn = document.getElementById('hub-card-exam') || document.querySelector('button[id*="exam"]');
          if (examBtn) { examBtn.click(); return 'exam_clicked'; }
          return 'none';
        })()
      `,
      returnByValue: true
    });
    console.log('Azione click Home:', clickExam?.result?.value);
    await sleep(1500);

    // Se siamo nella schermata iniziale Esame, avviamo il tutor
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const startTutor = document.getElementById('btn-start-tutor-exam') || document.getElementById('btn-start-exam');
          if (startTutor) startTutor.click();
        })()
      `
    });
    await sleep(1500);

    // Rispondi alla prima domanda per avere un riscontro cromatico
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const opt1 = document.querySelector('button[id^="btn-option-1"]');
          if (opt1) opt1.click();
        })()
      `
    });
    await sleep(800);

    // 1. Screenshot in modalità ESPANSA
    console.log('Cattura screenshot modalità Espansa...');
    const shotExpanded = await send('Page.captureScreenshot', { format: 'png' });
    const pathExpanded = path.join(os.tmpdir(), 'quiz_vds_nav_expanded.png');
    fs.writeFileSync(pathExpanded, Buffer.from(shotExpanded.data, 'base64'));
    console.log(`Screenshot salvato: ${pathExpanded}`);

    // Verifica presenza grid espansa
    const checkExpanded = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const grid = document.querySelector('[data-testid="navigator-expanded-grid"]');
          const toggleBtn = document.getElementById('btn-toggle-navigator');
          return {
            hasExpandedGrid: Boolean(grid),
            toggleText: toggleBtn ? toggleBtn.textContent.trim() : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Stato navigatore espanso:', checkExpanded?.result?.value);

    // 2. Clicca sul toggle per comprimere
    console.log('Click su toggle per comprimere il navigatore...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const toggleBtn = document.getElementById('btn-toggle-navigator');
          if (toggleBtn) toggleBtn.click();
        })()
      `
    });
    await sleep(600);

    // 3. Screenshot in modalità COMPRESSA
    console.log('Cattura screenshot modalità Compressa...');
    const shotCompressed = await send('Page.captureScreenshot', { format: 'png' });
    const pathCompressed = path.join(os.tmpdir(), 'quiz_vds_nav_compressed.png');
    fs.writeFileSync(pathCompressed, Buffer.from(shotCompressed.data, 'base64'));
    console.log(`Screenshot salvato: ${pathCompressed}`);

    // Verifica presenza riga singola compressa e altezza
    const checkCompressed = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const row = document.querySelector('[data-testid="navigator-compressed-row"]');
          const toggleBtn = document.getElementById('btn-toggle-navigator');
          const buttons = row ? row.querySelectorAll('button') : [];
          // Verifica se tutti i pulsanti sono sulla stessa riga (stesso boundingClientRect.top approssimativo)
          const tops = Array.from(buttons).map(b => Math.round(b.getBoundingClientRect().top));
          const allOnOneRow = tops.length > 0 && Math.max(...tops) - Math.min(...tops) <= 4;
          return {
            hasCompressedRow: Boolean(row),
            buttonCount: buttons.length,
            allOnOneRow,
            toggleText: toggleBtn ? toggleBtn.textContent.trim() : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Stato navigatore compresso:', checkCompressed?.result?.value);

    // 4. Clicca sul quesito 15 per verificare la navigazione diretta dal navigatore compresso
    console.log('Click sul quesito #15 nella riga compressa...');
    const clickQ15 = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn15 = document.getElementById('bubble-q-15');
          if (btn15) { btn15.click(); return true; }
          return false;
        })()
      `,
      returnByValue: true
    });
    await sleep(600);

    const checkQ15 = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const headerBadge = document.querySelector('.font-mono.text-\\[11px\\]');
          return headerBadge ? headerBadge.textContent.trim() : null;
        })()
      `,
      returnByValue: true
    });
    console.log('Navigazione a Q15 riuscita:', checkQ15?.result?.value);

    // Screenshot dopo navigazione a Q15
    const shotQ15 = await send('Page.captureScreenshot', { format: 'png' });
    const pathQ15 = path.join(os.tmpdir(), 'quiz_vds_nav_q15.png');
    fs.writeFileSync(pathQ15, Buffer.from(shotQ15.data, 'base64'));
    console.log(`Screenshot salvato: ${pathQ15}`);

    // 5. Test viewport Desktop (1440x900) per verificare i numeri visibili sulla singola riga
    console.log('Test viewport Desktop (1440x900)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(600);

    const shotDesktop = await send('Page.captureScreenshot', { format: 'png' });
    const pathDesktop = path.join(os.tmpdir(), 'quiz_vds_nav_desktop.png');
    fs.writeFileSync(pathDesktop, Buffer.from(shotDesktop.data, 'base64'));
    console.log(`Screenshot desktop salvato: ${pathDesktop}`);

    if (consoleErrors.length > 0) {
      console.warn('Avvisi o errori console:', consoleErrors);
    } else {
      console.log('✓ Nessun errore console rilevato.');
    }

    console.log('--- Collaudo completato con successo ---');
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
  console.error('ERRORE collaudo:', err);
  process.exit(1);
});
