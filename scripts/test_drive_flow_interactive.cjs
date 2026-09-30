// scripts/test_drive_flow_interactive.cjs
// Verification script testing interactive Audio/Drive Mode flow and zero console errors

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
  console.log('=== TEST: INTERACTIVE AUDIO / DRIVE FLOW INTEGRITY ===');

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

  if (!BROWSER_BIN) {
    console.error('No Chrome or Edge binary found.');
    process.exit(1);
  }

  const port = 9335;
  const tempProfile = path.join(os.tmpdir(), `chrome_drive_flow_${Date.now()}`);

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

    console.log('1. Opening Hands-Free Mode from Home Navbar...');
    await evaluate(`
      const btnDrive = document.getElementById('btn-drive-mode');
      if (btnDrive) btnDrive.click();
    `);
    await sleep(1500);

    console.log('2. Verifying Audio Launcher rendered...');
    const launcherFound = await evaluate(`
      Boolean(document.getElementById('btn-drive-start-radio') || document.getElementById('btn-drive-start-exam'))
    `);
    console.log('Audio Launcher visible:', launcherFound);
    if (!launcherFound) {
      throw new Error('Audio launcher was not found after clicking quick audio button');
    }

    console.log('3. Starting Radio Quiz in Audio Mode...');
    await evaluate(`
      const btnRadio = document.getElementById('btn-drive-start-radio');
      if (btnRadio) btnRadio.click();
    `);
    await sleep(1500);

    console.log('4. Verifying quiz HUD & macro-options in running mode...');
    const optionsFound = await evaluate(`
      Boolean(document.getElementById('btn-drive-opt-1') && document.getElementById('btn-drive-opt-2'))
    `);
    console.log('Macro-options rendered:', optionsFound);
    if (!optionsFound) {
      throw new Error('Options 1 and 2 were not found in running Audio Mode');
    }

    console.log('5. Answering Option 2...');
    await evaluate(`
      const opt2 = document.getElementById('btn-drive-opt-2');
      if (opt2) opt2.click();
    `);
    await sleep(1500);

    console.log('6. Closing Audio Mode...');
    await evaluate(`
      const btnClose = document.getElementById('btn-drive-back') || document.getElementById('btn-drive-exit') || document.querySelector('button[title*="Esci"]');
      if (btnClose) btnClose.click();
    `);
    await sleep(1500);

    console.log('Console Errors Count:', consoleErrors.length);
    console.log('Console Warnings Count:', consoleWarnings.length);

    if (consoleErrors.length > 0) {
      throw new Error(`Test failed with ${consoleErrors.length} console error(s):\n${consoleErrors.join('\n')}`);
    }

    console.log('SUCCESS: Interactive Audio Mode flow completed with zero console errors!');
  } finally {
    try { browser.kill(); } catch (e) {}
    try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch (e) {}
    if (preview) {
      try { preview.kill(); } catch (e) {}
    }
  }
}

run().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
