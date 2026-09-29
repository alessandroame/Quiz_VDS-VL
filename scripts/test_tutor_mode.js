// scripts/test_tutor_mode.js - E2E verification of Tutor Mode using native CDP
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const chromePath = chromePaths.find(p => fs.existsSync(p));
if (!chromePath) {
  console.error('Browser not found');
  process.exit(1);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  // 1. Ensure Vite preview or dev server is running on port 5173
  let viteProc = null;
  const isServerRunning = await new Promise(resolve => {
    http.get('http://localhost:5173', res => resolve(true)).on('error', () => resolve(false));
  });

  if (!isServerRunning) {
    console.log('Starting preview server on port 5173...');
    viteProc = spawn('npx.cmd', ['vite', 'preview', '--port', '5173', '--strictPort'], {
      cwd: process.cwd(),
      shell: true,
      stdio: 'ignore'
    });
    // Wait for server to start
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      const ready = await new Promise(resolve => {
        http.get('http://localhost:5173', res => resolve(true)).on('error', () => resolve(false));
      });
      if (ready) break;
    }
  }

  const cdpPort = 9235;
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  try {
    await sleep(1500);

    const getTargets = () =>
      new Promise((resolve, reject) => {
        http
          .get(`http://127.0.0.1:${cdpPort}/json`, res => {
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => resolve(JSON.parse(data)));
          })
          .on('error', reject);
      });

    const targets = await getTargets();
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('Target page not found');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let msgId = 1;
    const send = (method, params = {}) =>
      new Promise(resolve => {
        const id = msgId++;
        const handler = event => {
          const msg = JSON.parse(event.data);
          if (msg.id === id) {
            ws.removeEventListener('message', handler);
            resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });

    await new Promise(r => ws.addEventListener('open', r));

    // Enable domains
    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    const consoleErrors = [];
    ws.addEventListener('message', event => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') {
        consoleErrors.push(msg.params.args?.map(a => a.value || a.description).join(' '));
      }
    });

    // Set mobile viewport 390x844
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log('Navigating to http://localhost:5173...');
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await sleep(2500);

    // Capture screenshot of idle launcher
    const idleScreenshot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/test_tutor_idle_screenshot.png', Buffer.from(idleScreenshot.data, 'base64'));
    console.log('Saved idle launcher screenshot: public/test_tutor_idle_screenshot.png');

    // Click "Avvia Simulazione Didattica"
    console.log('Clicking #btn-start-tutor-exam...');
    const clickResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('btn-start-tutor-exam');
        if (!btn) return 'BUTTON_NOT_FOUND';
        btn.click();
        return 'CLICKED';
      })()`,
      returnByValue: true
    });
    console.log('Start button click result:', clickResult.result?.value);
    await sleep(1000);

    // Verify Tutor Running mode (green timer and "Senza limiti")
    const runningCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        return {
          hasSenzaLimiti: text.includes('Senza limiti'),
          hasQuestion: document.querySelector('[data-answer-option]') !== null
        };
      })()`,
      returnByValue: true
    });
    console.log('Running screen check:', runningCheck.result?.value);

    // Select Option 1
    console.log('Clicking option 1...');
    const selectOptResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const opt = document.getElementById('btn-option-1');
        if (!opt) return 'OPT_NOT_FOUND';
        opt.click();
        return 'SELECTED';
      })()`,
      returnByValue: true
    });
    console.log('Option selection result:', selectOptResult.result?.value);
    await sleep(1200);

    // Verify feedback (Regola and Tranello)
    const feedbackCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        const hasNextBtn = document.getElementById('btn-tutor-next-question') !== null;
        return {
          hasRegola: text.includes('Regola:'),
          hasTranello: text.includes('Tranello:'),
          hasNextBtn
        };
      })()`,
      returnByValue: true
    });
    console.log('Feedback verification:', feedbackCheck.result?.value);

    // Scroll to see explanation and next question button
    await send('Runtime.evaluate', {
      expression: `window.scrollBy(0, 450)`
    });
    await sleep(500);

    // Capture screenshot with feedback, explanation, and next button
    const feedbackScreenshot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/test_tutor_feedback_screenshot.png', Buffer.from(feedbackScreenshot.data, 'base64'));
    console.log('Saved tutor feedback screenshot: public/test_tutor_feedback_screenshot.png');

    // Click "Prossima Domanda"
    console.log('Clicking #btn-tutor-next-question...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('btn-tutor-next-question');
        if (btn) btn.click();
      })()`
    });
    await sleep(1000);

    // Question 2: select an intentionally WRONG answer to verify error feedback (red styling)
    console.log('On Question 2: selecting option 3...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const opt = document.getElementById('btn-option-3');
        if (opt) opt.click();
      })()`
    });
    await sleep(800);
    await send('Runtime.evaluate', {
      expression: `window.scrollBy(0, 400)`
    });
    await sleep(500);

    const wrongFeedbackScreenshot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/test_tutor_wrong_feedback_screenshot.png', Buffer.from(wrongFeedbackScreenshot.data, 'base64'));
    console.log('Saved tutor wrong feedback screenshot: public/test_tutor_wrong_feedback_screenshot.png');

    if (consoleErrors.length > 0) {
      console.error('Console errors found:', consoleErrors);
      throw new Error(`Found ${consoleErrors.length} console error(s) during tutor mode test`);
    } else {
      console.log('Zero console errors verified!');
    }

    ws.close();
    console.log('Tutor mode E2E test completed successfully!');
  } finally {
    chromeProc.kill();
    if (viteProc) {
      viteProc.kill();
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
