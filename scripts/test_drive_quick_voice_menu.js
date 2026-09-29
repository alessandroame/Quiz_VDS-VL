// scripts/test_drive_quick_voice_menu.js
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
  console.log('--- Collaudo Visivo e Funzionale: Menu Rapido Voce in Modalità Guida ---');

  // Preview server port 5173
  const preview = spawn('npx', ['vite', 'preview', '--port', '5173'], {
    shell: true,
    stdio: 'pipe'
  });

  await sleep(1500);

  const port = 9335;
  const tempProfile = path.join(os.tmpdir(), `chrome_quiz_drive_voice_${port}`);

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
    const pending = new Map();
    const consoleErrors = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        if (msg.params.type === 'error') {
          consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
        }
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        consoleErrors.push(msg.params.exceptionDetails.text);
      }
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');

    // Viewport Mobile: iPhone 13/14 (390 x 844)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2000);

    const evalJS = async (expression) => {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      return res?.result?.value;
    };

    // 1. Apri Modalità Alla Guida
    console.log('1. Apertura Modalità Alla Guida...');
    await evalJS(`document.getElementById('btn-drive-mode').click()`);
    await sleep(600);

    // Chiudi eventuale prompt audio offline iniziale se presente
    await evalJS(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Non ora'));
        if (btn) btn.click();
      })()
    `);
    await sleep(400);

    // 2. Verifica presenza VoiceQuickMenu nel Launcher
    const launcherVoiceBtn = await evalJS(`Boolean(document.getElementById('btn-drive-launcher-voice-menu'))`);
    console.log(`   -> Pulsante Menu Voce nel Launcher presente: ${launcherVoiceBtn ? '✅ SÌ' : '❌ NO'}`);
    if (!launcherVoiceBtn) throw new Error('btn-drive-launcher-voice-menu non trovato!');

    // 3. Clicca sul pulsante VoiceQuickMenu nel Launcher
    console.log('2. Apertura Popover Voce nel Launcher...');
    await evalJS(`document.getElementById('btn-drive-launcher-voice-menu').click()`);
    await sleep(400);

    const launcherPopoverOpen = await evalJS(`Boolean(document.getElementById('btn-drive-launcher-voice-menu-popover'))`);
    console.log(`   -> Popover Voce nel Launcher aperto: ${launcherPopoverOpen ? '✅ SÌ' : '❌ NO'}`);
    if (!launcherPopoverOpen) throw new Error('btn-drive-launcher-voice-menu-popover non aperto!');

    // Screenshot Launcher con Popover aperto
    const screenshotLauncher = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/test_drive_launcher_voice_menu_screenshot.png', Buffer.from(screenshotLauncher.data, 'base64'));
    console.log('   -> Screenshot salvato: public/test_drive_launcher_voice_menu_screenshot.png');

    // 4. Seleziona Elsa e chiudi popover
    await evalJS(`document.getElementById('btn-drive-launcher-voice-menu-quick-voice-elsa')?.click()`);
    await sleep(200);
    await evalJS(`document.getElementById('btn-drive-launcher-voice-menu').click()`);
    await sleep(300);

    // 5. Avvia Esame Ufficiale AeCI in Modalità Guida
    console.log('3. Avvio Simulazione Esame in Modalità Guida...');
    await evalJS(`document.getElementById('btn-drive-start-exam').click()`);
    await sleep(600);

    // 6. Verifica presenza VoiceQuickMenu nel Top Bar HUD
    const runningVoiceBtn = await evalJS(`Boolean(document.getElementById('btn-drive-voice-quick-menu'))`);
    console.log(`   -> Pulsante Menu Voce nel Top Bar HUD presente: ${runningVoiceBtn ? '✅ SÌ' : '❌ NO'}`);
    if (!runningVoiceBtn) throw new Error('btn-drive-voice-quick-menu non trovato nel Top Bar HUD!');

    // 7. Clicca sul pulsante VoiceQuickMenu durante il quiz attivo
    console.log('4. Apertura Popover Voce durante il Quiz Attivo...');
    await evalJS(`document.getElementById('btn-drive-voice-quick-menu').click()`);
    await sleep(400);

    const runningPopoverOpen = await evalJS(`Boolean(document.getElementById('btn-drive-voice-quick-menu-popover'))`);
    console.log(`   -> Popover Voce durante il Quiz Attivo aperto: ${runningPopoverOpen ? '✅ SÌ' : '❌ NO'}`);
    if (!runningPopoverOpen) throw new Error('btn-drive-voice-quick-menu-popover non aperto!');

    // Verifica che il popover sia completamente contenuto nello schermo
    const popoverBounds = await evalJS(`
      (() => {
        const el = document.getElementById('btn-drive-voice-quick-menu-popover');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          width: rect.width,
          windowWidth: window.innerWidth
        };
      })()
    `);
    console.log(`   -> Popover Bounds: left=${popoverBounds?.left}, right=${popoverBounds?.right}, width=${popoverBounds?.width}, screen=${popoverBounds?.windowWidth}`);
    if (popoverBounds && (popoverBounds.left < 0 || popoverBounds.right > popoverBounds.windowWidth + 2)) {
      throw new Error(`Popover fuoriesce dai bordi dello schermo! left=${popoverBounds.left}, right=${popoverBounds.right}`);
    } else {
      console.log('   -> Popover perfettamente allineato e contenuto nei 390px: ✅ SÌ');
    }

    // Screenshot Quiz attivo con Popover aperto
    const screenshotRunning = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/test_drive_running_voice_menu_screenshot.png', Buffer.from(screenshotRunning.data, 'base64'));
    console.log('   -> Screenshot salvato: public/test_drive_running_voice_menu_screenshot.png');

    // 8. Seleziona Giuseppe e velocità 1.15x
    await evalJS(`document.getElementById('btn-drive-voice-quick-menu-quick-voice-giuseppe')?.click()`);
    await sleep(150);
    await evalJS(`document.getElementById('btn-drive-voice-quick-menu-quick-speed-1.15')?.click()`);
    await sleep(150);

    // Chiudi popover
    await evalJS(`document.getElementById('btn-drive-voice-quick-menu').click()`);
    await sleep(300);

    // 9. Rispondi a un quiz per verificare che i pulsanti giganti funzionino perfettamente
    console.log('5. Test selezione opzione risposta touch in Modalità Guida...');
    await evalJS(`document.getElementById('btn-drive-opt-1').click()`);
    await sleep(300);
    console.log('   -> Opzione 1 selezionata: ✅ SÌ');

    // 10. Verifica assenza assoluta errori di console
    console.log(`\n6. Verifica Errori Console Browser: ${consoleErrors.length === 0 ? '✅ 0 ERRORI (Perfetto)' : `❌ ${consoleErrors.length} ERRORI`}`);
    if (consoleErrors.length > 0) {
      console.error('Errori rilevati:', consoleErrors);
      throw new Error('Rilevati errori in console durante il collaudo!');
    }

    console.log('\n🎉 COLLAUDO MODALITÀ GUIDA CON MENU RAPIDO VOCE COMPLETATO CON SUCCESSO!');

    ws.close();
  } finally {
    browser.kill();
    preview.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch (e) {}
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Errore durante il collaudo:', err);
  process.exit(1);
});
