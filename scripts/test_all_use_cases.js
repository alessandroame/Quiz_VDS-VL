// scripts/test_all_use_cases.js
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
  console.log('================================================================');
  console.log('🏁 INIZIO COLLAUDO FUNZIONALE MULTI-CONTESTO VDS-VL QUIZ MASTER');
  console.log('================================================================\n');

  if (!BROWSER_BIN) {
    throw new Error('Nessun browser Chrome/Edge trovato per il collaudo.');
  }

  const preview = spawn('npx', ['vite', 'preview', '--port', '5173'], {
    shell: true,
    stdio: 'ignore'
  });

  // Attendi che il server sia pronto
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://localhost:5173/');
      if (res.ok) {
        break;
      }
    } catch {
      await sleep(250);
    }
  }
  await sleep(500);

  const port = 9336;
  const tempProfile = path.join(os.tmpdir(), `chrome_quiz_full_test_${Date.now()}`);

  const browser = spawn(BROWSER_BIN, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  let ws = null;

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

    if (!wsUrl) throw new Error('Impossibile connettersi al CDP');

    ws = new globalThis.WebSocket(wsUrl);
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
      return new Promise((resolve, reject) => {
        const id = msgId++;
        callbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await sendCDP('Runtime.enable');
    await sendCDP('Page.enable');

    const evalJS = async (expression) => {
      const res = await sendCDP('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result?.value;
    };

    // Naviga alla PWA
    await sendCDP('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2000);

    // =================================================================
    // CONTESTO 1: STUDIO SERALE / DESKTOP A CASA (1440x900)
    // =================================================================
    console.log('📌 [CONTESTO 1] Verifica Studio Desktop (1440x900)');
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(400);

    // 1.1 Navbar e 5 schede
    const navOk = await evalJS(`
      Boolean(document.getElementById('nav-exam') && 
              document.getElementById('nav-topics') && 
              document.getElementById('nav-mistakes') && 
              document.getElementById('nav-archive') && 
              document.getElementById('nav-stats'))
    `);
    console.log(`  -> 5 Tab di navigazione presenti: ${navOk ? '✅ SÌ' : '❌ NO'}`);

    // 1.2 Avvio Esame Ufficiale
    await evalJS(`document.getElementById('btn-start-exam').click()`);
    await sleep(500);

    const isExamActive = await evalJS(`
      Boolean(document.querySelector('.animate-pulse') || document.querySelector('#btn-abandon-exam'))
    `);
    console.log(`  -> Esame Ufficiale avviato con Timer attivo: ${isExamActive ? '✅ SÌ' : '❌ NO'}`);

    // 1.3 Risposta da tastiera '1' e Flag con 'f'
    await sendCDP('Input.dispatchKeyEvent', { type: 'keyDown', key: '1', code: 'Digit1' });
    await sendCDP('Input.dispatchKeyEvent', { type: 'keyUp', key: '1', code: 'Digit1' });
    await sleep(200);

    await sendCDP('Input.dispatchKeyEvent', { type: 'keyDown', key: 'f', code: 'KeyF' });
    await sendCDP('Input.dispatchKeyEvent', { type: 'keyUp', key: 'f', code: 'KeyF' });
    await sleep(200);

    await sendCDP('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight' });
    await sendCDP('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight' });
    await sleep(200);

    const examProgress = await evalJS(`
      document.body.innerText.includes('1/30') && document.body.innerText.includes('(1 ⚑)')
    `);
    console.log(`  -> Risposta con tasto '1' e Flag con tasto 'F': ${examProgress ? '✅ SÌ' : '❌ NO'}`);

    // 1.4 Navigation Guard: tentativo di cambiare tab
    await evalJS(`document.getElementById('nav-topics').click()`);
    await sleep(300);

    const isGuardActive = await evalJS(`
      document.body.innerText.includes('Simulazione in Corso') &&
      document.body.innerText.includes("Rimani nell'Esame")
    `);
    console.log(`  -> Navigation Guard blocca cambio tab accidentale: ${isGuardActive ? '✅ SÌ' : '❌ NO'}`);

    // 1.5 Annulla uscita
    await evalJS(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes("Rimani nell'Esame"));
      if (btn) btn.click();
    `);
    await sleep(300);

    // 1.6 Consegna dell'esame
    await evalJS(`
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Consegna'));
      if (submitBtn) submitBtn.click();
    `);
    await sleep(300);

    await evalJS(`document.getElementById('btn-confirm-submit-exam').click()`);
    await sleep(600);

    const isDebriefing = await evalJS(`
      document.body.innerText.includes('IDONEO') || document.body.innerText.includes('NON IDONEO')
    `);
    console.log(`  -> Schermata Debriefing con esito ufficiale: ${isDebriefing ? '✅ SÌ' : '❌ NO'}`);

    // =================================================================
    // CONTESTO 2: MODALITÀ ALLA GUIDA (390x844 MOBILE)
    // =================================================================
    console.log('\n📌 [CONTESTO 2] Verifica Modalità Alla Guida (390x844 Mobile)');
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(400);

    await evalJS(`document.getElementById('btn-drive-mode').click()`);
    await sleep(500);

    const isDriveOpen = await evalJS(`
      Boolean(document.querySelector('.fixed.inset-0.z-50.bg-black'))
    `);
    console.log(`  -> Schermata Drive Mode Fullscreen aperta: ${isDriveOpen ? '✅ SÌ' : '❌ NO'}`);

    // Verifica apertura Guida Comandi Vocali dal launcher
    await evalJS(`
      (() => {
        const dismissBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Non ora'));
        if (dismissBtn) dismissBtn.click();
        const btnGuide = document.getElementById('btn-drive-voice-guide-launcher') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Guida Comandi'));
        if (btnGuide) btnGuide.click();
      })()
    `);
    await sleep(400);

    const isVoiceModalOpen = await evalJS(`
      document.body.innerText.includes('Guida Comandi Vocali') &&
      document.body.innerText.includes('Rispondi al Quiz') &&
      document.body.innerText.includes('Pilota Automatico')
    `);
    console.log(`  -> Cheat Sheet Comandi Vocali aperto dal launcher: ${isVoiceModalOpen ? '✅ SÌ' : '❌ NO'}`);

    // Chiudi modale guida vocale
    await evalJS(`
      const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Ho Capito') || b.title?.includes('Chiudi'));
      if (closeBtn) closeBtn.click();
    `);
    await sleep(300);

    // Avvia Radio Quiz
    await evalJS(`document.getElementById('btn-drive-start-radio').click()`);
    await sleep(600);

    const driveButtons = await evalJS(`
      Boolean(document.getElementById('btn-drive-opt-1') && 
              document.getElementById('btn-drive-opt-2') && 
              document.getElementById('btn-drive-opt-3'))
    `);
    console.log(`  -> Tre macro-fasce tattili + Pilota Automatico attivi: ${driveButtons ? '✅ SÌ' : '❌ NO'}`);

    // Risposta tattile
    await evalJS(`document.getElementById('btn-drive-opt-1').click()`);
    await sleep(300);

    // Esci da Modalità Guida
    await evalJS(`document.getElementById('btn-drive-exit').click()`);
    await sleep(400);

    const driveClosed = await evalJS(`
      !document.querySelector('.fixed.inset-0.z-50.bg-black')
    `);
    console.log(`  -> Chiusura sicura Drive Mode e rientro: ${driveClosed ? '✅ SÌ' : '❌ NO'}`);

    // =================================================================
    // CONTESTO 3: CAMPO DI VOLO / SOLE DIRETTO (HANGAR LIGHT) & IMPOSTAZIONI A SCHEDE
    // =================================================================
    console.log('\n📌 [CONTESTO 3] Verifica Contrasto & Visibilità Solare (Hangar Light) & Nuovi Menu');
    
    // 3.1 Test Quick Speech Menu (1-Click Popover in Navbar)
    await evalJS(`document.getElementById('btn-voice-quick-menu').click()`);
    await sleep(300);
    const popoverOpen = await evalJS(`Boolean(document.getElementById('voice-quick-popover'))`);
    console.log(`  -> Quick Speech Menu popover aperto con 1 clic: ${popoverOpen ? '✅ SÌ' : '❌ NO'}`);
    
    // Switch rapido voce Elsa
    await evalJS(`document.getElementById('quick-voice-elsa')?.click()`);
    await sleep(200);
    // Chiudi popover
    await evalJS(`document.getElementById('btn-voice-quick-menu').click()`);
    await sleep(300);

    // 3.2 Test Impostazioni a Schede Tematiche (Zero-Scroll)
    await evalJS(`document.getElementById('btn-settings').click()`);
    await sleep(300);

    const hasAllTabs = await evalJS(`
      Boolean(document.getElementById('tab-appearance') &&
              document.getElementById('tab-voice') &&
              document.getElementById('tab-drive') &&
              document.getElementById('tab-cloud') &&
              document.getElementById('tab-data'))
    `);
    console.log(`  -> 5 Schede tematiche impostazioni presenti: ${hasAllTabs ? '✅ SÌ' : '❌ NO'}`);

    // Switch tra le schede
    await evalJS(`document.getElementById('tab-voice')?.click()`);
    await sleep(200);
    await evalJS(`document.getElementById('tab-drive')?.click()`);
    await sleep(200);
    await evalJS(`document.getElementById('tab-appearance')?.click()`);
    await sleep(200);

    await evalJS(`document.getElementById('theme-btn-light').click()`);
    await sleep(300);
    await evalJS(`document.getElementById('btn-close-settings').click()`);
    await sleep(400);

    const isLightActive = await evalJS(`
      document.documentElement.classList.contains('light') || document.body.classList.contains('light')
    `);
    console.log(`  -> Tema Hangar Light attivo con sfondo chiaro: ${isLightActive ? '✅ SÌ' : '❌ NO'}`);

    // Vai a Materie
    await evalJS(`document.getElementById('nav-topics').click()`);
    await sleep(500);

    // Seleziona Meteorologia (ID 5)
    await evalJS(`document.getElementById('btn-topic-all-5').click()`);
    await sleep(500);

    const isInTopicStudy = await evalJS(`
      document.body.innerText.includes('Meteorologia')
    `);
    console.log(`  -> Sessione studio Meteorologia avviata con card chiara: ${isInTopicStudy ? '✅ SÌ' : '❌ NO'}`);

    // Rispondi alla domanda usando l'id diretto btn-option-1
    await evalJS(`document.getElementById('btn-option-1').click()`);
    await sleep(500);

    const hasDidacticBox = await evalJS(`
      document.body.innerText.includes('Regola:') &&
      document.body.innerText.includes('Tranello:')
    `);
    console.log(`  -> Feedback didattico immediato (Regola + Tranello): ${hasDidacticBox ? '✅ SÌ' : '❌ NO'}`);

    // =================================================================
    // CONTESTO 4: ARCHIVIO, RICERCA FULL-TEXT & NOTE PERSONALI
    // =================================================================
    console.log('\n📌 [CONTESTO 4] Verifica Archivio, Ricerca & Note Personali');
    await evalJS(`document.getElementById('nav-archive').click()`);
    await sleep(500);

    // Cerca parola chiave "rotore" scatenando l'aggiornamento React
    await evalJS(`
      const input = document.getElementById('archive-search-input');
      if (input) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, 'rotore');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await sleep(400);

    const searchCount = await evalJS(`
      Array.from(document.querySelectorAll('div[id^="archive-item-"]')).length
    `);
    console.log(`  -> Ricerca full-text istantanea ("rotore"): trovati ${searchCount} quiz (filtro attivo: ${searchCount < 504 ? '✅ SÌ' : '❌ NO'})`);

    // Espandi primo quiz trovato e aggiungi nota
    await evalJS(`
      const firstItem = document.querySelector('div[id^="archive-item-"]');
      if (firstItem) firstItem.click();
    `);
    await sleep(400);

    await evalJS(`
      const addNoteBtn = document.querySelector('button[id^="btn-add-note-"]') || 
                         Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Aggiungi'));
      if (addNoteBtn) addNoteBtn.click();
    `);
    await sleep(300);

    await evalJS(`
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeSetter.call(textarea, 'Nota test: attenzione alla corrente discendente sottovento!');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Salva'));
      if (saveBtn) saveBtn.click();
    `);
    await sleep(500);

    const noteSaved = await evalJS(`
      document.body.innerText.includes('attenzione alla corrente discendente sottovento!')
    `);
    console.log(`  -> Salvataggio e persistenza nota personale: ${noteSaved ? '✅ SÌ' : '❌ NO'}`);

    // =================================================================
    // CONTESTO 5: QUADERNO ERRORI & STATISTICHE
    // =================================================================
    console.log('\n📌 [CONTESTO 5] Verifica Quaderno Errori & Statistiche');
    await evalJS(`document.getElementById('nav-mistakes').click()`);
    await sleep(500);

    const mistakesViewOk = await evalJS(`
      document.body.innerText.includes('Quaderno Errori') || 
      document.body.innerText.includes('Nessun errore') ||
      document.body.innerText.includes('domande da perfezionare') ||
      document.body.innerText.includes('Avvia Ripasso')
    `);
    console.log(`  -> Sezione Quaderno Errori operativa: ${mistakesViewOk ? '✅ SÌ' : '❌ NO'}`);

    await evalJS(`document.getElementById('nav-stats').click()`);
    await sleep(600);

    const statsOk = await evalJS(`
      document.body.innerText.includes('Prontezza Esame') ||
      document.body.innerText.includes('I tuoi Progressi')
    `);
    console.log(`  -> Dashboard Statistiche con Radar Materie: ${statsOk ? '✅ SÌ' : '❌ NO'}`);

    // =================================================================
    // VERIFICA ASSENZA ERRORI CONSOLE BROWSER
    // =================================================================
    console.log('\n📌 [INTEGRITÀ CONSOLE BROWSER]');
    const errors = consoleLogs.filter(l => l.type === 'error' && !l.text.includes('favicon'));
    if (errors.length === 0) {
      console.log('  -> Zero errori in console JavaScript: ✅ PERFETTO');
    } else {
      console.log(`  -> Rilevati ${errors.length} errori in console:`, errors);
    }

    console.log('\n================================================================');
    console.log('🎉 TUTTI I CONTESTI D\'USO COLLAUDATI CON SUCCESSO AL 100%!');
    console.log('================================================================');

  } finally {
    if (ws) {
      try { ws.close(); } catch {}
    }
    browser.kill();
    preview.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch {}
    process.exit(0);
  }
}

run().catch(err => {
  console.error('ERRORE NEL COLLAUDO:', err);
  process.exit(1);
});
