const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');

const BROWSER_BIN = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

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
  console.log('=== TEST: EXAM ABANDON SINGLE CLICK ===');
  const port = 9556;
  const tempProfile = path.join(os.tmpdir(), `chrome_test_abandon_${Date.now()}`);

  // Ensure preview server is running
  let previewProc = null;
  const isServerRunning = await new Promise(resolve => {
    http.get('http://localhost:5173', () => resolve(true)).on('error', () => resolve(false));
  });

  if (!isServerRunning) {
    console.log('Starting preview server on port 5173...');
    previewProc = spawn('npx.cmd', ['vite', 'preview', '--port', '5173', '--strictPort'], {
      cwd: process.cwd(),
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

  const browser = spawn(BROWSER_BIN, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:5173/'
  ]);

  const errors = [];

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

    if (!wsUrl) throw new Error('Could not connect to Chrome CDP');

    const ws = new globalThis.WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        if (msg.params.type === 'error') {
          errors.push(`Console error: ${text}`);
        }
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        errors.push(`JS exception: ${msg.params.exceptionDetails.text}`);
      }
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

    const evalJs = async (expr) => {
      const res = await send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true
      });
      return res.result.value;
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(1500);

    // 1. Go to Exam Tab
    console.log('1. Navigating to Exam Tab...');
    await evalJs(`document.querySelector('#nav-exam')?.click()`);
    await sleep(500);

    // 2. Verify we are on Idle Exam Screen
    let hasStartTutor = await evalJs(`Boolean(document.querySelector('#btn-start-tutor-exam'))`);
    console.log('2. #btn-start-tutor-exam present?', hasStartTutor);
    if (!hasStartTutor) throw new Error('Failed to reach exam idle screen');

    // 3. Start Tutor Exam
    console.log('3. Starting Tutor Exam...');
    await evalJs(`document.querySelector('#btn-start-tutor-exam')?.click()`);
    await sleep(800);

    // 4. Verify Exam is Running
    let hasAbandonBtn = await evalJs(`Boolean(document.querySelector('#btn-abandon-exam'))`);
    console.log('4. #btn-abandon-exam visible (exam running)?', hasAbandonBtn);
    if (!hasAbandonBtn) throw new Error('Exam did not start or abandon button is missing');

    // Answer first question
    await evalJs(`document.querySelector('#btn-option-1')?.click()`);
    await sleep(300);

    // 5. Click Abandon Button (opens modal)
    console.log('5. Clicking #btn-abandon-exam...');
    await evalJs(`document.querySelector('#btn-abandon-exam')?.click()`);
    await sleep(400);

    // 6. Verify Abandon Modal is open
    let hasConfirmAbandon = await evalJs(`Boolean(document.querySelector('#btn-confirm-abandon-exam'))`);
    console.log('6. #btn-confirm-abandon-exam visible (modal open)?', hasConfirmAbandon);
    if (!hasConfirmAbandon) throw new Error('Abandon confirmation modal did not open');

    // 7. Click Confirm Abandon EXACTLY ONCE
    console.log('7. Clicking #btn-confirm-abandon-exam ONCE...');
    await evalJs(`document.querySelector('#btn-confirm-abandon-exam')?.click()`);

    // 8. Wait 600ms and check immediate state
    await sleep(600);
    let isIdleImmediately = await evalJs(`Boolean(document.querySelector('#btn-start-tutor-exam'))`);
    let isAbandonGoneImmediately = await evalJs(`!document.querySelector('#btn-abandon-exam')`);
    console.log('8. After 600ms - idle screen visible?', isIdleImmediately, '| exam abandon button gone?', isAbandonGoneImmediately);

    if (!isIdleImmediately || !isAbandonGoneImmediately) {
      throw new Error(`FAIL: Single-click abandon did not immediately return to idle. (idle=${isIdleImmediately}, abandonGone=${isAbandonGoneImmediately})`);
    }

    // 9. Wait an additional 1500ms to ensure NO bounce-back / auto-resume occurs
    console.log('9. Waiting 1500ms to assert NO bounce-back / race condition...');
    await sleep(1500);

    let isStillIdle = await evalJs(`Boolean(document.querySelector('#btn-start-tutor-exam'))`);
    let isStillNotRunning = await evalJs(`!document.querySelector('#btn-abandon-exam')`);
    console.log('10. After 2100ms total - still on idle screen?', isStillIdle, '| still not running?', isStillNotRunning);

    if (!isStillIdle || !isStillNotRunning) {
      throw new Error(`FAIL: BOUNCE-BACK DETECTED! Exam auto-resumed after abandon.`);
    }

    // 10. Check if user can start a NEW exam after abandon
    console.log('11. Testing starting a new exam after abandonment...');
    await evalJs(`document.querySelector('#btn-start-tutor-exam')?.click()`);
    await sleep(600);
    let canRestart = await evalJs(`Boolean(document.querySelector('#btn-abandon-exam'))`);
    console.log('12. Successfully restarted new exam?', canRestart);
    if (!canRestart) throw new Error('Failed to start a new exam after abandonment');

    // Cleanly abandon the second exam too
    await evalJs(`document.querySelector('#btn-abandon-exam')?.click()`);
    await sleep(400);
    await evalJs(`document.querySelector('#btn-confirm-abandon-exam')?.click()`);
    await sleep(600);
    let isIdleAfterSecondAbandon = await evalJs(`Boolean(document.querySelector('#btn-start-tutor-exam'))`);
    console.log('13. Cleanly idle after second abandon?', isIdleAfterSecondAbandon);
    if (!isIdleAfterSecondAbandon) throw new Error('Second abandon failed');

    console.log('=== TEST RESULT: PASSED 100% - ZERO BOUNCE-BACK, EXITS ON FIRST CLICK ===');
    console.log('Recorded Errors:', errors);

    ws.close();
  } finally {
    try { browser.kill(); } catch (e) {}
    if (previewProc) {
      try { previewProc.kill(); } catch (e) {}
    }
    try {
      fs.rmSync(tempProfile, { recursive: true, force: true });
    } catch (e) {}
  }

  if (errors.length > 0) {
    console.error('Test detected console errors:', errors);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
