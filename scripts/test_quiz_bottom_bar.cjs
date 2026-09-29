const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
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
  console.log('=== TEST: QUIZ ANCHORED BOTTOM ACTION BAR ===');
  const port = 9558;
  const tempProfile = path.join(os.tmpdir(), `chrome_test_bottombar_${Date.now()}`);

  // 1. Start vite preview
  console.log('Starting vite preview on port 5173...');
  const preview = spawn('npx.cmd', ['vite', 'preview', '--port', '5173', '--strictPort'], {
    cwd: 'c:\\github\\Quiz_VDS-VL',
    shell: true,
    stdio: 'ignore'
  });

  // Wait for preview server
  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    await sleep(200);
    try {
      await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:5173/', res => {
          if (res.statusCode === 200) resolve(true);
          else reject(new Error('Status ' + res.statusCode));
        });
        req.on('error', reject);
      });
      serverReady = true;
      break;
    } catch (e) {}
  }

  if (!serverReady) {
    preview.kill();
    throw new Error('Vite preview server failed to start on port 5173');
  }
  console.log('Vite preview server ready!');

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
      return res.result?.value;
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    // TEST 1: Mobile Portrait (390x844)
    console.log('\n--- 1. Testing Mobile Portrait (390x844) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(1500);

    // Go to Exam Tab and start Tutor Exam
    console.log('Starting Tutor Exam...');
    await evalJs(`document.querySelector('#nav-exam')?.click()`);
    await sleep(400);
    await evalJs(`document.querySelector('#btn-start-tutor-exam')?.click()`);
    await sleep(800);

    // Verify QuizBottomBar presence and fixed positioning
    const barMetrics = await evalJs(`(() => {
      const bar = document.querySelector('#quiz-bottom-bar');
      if (!bar) return null;
      const rect = bar.getBoundingClientRect();
      const prevBtn = document.querySelector('#btn-prev-question');
      const nextBtn = document.querySelector('#btn-next-question');
      const flagBtn = document.querySelector('#btn-flag-question-bottom');
      return {
        bottom: Math.round(rect.bottom),
        windowHeight: window.innerHeight,
        hasPrev: Boolean(prevBtn),
        isPrevDisabled: prevBtn?.disabled || false,
        hasNext: Boolean(nextBtn),
        hasFlag: Boolean(flagBtn)
      };
    })()`);

    console.log('Bottom Bar metrics on Question 1:', barMetrics);
    if (!barMetrics) throw new Error('#quiz-bottom-bar not found in DOM!');
    if (Math.abs(barMetrics.bottom - barMetrics.windowHeight) > 2) {
      throw new Error(`Bottom bar is NOT fixed at bottom of viewport: bottom=${barMetrics.bottom}, windowHeight=${barMetrics.windowHeight}`);
    }
    if (!barMetrics.isPrevDisabled) {
      throw new Error('Previous button should be disabled on first question!');
    }

    // Scroll down and verify bottom bar remains fixed to viewport
    console.log('Scrolling page 300px down and verifying fixed position...');
    await evalJs(`window.scrollBy(0, 300)`);
    await sleep(300);

    const scrolledMetrics = await evalJs(`(() => {
      const bar = document.querySelector('#quiz-bottom-bar');
      const rect = bar.getBoundingClientRect();
      return {
        bottom: Math.round(rect.bottom),
        windowHeight: window.innerHeight
      };
    })()`);
    console.log('After scroll: bottom bar metrics:', scrolledMetrics);
    if (Math.abs(scrolledMetrics.bottom - scrolledMetrics.windowHeight) > 2) {
      throw new Error('Bottom bar shifted after scroll! Must remain fixed to viewport.');
    }

    // Answer Question 1
    console.log('Answering Question 1 to test tutor next question button in bottom bar...');
    await evalJs(`document.querySelector('#btn-option-1')?.click()`);
    await sleep(500);

    // Verify #btn-tutor-next-question appears inside #quiz-bottom-bar
    const tutorBtnCheck = await evalJs(`(() => {
      const btn = document.querySelector('#btn-tutor-next-question');
      const bar = document.querySelector('#quiz-bottom-bar');
      return {
        exists: Boolean(btn),
        insideBar: bar?.contains(btn),
        text: btn?.innerText
      };
    })()`);
    console.log('Tutor button verification:', tutorBtnCheck);
    if (!tutorBtnCheck.exists || !tutorBtnCheck.insideBar) {
      throw new Error('#btn-tutor-next-question not found inside #quiz-bottom-bar!');
    }

    // Capture screenshot of mobile portrait with anchored bottom bar
    const ss1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/test_anchored_bottom_bar_mobile.png', Buffer.from(ss1.data, 'base64'));
    console.log('Saved screenshot: public/test_anchored_bottom_bar_mobile.png');

    // Click #btn-tutor-next-question to advance
    console.log('Clicking #btn-tutor-next-question...');
    await evalJs(`document.querySelector('#btn-tutor-next-question')?.click()`);
    await sleep(500);

    // Verify Question 2 active
    const q2Check = await evalJs(`(() => {
      const prevBtn = document.querySelector('#btn-prev-question');
      const bubble2 = document.querySelector('#bubble-q-2');
      return {
        prevEnabled: !prevBtn?.disabled,
        bubble2HasRing: bubble2?.className.includes('ring')
      };
    })()`);
    console.log('Question 2 verification:', q2Check);
    if (!q2Check.prevEnabled) throw new Error('Previous button should be enabled on question 2!');

    // Test Flag toggle in bottom bar
    console.log('Testing flag toggle from bottom bar...');
    await evalJs(`document.querySelector('#btn-flag-question-bottom')?.click()`);
    await sleep(300);

    const flagCheck = await evalJs(`(() => {
      const btn = document.querySelector('#btn-flag-question-bottom');
      const bubble2 = document.querySelector('#bubble-q-2');
      return {
        btnHighlighted: btn?.className.includes('amber'),
        bubbleFlagged: bubble2?.className.includes('ring-1 ring-amber-400')
      };
    })()`);
    console.log('Flag toggle result:', flagCheck);
    if (!flagCheck.btnHighlighted || !flagCheck.bubbleFlagged) {
      throw new Error('Flag toggle in bottom bar failed!');
    }

    // Cleanly abandon exam
    console.log('Cleanly abandoning exam...');
    await evalJs(`document.querySelector('#btn-abandon-exam')?.click()`);
    await sleep(300);
    await evalJs(`document.querySelector('#btn-confirm-abandon-exam')?.click()`);
    await sleep(800);

    // TEST 2: Topics Screen Navigation
    console.log('\n--- 2. Testing Topics Screen Navigation ---');
    await evalJs(`document.querySelector('#nav-topics')?.click()`);
    await sleep(500);

    // Open first subject
    console.log('Starting subject 1 study session...');
    await evalJs(`document.querySelectorAll('.grid > div button')[0]?.click()`);
    await sleep(600);

    const topicBarMetrics = await evalJs(`(() => {
      const bar = document.querySelector('#quiz-bottom-bar');
      if (!bar) return null;
      const rect = bar.getBoundingClientRect();
      const prev = document.querySelector('#btn-topics-prev-question');
      const next = document.querySelector('#btn-topics-next-question');
      return {
        bottom: Math.round(rect.bottom),
        windowHeight: window.innerHeight,
        hasPrev: Boolean(prev),
        hasNext: Boolean(next)
      };
    })()`);
    console.log('Topics bottom bar metrics:', topicBarMetrics);
    if (!topicBarMetrics || Math.abs(topicBarMetrics.bottom - topicBarMetrics.windowHeight) > 2) {
      throw new Error('Topics screen bottom bar not fixed properly!');
    }

    // Exit topic session
    await evalJs(`document.querySelector('button:has(.lucide-arrow-left)')?.click() || document.querySelector('button[title="Esci"]')?.click()`);
    await sleep(500);

    // TEST 3: Desktop Viewport (1440x900)
    console.log('\n--- 3. Testing Desktop Viewport (1440x900) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await evalJs(`document.querySelector('#nav-exam')?.click()`);
    await sleep(400);
    await evalJs(`document.querySelector('#btn-start-tutor-exam')?.click()`);
    await sleep(800);

    const desktopMetrics = await evalJs(`(() => {
      const bar = document.querySelector('#quiz-bottom-bar');
      const rect = bar?.getBoundingClientRect();
      return {
        exists: Boolean(bar),
        bottom: Math.round(rect?.bottom || 0),
        windowHeight: window.innerHeight,
        width: Math.round(rect?.width || 0)
      };
    })()`);
    console.log('Desktop bottom bar metrics:', desktopMetrics);
    if (!desktopMetrics.exists || Math.abs(desktopMetrics.bottom - desktopMetrics.windowHeight) > 2) {
      throw new Error('Desktop bottom bar not aligned properly!');
    }

    const ssDesktop = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/test_anchored_bottom_bar_desktop.png', Buffer.from(ssDesktop.data, 'base64'));
    console.log('Saved screenshot: public/test_anchored_bottom_bar_desktop.png');

    // Clean exit
    await evalJs(`document.querySelector('#btn-abandon-exam')?.click()`);
    await sleep(300);
    await evalJs(`document.querySelector('#btn-confirm-abandon-exam')?.click()`);
    await sleep(600);

    console.log('\nConsole error count:', errors.length);
    if (errors.length > 0) {
      console.error('Errors found:', errors);
      throw new Error(`Test failed with ${errors.length} console errors.`);
    }

    console.log('\n================================================================');
    console.log('🎉 TUTTI I TEST DELLA BARRA DI NAVIGAZIONE ANCORATA SUPERATI AL 100%!');
    console.log('================================================================');

  } finally {
    try { browser.kill(); } catch (e) {}
    try { preview.kill(); } catch (e) {}
    // Clean up temporary profile
    try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch (e) {}
  }
}

run().catch(err => {
  console.error('\n❌ TEST FALLITO:', err);
  process.exit(1);
});
