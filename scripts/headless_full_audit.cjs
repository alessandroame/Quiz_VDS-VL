const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
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
  console.log('=== STARTING EXHAUSTIVE HEADLESS AUDIT ===');
  const port = 9555;
  const tempProfile = path.join(os.tmpdir(), `chrome_audit_${Date.now()}`);

  const browser = spawn(BROWSER_BIN, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:5173/'
  ]);

  const defects = [];
  const screenshots = [];

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

    if (!wsUrl) throw new Error('Could not connect to CDP');

    const ws = new globalThis.WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    const pending = new Map();
    const consoleLogs = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        consoleLogs.push({ type: msg.params.type, text });
        if (msg.params.type === 'error') {
          defects.push({ category: 'console_error', detail: text });
        }
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const text = msg.params.exceptionDetails.text;
        defects.push({ category: 'js_exception', detail: text });
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

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    const snap = async (name, width = 390, height = 844, mobile = true) => {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile
      });
      await sleep(300);
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const filename = `public/audit_${name}.png`;
      fs.writeFileSync(filename, Buffer.from(res.data, 'base64'));
      screenshots.push(filename);
      console.log(`[SNAP] Saved ${filename} (${width}x${height})`);
      return filename;
    };

    const evalJs = async (expr) => {
      const res = await send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true
      });
      if (res.exceptionDetails) {
        defects.push({ category: 'eval_error', detail: res.exceptionDetails.text });
      }
      return res.result ? res.result.value : null;
    };

    await sleep(1000);

    // 1. Audit Home / Exam Landing Screen
    console.log('\n--- 1. AUDIT: Home / Exam Landing Screen ---');
    await snap('01_home_mobile_portrait', 390, 844);
    await snap('01_home_desktop', 1440, 900, false);
    await snap('01_home_mobile_landscape', 844, 390, true);

    // 2. Audit Quick Voice Menu
    console.log('\n--- 2. AUDIT: Quick Voice Menu ---');
    await evalJs(`document.querySelector('#btn-voice-quick-menu')?.click()`);
    await sleep(400);
    await snap('02_voice_menu_open_mobile', 390, 844);
    // Click outside to close
    await evalJs(`document.querySelector('#btn-voice-quick-menu')?.click()`);
    await sleep(300);

    // 3. Audit Settings Screen Fullscreen
    console.log('\n--- 3. AUDIT: Settings Screen Fullscreen ---');
    await evalJs(`document.querySelector('#btn-settings')?.click()`);
    await sleep(500);
    await snap('03_settings_mobile', 390, 844);
    await snap('03_settings_desktop', 1440, 900, false);

    // Test settings tab navigation (Voce, Guida, Backup, Dati, About)
    const tabs = ['voice', 'drive', 'backup', 'data', 'about'];
    for (const tab of tabs) {
      await evalJs(`document.querySelector('#tab-${tab}')?.click()`);
      await sleep(200);
      await snap(`03_settings_tab_${tab}`, 390, 844);
    }
    // Close settings
    await evalJs(`document.querySelector('#btn-close-settings-x')?.click()`);
    await sleep(300);

    // 4. Audit Tutor Exam Simulation
    console.log('\n--- 4. AUDIT: Tutor Exam Simulation ---');
    // Click "Avvia Simulazione Didattica (30 Quiz)"
    const startTutorRes = await evalJs(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Avvia Simulazione Didattica'));
        if (btn) { btn.click(); return true; }
        return false;
      })()
    `);
    console.log('Start tutor clicked:', startTutorRes);
    await sleep(600);
    await snap('04_exam_running_mobile', 390, 844);
    await snap('04_exam_running_desktop', 1440, 900, false);

    // Select option 1 to check instant feedback
    console.log('Selecting option 1...');
    await evalJs(`document.querySelector('#btn-option-1')?.click()`);
    await sleep(500);
    await snap('04_exam_feedback_mobile', 390, 844);

    // Flag question
    console.log('Toggling flag...');
    await evalJs(`document.querySelector('#btn-flag')?.click()`);
    await sleep(300);
    await snap('04_exam_flagged_mobile', 390, 844);

    // End exam or submit
    console.log('Clicking Consegna Esame...');
    await evalJs(`document.querySelector('#btn-submit-exam-top')?.click()`);
    await sleep(400);
    await snap('04_exam_submit_modal_mobile', 390, 844);

    // Confirm submission
    console.log('Confirming submission...');
    await evalJs(`document.querySelector('#btn-confirm-submit-exam')?.click()`);
    await sleep(800);
    await snap('04_exam_debriefing_mobile', 390, 844);

    // Close debriefing / return home
    console.log('Returning to Exam Home...');
    await evalJs(`document.querySelector('#btn-return-home')?.click()`);
    await sleep(500);

    // 5. Audit Topics Screen
    console.log('\n--- 5. AUDIT: Topics Screen ---');
    await evalJs(`document.querySelector('#nav-topics')?.click()`);
    await sleep(500);
    await snap('05_topics_mobile', 390, 844);
    await snap('05_topics_desktop', 1440, 900, false);

    // 6. Audit Mistakes Screen
    console.log('\n--- 6. AUDIT: Mistakes Screen ---');
    await evalJs(`document.querySelector('#nav-mistakes')?.click()`);
    await sleep(500);
    await snap('06_mistakes_mobile', 390, 844);

    // 7. Audit Archive Screen & Search
    console.log('\n--- 7. AUDIT: Archive Screen & Search ---');
    await evalJs(`document.querySelector('#nav-archive')?.click()`);
    await sleep(500);
    await snap('07_archive_mobile', 390, 844);
    // Search using native setter to trigger React synthetic event
    await evalJs(`
      (() => {
        const input = document.getElementById('archive-search-input');
        if (input) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(input, 'vento');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()
    `);
    await sleep(400);
    await snap('07_archive_search_mobile', 390, 844);

    // 8. Audit Stats Screen
    console.log('\n--- 8. AUDIT: Stats Screen ---');
    await evalJs(`document.querySelector('#nav-stats')?.click()`);
    await sleep(500);
    await snap('08_stats_mobile', 390, 844);
    await snap('08_stats_desktop', 1440, 900, false);

    // 9. Audit Light Mode (Hangar Light)
    console.log('\n--- 9. AUDIT: Light Mode (Hangar Light) ---');
    await evalJs(`document.querySelector('#btn-theme-toggle')?.click()`);
    await sleep(500);
    await snap('09_light_stats_mobile', 390, 844);
    await evalJs(`document.querySelector('#nav-exam')?.click()`);
    await sleep(400);
    await snap('09_light_home_mobile', 390, 844);
    // Switch back to dark theme
    await evalJs(`document.querySelector('#btn-theme-toggle')?.click()`);
    await sleep(300);

    // 10. Audit Drive Mode Screen
    console.log('\n--- 10. AUDIT: Drive Mode Screen ---');
    await evalJs(`document.querySelector('#btn-drive-mode')?.click()`);
    await sleep(600);
    // If audio offline prompt modal appears, capture it and dismiss it
    const hasPrompt = await evalJs(`Boolean(document.querySelector('#btn-dismiss-audio-prompt'))`);
    if (hasPrompt) {
      await snap('10_drive_offline_prompt_mobile', 390, 844);
      await evalJs(`document.querySelector('#btn-dismiss-audio-prompt')?.click()`);
      await sleep(400);
    }
    await snap('10_drive_launcher_mobile', 390, 844);
    await snap('10_drive_launcher_landscape', 844, 390, true);

    // Start Radio Quiz in Drive Mode
    console.log('Starting Radio Quiz in Drive Mode...');
    await evalJs(`Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Tutti i 504 Quiz') || b.textContent?.includes('Radio-Quiz'))?.click()`);
    await sleep(600);
    await snap('10_drive_running_mobile', 390, 844);
    await snap('10_drive_running_landscape', 844, 390, true);

    // Exit Drive Mode
    console.log('Exiting Drive Mode...');
    await evalJs(`document.querySelector('#btn-drive-exit')?.click()`);
    await sleep(500);

    console.log('\n=== AUDIT FINISHED ===');
    console.log(`Defects found: ${defects.length}`);
    if (defects.length > 0) {
      console.log('Defects list:', JSON.stringify(defects, null, 2));
    }
    console.log(`Screenshots generated: ${screenshots.length}`);

    ws.close();
  } finally {
    browser.kill();
  }
}

run().catch(console.error);
