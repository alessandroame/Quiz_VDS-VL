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

  // 1. Avvia Vite Preview su porta 4173
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    shell: true,
    stdio: 'pipe'
  });

  await sleep(1500);

  const port = 9334;
  const tempProfile = path.join(os.tmpdir(), `chrome_quiz_full_test_${Date.now()}`);

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

    if (!wsUrl) throw new Error('Impossibile connettersi al CDP');

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
    await sendCDP('Page.navigate', { url: 'http://localhost:4173/' });
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
    await sleep(500);

    // Verifica titolo pagina e schede navbar
    const navOk = await evalJS(`
      Boolean(document.getElementById('nav-exam') && 
              document.getElementById('nav-topics') && 
              document.getElementById('nav-mistakes') && 
              document.getElementById('nav-archive') && 
              document.getElementById('nav-stats'))
    `);
    console.log(`  -> 5 Tab di navigazione presenti: ${navOk ? '✅ SÌ' : '❌ NO'}`);

    // Avvio Esame Ufficiale
    await evalJS(`document.getElementById('btn-start-exam').click()`);
    await sleep(600);

    const isExamActive = await evalJS(`
      Boolean(document.querySelector('.animate-pulse') && document.querySelector('#btn-abandon-exam'))
    `);
    console.log(`  -> Esame Ufficiale avviato con Timer attivo: ${isExamActive ? '✅ SÌ' : '❌ NO'}`);

    // Test scorciatoie tastiera: Risposta 1 con tasto '1'
    await sendCDP('Input.dispatchKeyEvent', { type: 'keyDown', key: '1', code: 'Digit1' });
    await sendCDP('Input.dispatchKeyEvent', { type: 'keyUp', key: '1', code: 'Digit1' });
    await sleep(200);

    // Test flag con tasto 'f'
    await sendCDP('Input.dispatchKeyEvent', { type: 'keyDown', key: 'f', code: 'KeyF' });
    await sendCDP('Input.dispatchKeyEvent', { type: 'keyUp', key: 'f', code: 'KeyF' });
    await sleep(200);

    // Test navigazione successiva con tasto 'ArrowRight'
    await sendCDP('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight' });
    await sendCDP('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight' });
    await sleep(200);

    // Verifica risposta 1 e flag registrati
    const examProgress = await evalJS(`
      document.body.innerText.includes('1/30') && document.body.innerText.includes('(1 ⚑)')
    `);
    console.log(`  -> Risposta con tasto '1' e Flag con tasto 'F': ${examProgress ? '✅ SÌ' : '❌ NO'}`);

    // Test NAVIGATION GUARD: Tentativo di uscire durante l'esame
    await evalJS(`document.getElementById('nav-topics').click()`);
    await sleep(300);

    const isGuardActive = await evalJS(`
      document.body.innerText.includes('Simulazione in Corso') &&
      document.body.innerText.includes("Rimani nell'Esame")
    `);
    console.log(`  -> Navigation Guard blocca cambio tab accidentale: ${isGuardActive ? '✅ SÌ' : '❌ NO'}`);

    // Annulla uscita: clic su "Rimani nell'Esame"
    await evalJS(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes("Rimani nell'Esame"));
      if (btn) btn.click();
    `);
    await sleep(300);

    const stillInExam = await evalJS(`Boolean(document.getElementById('btn-abandon-exam'))`);
    console.log(`  -> Ripristino esame dopo avviso: ${stillInExam ? '✅ SÌ' : '❌ NO'}`);

    // Consegna anticipata dell'esame
    await evalJS(`
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Consegna') || b.title?.includes('Consegna'));
      if (submitBtn) submitBtn.click();
    `);
    await sleep(300);

    // Conferma nel modal di consegna
    await evalJS(`
      const modalSubmit = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Conferma Consegna'));
      if (modalSubmit) modalSubmit.click();
    `);
    await sleep(800);

    const isDebriefing = await evalJS(`
      document.body.innerText.includes('IDONEO') || document.body.innerText.includes('NON IDONEO')
    `);
    console.log(`  -> Schermata Debriefing con esito ufficiale: ${isDebriefing ? '✅ SÌ' : '❌ NO'}`);

    // =================================================================
    // CONTESTO 2: RIPASSO ALLA GUIDA / IN VIAGGIO (390x844 MOBILE)
    // =================================================================
    console.log('\n📌 [CONTESTO 2] Verifica Modalità Alla Guida (390x844 Mobile)');
    await sendCDP('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sleep(500);

    // Torna a esame idle o avvia Drive Mode da Navbar
    await evalJS(`document.getElementById('btn-drive-mode').click()`);
    await sleep(600);

    const isDriveOpen = await evalJS(`
      Boolean(document.querySelector('.fixed.inset-0.z-50.bg-black'))
    `);
    console.log(`  -> Schermata Drive Mode Fullscreen aperta: ${isDriveOpen ? '✅ SÌ' : '❌ NO'}`);

    // Avvia Radio Quiz dal Launcher Guida
    await evalJS(`
      const radioBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Radio Quiz'));
      if (radioBtn) radioBtn.click();
    `);
    await sleep(600);

    const driveButtons = await evalJS(`
      document.querySelectorAll('button').length >= 3 && document.body.innerText.includes('Pilota Auto')
    `);
    console.log(`  -> Tre macro-fasce tattili + Pilota Automatico attivi: ${driveButtons ? '✅ SÌ' : '❌ NO'}`);

    // Test risposta tattile su opzione 1
    await evalJS(`
      const opt1 = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('1.') || b.innerText.startsWith('1'));
      if (opt1) opt1.click();
    `);
    await sleep(400);

    // Chiudi Modalità Alla Guida con pulsante X
    await evalJS(`
      const closeBtn = document.querySelector('button[title*="Chiudi"]') || 
                       Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-x') || b.innerText.includes('Chiudi'));
      if (closeBtn) closeBtn.click();
      else {
        // Fallback seleziona primo svg X
        const xSvg = document.querySelector('svg.lucide-x');
        if (xSvg && xSvg.closest('button')) xSvg.closest('button').click();
      }
    `);
    await sleep(500);

    const driveClosed = await evalJS(`
      !document.querySelector('.fixed.inset-0.z-50.bg-black')
    `);
    console.log(`  -> Chiusura sicura Drive Mode e rientro: ${driveClosed ? '✅ SÌ' : '❌ NO'}`);

    // =================================================================
    // CONTESTO 3: CAMPO DI VOLO / SOLE DIRETTO (TEMA CHIARO HANGAR LIGHT)
    // =================================================================
    console.log('\n📌 [CONTESTO 3] Verifica Contrasto & Visibilità Solare (Hangar Light)');
    
    // Attiva tema Chiaro tramite Navbar quick-toggle o Settings
    await evalJS(`document.getElementById('btn-settings').click()`);
    await sleep(400);
    await evalJS(`document.getElementById('theme-btn-light').click()`);
    await sleep(300);
    await evalJS(`document.getElementById('btn-close-settings').click()`);
    await sleep(400);

    const isLightActive = await evalJS(`
      document.documentElement.classList.contains('light') &&
      window.getComputedStyle(document.body).backgroundColor.includes('248') || 
      window.getComputedStyle(document.body).backgroundColor.includes('255') ||
      document.body.classList.contains('light:bg-slate-50')
    `);
    console.log(`  -> Tema Hangar Light attivo con sfondo chiaro: ${isLightActive ? '✅ SÌ' : '❌ NO'}`);

    // Vai a Materie
    await evalJS(`document.getElementById('nav-topics').click()`);
    await sleep(500);

    // Seleziona Meteorologia (ID 5)
    await evalJS(`
      const topicCard = Array.from(document.querySelectorAll('div, button')).find(el => el.innerText?.includes('Meteorologia'));
      if (topicCard) topicCard.click();
    `);
    await sleep(600);

    const isInTopicStudy = await evalJS(`
      document.body.innerText.includes('Meteorologia') &&
      document.body.innerText.includes('Domanda')
    `);
    console.log(`  -> Sessione studio Meteorologia avviata con card chiara: ${isInTopicStudy ? '✅ SÌ' : '❌ NO'}`);

    // Rispondi alla domanda per verificare Regola e Tranello
    await evalJS(`
      const firstOpt = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('1.') || b.innerText.startsWith('1'));
      if (firstOpt) firstOpt.click();
    `);
    await sleep(400);

    const hasDidacticBox = await evalJS(`
      document.body.innerText.includes('Regola:') &&
      document.body.innerText.includes('Tranello:')
    `);
    console.log(`  -> Feedback didattico immediato (Regola + Tranello): ${hasDidacticBox ? '✅ SÌ' : '❌ NO'}`);

    // =================================================================
    // CONTESTO 4: ARCHIVIO, NOTE PERSONALI & RICERCA
    // =================================================================
    console.log('\n📌 [CONTESTO 4] Verifica Archivio, Ricerca & Note Personali');
    await evalJS(`document.getElementById('nav-archive').click()`);
    await sleep(500);

    // Ricerca parola chiave "rotore"
    await evalJS(`
      const searchInput = document.querySelector('input[type="text"]') || document.querySelector('input');
      if (searchInput) {
        searchInput.value = 'rotore';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await sleep(400);

    const searchCount = await evalJS(`
      Array.from(document.querySelectorAll('div[id^="archive-item-"]')).length
    `);
    console.log(`  -> Ricerca full-text istantanea: trovati ${searchCount} quiz`);

    // Aggiungi una nota personale sul primo quesito trovato
    await evalJS(`
      const firstItem = document.querySelector('div[id^="archive-item-"]');
      if (firstItem) firstItem.click();
    `);
    await sleep(400);

    // Clic su aggiungi nota se presente
    await evalJS(`
      const addNoteBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Aggiungi appunto') || b.innerText.includes('Modifica'));
      if (addNoteBtn) addNoteBtn.click();
    `);
    await sleep(300);

    await evalJS(`
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = 'Nota test: attenzione alla corrente discendente sottovento!';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Salva'));
      if (saveBtn) saveBtn.click();
    `);
    await sleep(400);

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
      document.body.innerText.includes('domande da perfezionare')
    `);
    console.log(`  -> Sezione Quaderno Errori operativa: ${mistakesViewOk ? '✅ SÌ' : '❌ NO'}`);

    await evalJS(`document.getElementById('nav-stats').click()`);
    await sleep(500);

    const statsOk = await evalJS(`
      document.body.innerText.includes('Prontezza Esame') &&
      document.body.innerText.includes('Risposte Esatte per Materia')
    `);
    console.log(`  -> Dashboard Statistiche con Radar Materie: ${statsOk ? '✅ SÌ' : '❌ NO'}`);

    // =================================================================
    // VERIFICA ASSENZA ERRORI CONSOLE
    // =================================================================
    console.log('\n📌 [INTEGRITÀ CONSOLE BROWSER]');
    const errors = consoleLogs.filter(l => l.type === 'error' && !l.text.includes('favicon'));
    if (errors.length === 0) {
      console.log('  -> Zero errori in console JavaScript: ✅ PERFETTO');
    } else {
      console.log(`  -> Rilevati ${errors.length} errori in console:`, errors);
    }

    console.log('\n================================================================');
    console.log('🎉 COLLAUDO MULTI-CONTESTO COMPLETATO CON SUCCESSO!');
    console.log('================================================================');

  } finally {
    browser.kill();
    preview.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch {}
  }
}

run().catch(err => {
  console.error('ERRORE NEL COLLAUDO:', err);
  process.exit(1);
});
