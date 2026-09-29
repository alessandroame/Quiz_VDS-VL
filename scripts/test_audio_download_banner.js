// scripts/test_audio_download_banner.js
// Tests the AudioDownloadBanner at bottom on mobile portrait during an active exam
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

async function testAudioDownloadBanner() {
  const targetUrl = 'http://localhost:5173';
  const outputPath = path.join(process.cwd(), 'public', 'audio_download_banner_screenshot.png');
  const port = 9333;
  const tempProfile = path.join(os.tmpdir(), `chrome_quiz_banner_${port}`);

  const browser = spawn(BROWSER_BIN, [
    '--headless=new',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-webgl',
    '--enable-webgl',
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

    if (!wsUrl) throw new Error('Cannot connect to CDP');

    const ws = new globalThis.WebSocket(wsUrl);
    let msgId = 1;
    const pending = new Map();

    const send = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    await new Promise(r => ws.onopen = r);

    // Emulate Mobile iPhone 390x844
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.enable');
    await send('Page.navigate', { url: targetUrl });
    await sleep(2000);

    // Start exam by clicking "Avvia Simulazione Esame" or "Avvia Simulazione Didattica"
    console.log('Avvio simulazione per riprodurre lo stato della screenshot utente...');
    await send('Runtime.evaluate', {
      expression: `
        (async () => {
          // Find button to start tutor or official exam
          const buttons = Array.from(document.querySelectorAll('button'));
          const startBtn = buttons.find(b => b.textContent && (b.textContent.includes('Avvia Simulazione') || b.textContent.includes('Simulazione')));
          if (startBtn) startBtn.click();
        })()
      `,
      awaitPromise: true
    });
    await sleep(1000);

    // Trigger synthetic audio download status (40%) to simulate background download
    console.log('Simulazione stato download audio (40%)...');
    const evalRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const res = {
            hasManager: Boolean(window.audioDownloadManager),
            statusesBefore: window.audioDownloadManager ? window.audioDownloadManager.getAllStatuses() : null
          };
          if (window.audioDownloadManager) {
            window.audioDownloadManager.statuses.giuseppe = {
              voice: 'giuseppe',
              downloadedCount: 1008,
              totalCount: 2520,
              percent: 40,
              isDownloading: true,
              isComplete: false,
              error: null
            };
            window.audioDownloadManager.notify();
          }
          return res;
        })()
      `,
      returnByValue: true
    });
    console.log('Eval manager:', evalRes.result.value);
    await sleep(800);

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(outputPath, Buffer.from(shot.data, 'base64'));
    console.log(`Screenshot salvato con successo: ${outputPath}`);

    // Check if horizontal overflow exists
    const overflowCheck = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const bodyWidth = document.body.getBoundingClientRect().width;
          const scrollWidth = document.documentElement.scrollWidth;
          const innerWidth = window.innerWidth;
          const banner = document.getElementById('audio-download-bottom-banner');
          return {
            bodyWidth,
            scrollWidth,
            innerWidth,
            hasBanner: Boolean(banner),
            bannerText: banner ? banner.innerText : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Verifica Overflow e Banner:', overflowCheck.result.value);

    ws.close();
  } finally {
    browser.kill('SIGTERM');
  }
}

testAudioDownloadBanner().catch(console.error);
