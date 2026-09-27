// scripts/test_drive_mode.js
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
  console.log('--- Collaudo Visivo e Funzionale: Modalità Alla Guida ---');

  // Avvia vite preview sulla porta 4173
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    shell: true,
    stdio: 'pipe'
  });

  await sleep(1500);

  const port = 9333;
  const tempProfile = path.join(os.tmpdir(), `chrome_quiz_drive_${port}`);

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

    // Imposta viewport mobile portrait (390x844) per simulare smartphone su supporto auto
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log('Navigazione verso http://localhost:4173...');
    await sendCDP('Page.navigate', { url: 'http://localhost:4173' });
    await sleep(2000);

    // Clicca sul pulsante "Alla Guida" nella Navbar
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
    console.log('Esito click:', clickRes.result?.value);
    await sleep(800);

    // Cattura screenshot launcher guida
    const screenshotLauncher = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const outLauncher = path.join(process.cwd(), 'drive_mode_launcher.png');
    fs.writeFileSync(outLauncher, Buffer.from(screenshotLauncher.data, 'base64'));
    console.log(`Screenshot Launcher salvato in: ${outLauncher}`);

    // Clicca su "Esame Ufficiale AeCI" dentro il Launcher
    console.log('Avvio esame dentro la Modalità Guida...');
    const startRes = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const examBtn = document.getElementById('btn-drive-start-exam');
        if (examBtn) {
          examBtn.click();
          return 'CLICKED_EXAM_BTN';
        }
        return 'BTN_NOT_FOUND';
      })()`,
      returnByValue: true
    });
    console.log('Esito avvio esame:', startRes.result?.value);
    await sleep(1500);

    // Verifica stato interno
    const statusCheck = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const bodyText = document.body.innerText;
        const hasEsci = bodyText.includes('Esci');
        const hasSucc = bodyText.includes('Succ');
        const hasOptions = document.querySelectorAll('button[class*="rounded-2xl"]').length;
        const firstHeader = document.querySelector('h2')?.innerText;
        return { hasEsci, hasSucc, hasOptions, firstHeader };
      })()`,
      returnByValue: true
    });
    console.log('Diagnostica stato HUD:', statusCheck.result?.value);

    // Cattura screenshot dell'esame in Modalità Guida
    const screenshotExam = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const outExam = path.join(process.cwd(), 'drive_mode_active_exam.png');
    fs.writeFileSync(outExam, Buffer.from(screenshotExam.data, 'base64'));
    console.log(`Screenshot Quiz attivo salvato in: ${outExam}`);

    // Clicca sull'opzione 1 per testare la selezione tattile gigante
    console.log('Selezione Opzione 1...');
    const clickOptRes = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const opt1 = buttons.find(b => b.innerText.includes('1') && b.className.includes('rounded-2xl'));
        if (opt1) {
          opt1.click();
          return 'CLICKED_OPT1';
        }
        return 'OPT1_NOT_FOUND';
      })()`,
      returnByValue: true
    });
    console.log('Esito click opzione:', clickOptRes.result?.value);
    await sleep(800);

    const screenshotAnswered = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const outAnswered = path.join(process.cwd(), 'drive_mode_selected_option.png');
    fs.writeFileSync(outAnswered, Buffer.from(screenshotAnswered.data, 'base64'));
    console.log(`Screenshot Opzione selezionata salvato in: ${outAnswered}`);

    // Clicca su Successiva
    console.log('Click su Domanda Successiva...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(b => b.innerText.includes('Succ'));
        if (nextBtn) nextBtn.click();
      })()`
    });
    await sleep(800);

    const screenshotNext = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const outNext = path.join(process.cwd(), 'drive_mode_next_question.png');
    fs.writeFileSync(outNext, Buffer.from(screenshotNext.data, 'base64'));
    console.log(`Screenshot Domanda Successiva salvato in: ${outNext}`);

    ws.close();
    console.log('Verifica console errori JS...');
    const errors = consoleLogs.filter(l => l.type === 'error');
    if (errors.length > 0) {
      console.warn('Avviso: Trovati errori in console:', errors);
    } else {
      console.log('✅ ZERO errori in console JavaScript!');
    }

    console.log('Collaudo visivo completato con successo!');
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
