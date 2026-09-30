// scripts/generate_manual_screenshots.cjs
// Automated screenshot generator for the VDS-VL Quiz Master User Manual
// Uses native Chrome/Edge CDP with zero dependencies

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
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
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
  console.log('📸 GENERAZIONE SCREENSHOT PER MANUALE UTENTE VDS-VL QUIZ MASTER');
  console.log('================================================================\n');

  if (!BROWSER_BIN) {
    throw new Error('Nessun browser Chrome/Edge rilevato.');
  }

  const outputDir = path.join(__dirname, '..', 'docs', 'screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let preview = null;
  const isServerRunning = await new Promise(resolve => {
    http.get('http://localhost:5173', () => resolve(true)).on('error', () => resolve(false));
  });

  if (!isServerRunning) {
    console.log('Avvio preview server su porta 5173...');
    preview = spawn('npx.cmd', ['vite', 'preview', '--port', '5173'], {
      shell: true,
      stdio: 'ignore'
    });
    for (let i = 0; i < 40; i++) {
      await sleep(200);
      const ready = await new Promise(resolve => {
        http.get('http://localhost:5173', () => resolve(true)).on('error', () => resolve(false));
      });
      if (ready) break;
    }
  }

  const port = 9588;
  const tempProfile = path.join(os.tmpdir(), `chrome_manual_shots_${Date.now()}`);

  const browser = spawn(BROWSER_BIN, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:5173/'
  ]);

  try {
    let wsUrl = null;
    for (let i = 0; i < 35; i++) {
      try {
        const list = await getJson(`http://127.0.0.1:${port}/json/list`);
        const page = list.find(p => p.type === 'page' && p.webSocketDebuggerUrl);
        if (page) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch (e) {}
      await sleep(150);
    }

    if (!wsUrl) throw new Error('Impossibile connettersi al CDP');

    const ws = new globalThis.WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id && pending.has(data.id)) {
          const resolve = pending.get(data.id);
          pending.delete(data.id);
          resolve(data.result);
        }
      } catch (e) {}
    };

    const send = (method, params = {}) => {
      const id = msgId++;
      return new Promise((resolve) => {
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Network.enable');

    // Viewport standard mobile 390 x 844 (scale factor 2)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      screenOrientation: { type: 'portraitPrimary', angle: 0 }
    });

    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2500);

    const evaluate = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      return res.result ? res.result.value : null;
    };

    const capture = async (filename) => {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const filePath = path.join(outputDir, filename);
      fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
      console.log(`  ✓ Catturato: ${filename}`);
      return filePath;
    };

    const goToHome = async () => {
      await send('Page.navigate', { url: 'http://localhost:5173/' });
      await sleep(1200);
    };

    console.log('1. Popolamento dati realistici in IndexedDB (Dexie)...');
    await evaluate(`
      (async () => {
        return new Promise((resolve, reject) => {
          const req = indexedDB.open('VdsQuizMasterDB');
          req.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction(['stats', 'sessions', 'settings'], 'readwrite');
            const statsStore = tx.objectStore('stats');
            const sessionsStore = tx.objectStore('sessions');
            const settingsStore = tx.objectStore('settings');

            settingsStore.put({ key: 'theme', value: 'dark' });
            settingsStore.put({ key: 'autoAdvanceOnCorrect', value: false });
            settingsStore.put({ key: 'driveModeIntroPlayed', value: true });
            settingsStore.put({ key: 'audioOfflinePromptDismissed', value: true });

            const mockStats = [
              { questionId: 1001, timesSeen: 4, timesCorrect: 1, timesWrong: 3, consecutiveCorrect: 0, lastResult: 'wrong', lastAnsweredAt: Date.now() - 3600000, isBookmarked: true, userNote: 'Ricorda: vento apparente = vento relativo!' },
              { questionId: 1002, timesSeen: 3, timesCorrect: 3, timesWrong: 0, consecutiveCorrect: 3, lastResult: 'correct', lastAnsweredAt: Date.now() - 4000000, isBookmarked: false },
              { questionId: 2005, timesSeen: 5, timesCorrect: 2, timesWrong: 3, consecutiveCorrect: 1, lastResult: 'wrong', lastAnsweredAt: Date.now() - 5000000, isBookmarked: true, userNote: 'Gradiente adiabatico secco: 1°C per 100m' },
              { questionId: 3010, timesSeen: 2, timesCorrect: 0, timesWrong: 2, consecutiveCorrect: 0, lastResult: 'wrong', lastAnsweredAt: Date.now() - 7200000, isBookmarked: false },
              { questionId: 4002, timesSeen: 3, timesCorrect: 1, timesWrong: 2, consecutiveCorrect: 0, lastResult: 'wrong', lastAnsweredAt: Date.now() - 8600000, isBookmarked: false },
              { questionId: 5001, timesSeen: 4, timesCorrect: 4, timesWrong: 0, consecutiveCorrect: 4, lastResult: 'correct', lastAnsweredAt: Date.now() - 10000000, isBookmarked: false },
              { questionId: 6001, timesSeen: 2, timesCorrect: 2, timesWrong: 0, consecutiveCorrect: 2, lastResult: 'correct', lastAnsweredAt: Date.now() - 12000000, isBookmarked: false },
              { questionId: 7001, timesSeen: 2, timesCorrect: 2, timesWrong: 0, consecutiveCorrect: 2, lastResult: 'correct', lastAnsweredAt: Date.now() - 14000000, isBookmarked: false },
              { questionId: 8001, timesSeen: 3, timesCorrect: 3, timesWrong: 0, consecutiveCorrect: 3, lastResult: 'correct', lastAnsweredAt: Date.now() - 16000000, isBookmarked: false },
              { questionId: 9001, timesSeen: 3, timesCorrect: 3, timesWrong: 0, consecutiveCorrect: 3, lastResult: 'correct', lastAnsweredAt: Date.now() - 18000000, isBookmarked: false }
            ];

            for (const s of mockStats) {
              statsStore.put(s);
            }

            sessionsStore.put({
              date: Date.now() - 86400000,
              isPassed: true,
              isMarathon: false,
              score: 28,
              totalQuestions: 30,
              errorsCount: 2,
              durationSeconds: 1420,
              answers: { 1001: 2, 2005: 1 },
              snapshots: []
            });

            tx.oncomplete = () => resolve(true);
            tx.onerror = (err) => reject(err);
          };
          req.onerror = (err) => reject(err);
        });
      })()
    `);

    // ==========================================
    // 01. HOME HUB (Cruscotto)
    // ==========================================
    console.log('2. Scatto 01_home_hub.png...');
    await goToHome();
    await capture('01_home_hub.png');

    // ==========================================
    // 02. MODALITÀ TUTOR (Studio Didattico con Regola e Tranello)
    // ==========================================
    console.log('3. Scatto 02_tutor_mode.png...');
    await evaluate(`document.getElementById('btn-home-tutor')?.click();`);
    await sleep(1200);
    await evaluate(`
      const btnStart = document.getElementById('btn-start-tutor-exam') || document.getElementById('btn-start-exam');
      if (btnStart) btnStart.click();
    `);
    await sleep(1000);

    // Clicca l'opzione 2 per mostrare feedback didattico
    await evaluate(`
      const opts = Array.from(document.querySelectorAll('button[id^="btn-option-"]'));
      if (opts.length >= 2) opts[1].click();
    `);
    await sleep(800);
    await capture('02_tutor_mode.png');

    // ==========================================
    // 03. MODALITÀ ESAME UFFICIALE (Timer & 30 Bolle)
    // ==========================================
    console.log('4. Scatto 03_exam_simulation.png...');
    // Rimuovi activeSession residua del tutor per far partire un vero esame ufficiale
    await evaluate(`
      (async () => {
        return new Promise((resolve) => {
          const req = indexedDB.open('VdsQuizMasterDB');
          req.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction(['settings'], 'readwrite');
            tx.objectStore('settings').delete('activeSession');
            tx.oncomplete = () => resolve(true);
          };
        });
      })()
    `);
    await goToHome();
    await evaluate(`document.getElementById('btn-home-exam')?.click();`);
    await sleep(1200);
    await evaluate(`
      const btnStart = document.getElementById('btn-start-exam');
      if (btnStart) btnStart.click();
    `);
    await sleep(1000);

    // Rispondi alla domanda 1, vai avanti, rispondi alla 2, metti flag sulla 3
    await evaluate(`
      (async () => {
        const opt1 = document.querySelector('button[id^="btn-option-"]');
        if (opt1) opt1.click();
        await new Promise(r => setTimeout(r, 300));
        const btnNext = document.getElementById('btn-next-question');
        if (btnNext) btnNext.click();
        await new Promise(r => setTimeout(r, 300));
        const opt2 = document.querySelector('button[id^="btn-option-"]');
        if (opt2) opt2.click();
        await new Promise(r => setTimeout(r, 300));
        if (btnNext) btnNext.click();
        await new Promise(r => setTimeout(r, 300));
        const btnFlag = document.getElementById('btn-flag');
        if (btnFlag) btnFlag.click();
      })()
    `);
    await sleep(600);
    await capture('03_exam_simulation.png');

    // ==========================================
    // 04. DEBRIEFING ESAME (Verdetto & Filtri Errori)
    // ==========================================
    console.log('5. Scatto 04_exam_debriefing.png...');
    await evaluate(`
      (async () => {
        const btnSubmit = document.getElementById('btn-submit-exam-top') || document.getElementById('btn-submit-exam');
        if (btnSubmit) btnSubmit.click();
        await new Promise(r => setTimeout(r, 500));
        const btnConfirm = document.getElementById('btn-confirm-submit-exam') || document.getElementById('btn-confirm-submit');
        if (btnConfirm) btnConfirm.click();
      })()
    `);
    await sleep(1800);
    // Clicca filtro "Solo Errori"
    await evaluate(`
      const btnSoloErrori = document.querySelector('button[id="filter-errors"]') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Solo Errori'));
      if (btnSoloErrori) btnSoloErrori.click();
    `);
    await sleep(500);
    await capture('04_exam_debriefing.png');

    console.log('5b. Scatto 04b_exam_review_filters.png...');
    // Scorri verso i filtri di revisione e il banner Ripassa Ora in Tutor
    await evaluate(`
      const rev = document.getElementById('btn-filter-review-wrong');
      if (rev) {
        rev.click();
        rev.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    `);
    await sleep(600);
    await capture('04b_exam_review_filters.png');

    // ==========================================
    // 05. STUDIO PER MATERIE
    // ==========================================
    console.log('6. Scatto 05_topics_screen.png...');
    await goToHome();
    await evaluate(`document.getElementById('btn-home-topics')?.click();`);
    await sleep(1200);
    await capture('05_topics_screen.png');

    // ==========================================
    // 06. QUADERNO ERRORI (Leitner)
    // ==========================================
    console.log('7. Scatto 06_mistakes_screen.png...');
    await goToHome();
    await evaluate(`document.getElementById('btn-home-mistakes')?.click();`);
    await sleep(1200);
    await capture('06_mistakes_screen.png');

    // ==========================================
    // 07. SCHEDA DETTAGLIO DOMANDA (QuestionDetailModal)
    // ==========================================
    console.log('8. Scatto 07_question_detail_modal.png...');
    await evaluate(`
      const firstCard = document.querySelector('div[id^="mistake-card-"]');
      if (firstCard) firstCard.click();
    `);
    await sleep(800);
    await capture('07_question_detail_modal.png');

    // ==========================================
    // 08. ARCHIVIO & RICERCA SENZA TASTIERA (#ID Pad)
    // ==========================================
    console.log('9. Scatto 08_archive_search.png...');
    await goToHome();
    await evaluate(`document.getElementById('btn-home-archive')?.click();`);
    await sleep(1200);
    await evaluate(`
      const btnKeypad = document.getElementById('btn-toggle-keypad');
      if (btnKeypad) btnKeypad.click();
    `);
    await sleep(600);
    await capture('08_archive_search.png');

    // ==========================================
    // 09. STATISTICHE (Panoramica & Dettaglio Materia)
    // ==========================================
    console.log('10. Scatto 09_stats_overview.png...');
    await goToHome();
    await evaluate(`document.getElementById('btn-home-stats')?.click();`);
    await sleep(1200);
    await capture('09_stats_overview.png');

    console.log('11. Scatto 09b_stats_subject_modal.png...');
    // Clicca sulla prima materia per aprire SubjectDetailModal
    await evaluate(`
      const btnSub = document.querySelector('button[id^="btn-stat-subject-"]');
      if (btnSub) btnSub.click();
    `);
    await sleep(800);
    await capture('09b_stats_subject_modal.png');

    // ==========================================
    // 10. MODALITÀ AUDIO (Mani Libere per Bici/Corsa)
    // ==========================================
    console.log('11. Scatto 10_audio_hands_free.png...');
    await goToHome();
    await evaluate(`document.getElementById('btn-drive-mode')?.click();`);
    await sleep(1200);
    await evaluate(`
      const btnStartTutor = document.getElementById('btn-drive-start-tutor') || document.getElementById('btn-drive-start-radio');
      if (btnStartTutor) btnStartTutor.click();
    `);
    await sleep(1500);
    await capture('10_audio_hands_free.png');

    // ==========================================
    // 11. IMPOSTAZIONI (Accordion con Scala Font)
    // ==========================================
    console.log('12. Scatto 11_settings_accordion.png...');
    await goToHome();
    await evaluate(`document.getElementById('btn-settings')?.click();`);
    await sleep(1200);
    await evaluate(`
      const tabAppearance = document.getElementById('tab-appearance');
      if (tabAppearance) tabAppearance.click();
    `);
    await sleep(600);
    await capture('11_settings_accordion.png');

    console.log('\n🎉 Tutti gli screenshot generati con successo in docs/screenshots/!');

    ws.close();
  } catch (err) {
    console.error('❌ Errore durante la generazione degli screenshot:', err);
  } finally {
    browser.kill();
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch (e) {}
    if (preview) {
      preview.kill();
    }
  }
}

run();
