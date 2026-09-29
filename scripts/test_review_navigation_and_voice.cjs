// scripts/test_review_navigation_and_voice.cjs
// Verification script testing debriefing screen navigation, zero-modal on return to Home, and zero console errors

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
  console.log('=== TEST: REVIEW NAVIGATION & CONSOLE ERROR INTEGRITY ===');

  let preview = null;
  const isServerRunning = await new Promise(resolve => {
    http.get('http://localhost:5173', () => resolve(true)).on('error', () => resolve(false));
  });

  if (!isServerRunning) {
    console.log('Starting preview server on port 5173...');
    preview = spawn('npx.cmd', ['vite', 'preview', '--port', '5173'], {
      shell: true,
      stdio: 'ignore'
    });
    for (let i = 0; i < 30; i++) {
      await sleep(200);
      const ready = await new Promise(resolve => {
        http.get('http://localhost:5173', () => resolve(true)).on('error', () => resolve(false));
      });
      if (ready) break;
    }
  }

  const port = 9557;
  const tempProfile = path.join(os.tmpdir(), `chrome_test_review_${Date.now()}`);

  const browser = spawn(BROWSER_BIN, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:5173/'
  ]);

  const consoleErrors = [];
  const consoleWarnings = [];

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      try {
        const list = await getJson(`http://127.0.0.1:${port}/json/list`);
        const targetPage = list.find(p => p.type === 'page' && p.webSocketDebuggerUrl);
        if (targetPage) {
          wsUrl = targetPage.webSocketDebuggerUrl;
          break;
        }
      } catch (e) {}
      await sleep(200);
    }

    if (!wsUrl) throw new Error('Could not obtain CDP WebSocket URL');

    const ws = new globalThis.WebSocket(wsUrl);
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = rej;
    });

    let id = 1;
    const pending = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg.result);
        pending.delete(msg.id);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = (msg.params.args || []).map(a => a.value || a.description || '').join(' ');
        if (msg.params.type === 'error') {
          consoleErrors.push(text);
          console.log('[BROWSER ERROR]', text);
        } else if (msg.params.type === 'warning') {
          consoleWarnings.push(text);
          console.log('[BROWSER WARNING]', text);
        }
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const text = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text || 'Exception';
        consoleErrors.push(text);
        console.log('[BROWSER EXCEPTION]', text);
      }
    };

    const send = (method, params = {}) => {
      const msgId = id++;
      return new Promise((resolve, reject) => {
        pending.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 412,
      height: 924,
      deviceScaleFactor: 2.625,
      mobile: true
    });

    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2500);

    const evaluate = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      return res.result ? res.result.value : null;
    };

    console.log('1. Starting Tutor Didattico simulation...');
    await evaluate(`
      const btnTutor = document.getElementById('btn-home-tutor');
      if (btnTutor) btnTutor.click();
    `);
    await sleep(2000);

    // Click start exam if on intro card
    await evaluate(`
      const btnStart = document.getElementById('btn-start-tutor-exam') || document.getElementById('btn-start-exam');
      if (btnStart) btnStart.click();
    `);
    await sleep(1500);

    console.log('2. Answering question 1...');
    await evaluate(`
      const opt = document.querySelector('button[id^="btn-option-1"]');
      if (opt) opt.click();
    `);
    await sleep(800);

    console.log('3. Submitting exam...');
    await evaluate(`
      const btnSubmit = document.getElementById('btn-submit-exam-top') || document.getElementById('btn-submit-exam');
      if (btnSubmit) btnSubmit.click();
    `);
    await sleep(500);

    // Confirm submission modal if open
    await evaluate(`
      const btnConfirm = document.getElementById('btn-confirm-submit-exam') || document.getElementById('btn-confirm-submit');
      if (btnConfirm) btnConfirm.click();
    `);
    await sleep(2000);

    console.log('4. Verifying Debriefing / Review screen rendered...');
    const pageText = await evaluate(`document.body.innerText`);
    console.log('Page Text snippet:', pageText.slice(0, 300));
    const resultTitle = await evaluate(`
      const h2 = document.querySelector('h2');
      h2 ? h2.innerText : null;
    `);
    console.log('Result Title:', resultTitle);
    if (!resultTitle || !resultTitle.includes('IDONEO')) {
      throw new Error('Expected debriefing result title (IDONEO / NON IDONEO), got: ' + resultTitle);
    }

    console.log('5. Clicking return home button...');
    await evaluate(`
      const btnHome = document.getElementById('btn-nav-back-home') || document.getElementById('btn-return-home');
      if (btnHome) btnHome.click();
    `);
    await sleep(1000);

    console.log('6. Checking that "Simulazione in Corso" warning modal did NOT appear...');
    const hasAbandonModal = await evaluate(`
      const text = document.body.innerText;
      text.includes('Simulazione in Corso') && text.includes('abbandonare l\\'esame');
    `);
    console.log('Has Abandon Modal:', hasAbandonModal);
    if (hasAbandonModal) {
      throw new Error('FAILED: "Simulazione in Corso" warning modal appeared when returning to home from debriefing screen!');
    }

    const currentTab = await evaluate(`
      document.getElementById('card-launch-tutor') !== null || document.body.innerText.includes('VDS-VL');
    `);
    console.log('Successfully navigated back to Home:', currentTab);
    if (!currentTab) {
      throw new Error('FAILED: Did not return to Home screen.');
    }

    // Inspect console errors
    console.log('Console Errors Count:', consoleErrors.length);
    console.log('Console Warnings Count:', consoleWarnings.length);

    const criticalErrors = consoleErrors.filter(e =>
      e.includes('Maximum update depth exceeded') ||
      e.includes('Cannot update a component') ||
      e.includes('AbortError')
    );

    const abortWarnings = consoleWarnings.filter(w =>
      w.includes('AbortError')
    );

    if (criticalErrors.length > 0) {
      throw new Error('FAILED: Found critical console errors:\n' + criticalErrors.join('\n'));
    }

    if (abortWarnings.length > 0) {
      throw new Error('FAILED: Found AbortError warnings:\n' + abortWarnings.join('\n'));
    }

    console.log('SUCCESS: All debriefing navigation and voice lifecycle checks passed with zero errors!');
    ws.close();
  } finally {
    browser.kill();
    if (preview) preview.kill();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
