const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

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
  console.log('--- Collaudo Visivo: Microfono Pulsante & Comandi Vocali ---');

  // Avvia vite preview sulla porta 5173
  const preview = spawn('npx', ['vite', 'preview', '--port', '5173'], {
    shell: true,
    stdio: 'pipe'
  });

  await sleep(1800);

  const port = 9335;
  const tempProfile = path.join(os.tmpdir(), `chrome_quiz_mic_${port}`);

  const browser = spawn(BROWSER_BIN, [
    '--headless=new',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
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

    // Imposta viewport mobile portrait (390x844) standard
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log('Navigazione verso http://localhost:5173...');
    await sendCDP('Page.navigate', { url: 'http://localhost:5173' });
    await sleep(2000);

    // Imposta audioOfflinePromptDismissed e driveModeVoiceCommands
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        try {
          localStorage.setItem('vds_voice_offline_prompt_dismissed', 'true');
        } catch {}
      })()`
    });

    // Clicca sul pulsante "Alla Guida" nella Navbar
    console.log('Apertura Modalità Alla Guida...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('btn-drive-mode');
        if (btn) btn.click();
      })()`
    });
    await sleep(800);

    // Se c'è il modale audio offline, clicca "Non ora"
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nonOra = buttons.find(b => b.innerText.includes('Non ora'));
        if (nonOra) nonOra.click();
      })()`
    });
    await sleep(400);

    // Clicca sul pulsante Comandi Vocali nel Launcher per attivarlo!
    console.log('Attivazione Comandi Vocali nel Launcher...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const voiceBtn = document.getElementById('btn-drive-toggle-voice-launcher');
        if (voiceBtn) voiceBtn.click();
      })()`
    });
    await sleep(600);

    // Verifica pulsante launcher aggiornato ad ATTIVO
    const launcherCheck = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const voiceBtn = document.getElementById('btn-drive-toggle-voice-launcher');
        return {
          found: Boolean(voiceBtn),
          text: voiceBtn?.innerText || ''
        };
      })()`,
      returnByValue: true
    });
    console.log('Stato pulsante launcher dopo click:', launcherCheck.result?.value);

    // Clicca su "Esame Ufficiale AeCI" dentro il Launcher per avviare il quiz
    console.log('Avvio esame in modalità guida...');
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const examBtn = document.getElementById('btn-drive-start-exam');
        if (examBtn) examBtn.click();
      })()`
    });
    await sleep(1500);

    // Se appare il banner o prompt, chiudilo
    await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nonOra = buttons.find(b => b.innerText.includes('Non ora') || b.innerText.includes('Salta'));
        if (nonOra) nonOra.click();
      })()`
    });
    await sleep(500);

    // Verifica header button e HUD
    const runningCheck = await sendCDP('Runtime.evaluate', {
      expression: `(() => {
        const micBtn = document.getElementById('btn-drive-toggle-voice');
        const hasMicIcon = Boolean(micBtn?.querySelector('svg'));
        const bodyText = document.body.innerText;
        const hasListeningText = bodyText.includes('In ascolto') || bodyText.includes('In ricezione') || bodyText.includes('In attesa');
        return {
          hasMicBtn: Boolean(micBtn),
          hasMicIcon,
          hasListeningText,
          micBtnTitle: micBtn?.getAttribute('title') || '',
          micBtnClasses: micBtn?.className || ''
        };
      })()`,
      returnByValue: true
    });
    console.log('Stato pulsante microfono running:', runningCheck.result?.value);

    // Scatta screenshot del running mode con HUD microfono attivo
    const screenshotRunning = await sendCDP('Page.captureScreenshot', { format: 'png' });
    const outRunning = path.join(process.cwd(), 'drive_mode_mic_active.png');
    fs.writeFileSync(outRunning, Buffer.from(screenshotRunning.data, 'base64'));
    console.log(`Screenshot salvato in: ${outRunning}`);

    ws.close();
    console.log('Verifica errori console...');
    const errors = consoleLogs.filter(l => l.type === 'error');
    if (errors.length > 0) {
      console.warn('Avviso: Trovati errori console:', errors);
    } else {
      console.log('✅ ZERO errori in console JavaScript!');
    }

    console.log('Collaudo completato con successo!');
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
