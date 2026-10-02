// scripts/test_drive_tutor.js
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
  console.log('--- Collaudo Visivo e Funzionale: Modalità Tutor Didattica Alla Guida ---');

  // Launch vite preview on port 4173
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    shell: true,
    stdio: 'pipe'
  });

  await sleep(1500);

  const port = 9335;
  const tempProfile = path.join(os.tmpdir(), `chrome_quiz_drive_tutor_${port}`);

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

    if (!wsUrl) {
      throw new Error('Impossibile agganciare Chrome CDP');
    }

    const ws = new globalThis.WebSocket(wsUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const callbacks = new Map();
    const consoleLogs = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        consoleLogs.push({ type: msg.params.type, text });
      }
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg.result || msg);
        callbacks.delete(msg.id);
      }
    };

    const sendCDP = (method, params = {}) => {
      return new Promise((resolve) => {
        const id = msgId++;
        callbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await sendCDP('Runtime.enable');
    await sendCDP('Page.enable');
    await sendCDP('DOM.enable');

    // Smartphone portrait viewport 390x844
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log('Navigazione verso http://localhost:4173...');
    await sendCDP('Page.navigate', { url: 'http://localhost:4173' });
    await sleep(2000);

    // Click on Alla Guida in navbar
    console.log('Click su #btn-drive-mode nella Navbar...');
    const clickRes = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('btn-drive-mode');
        if (!btn) return 'Pulsante non trovato';
        btn.click();
        return 'OK';
      })()`,
      returnByValue: true
    });
    console.log('Esito click navbar:', clickRes.result?.value);
    await sleep(1000);

    // Dismiss offline audio prompt if present immediately
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nonOra = buttons.find(b => b.innerText.includes('Non ora'));
        if (nonOra) nonOra.click();
      })()`
    });
    await sleep(400);

    // Verify Tutor toggle in Launcher
    const launcherCheck = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const tutorBtn = document.getElementById('btn-drive-toggle-tutor-launcher');
        return {
          hasTutorBtn: !!tutorBtn,
          text: tutorBtn?.innerText,
          className: tutorBtn?.className
        };
      })()`,
      returnByValue: true
    });
    console.log('Tutor toggle in Launcher:', launcherCheck.result?.value);

    // Capture launcher screenshot
    const shot1 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(process.cwd(), 'drive_tutor_launcher.png'), Buffer.from(shot1.data, 'base64'));

    // Ensure Tutor mode is ON in Launcher
    const isAlreadyOn = launcherCheck.result?.value?.text?.includes('TUTOR ON');
    if (!isAlreadyOn) {
      console.log('Attivazione Tutor nel Launcher...');
      await sendCDP('Runtime.evaluate', {
        expression: `(() => {
          const tutorBtn = document.getElementById('btn-drive-toggle-tutor-launcher');
          if (tutorBtn) tutorBtn.click();
        })()`
      });
      await sleep(500);
    } else {
      console.log('Tutor già ATTIVO nel Launcher.');
    }

    // Start exam
    console.log('Avvio esame in Modalità Guida...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const examBtn = document.getElementById('btn-drive-start-exam');
        if (examBtn) examBtn.click();
      })()`
    });
    await sleep(1500);

    // Dismiss offline audio prompt if present
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nonOra = buttons.find(b => b.innerText.includes('Non ora'));
        if (nonOra) nonOra.click();
      })()`
    });
    await sleep(500);

    // Verify HUD top bar Tutor button is removed
    const hudCheck = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const topBarTutor = document.getElementById('btn-drive-tutor-toggle');
        const scrollHeight = document.documentElement.scrollHeight;
        const innerHeight = window.innerHeight;
        return {
          hasTopBarTutor: !!topBarTutor,
          scrollHeight,
          innerHeight,
          isZeroScroll: scrollHeight <= innerHeight + 1
        };
      })()`,
      returnByValue: true
    });
    console.log('Stato HUD Esame:', hudCheck.result?.value);

    // Capture initial exam screen
    const shot2 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(process.cwd(), 'drive_tutor_question.png'), Buffer.from(shot2.data, 'base64'));

    // Select an option to reveal answer and didactic card
    console.log('Selezione Opzione per verificare Scheda Didattica (Regola e Tranello)...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        // Clicca l'opzione 1 o l'opzione corretta disponibile
        const opt = document.getElementById('btn-drive-opt-1') || document.getElementById('btn-drive-opt-2');
        if (opt) opt.click();
      })()`
    });
    await sleep(1200);

    // Verify Didactic Card
    const didacticCheck = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const card = document.getElementById('drive-didactic-card');
        const replayBtn = document.getElementById('btn-drive-replay-explanation');
        const scrollHeight = document.documentElement.scrollHeight;
        const innerHeight = window.innerHeight;
        const bodyScroll = document.body.scrollHeight;
        return {
          hasDidacticCard: !!card,
          cardText: card ? card.innerText.substring(0, 150) + '...' : null,
          hasReplayBtn: !!replayBtn,
          scrollHeight,
          innerHeight,
          bodyScroll,
          isZeroScroll: scrollHeight <= innerHeight + 1
        };
      })()`,
      returnByValue: true
    });
    console.log('Stato Scheda Didattica:', didacticCheck.result?.value);

    // Capture revealed screen with didactic card
    const shot3 = await sendCDP('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(process.cwd(), 'drive_tutor_didactic_card.png'), Buffer.from(shot3.data, 'base64'));

    ws.close();

    console.log('\n--- Verifica Errori Console JS ---');
    const errors = consoleLogs.filter(l => l.type === 'error');
    if (errors.length > 0) {
      console.warn('Avviso: Errori in console trovati:', errors);
      throw new Error(`Trovati ${errors.length} errori in console`);
    } else {
      console.log('✅ ZERO errori in console JavaScript!');
    }

    console.log('✅ Collaudo completato con successo!');
  } finally {
    browser.kill();
    preview.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch {}
  }
}

run().catch(err => {
  console.error('Errore durante il collaudo:', err);
  process.exit(1);
});
