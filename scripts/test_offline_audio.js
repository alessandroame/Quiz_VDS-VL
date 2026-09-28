// Interactive CDP Verification for Offline Audio Download & Fallback
import { spawn } from 'child_process';
import http from 'http';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🏁 Collaudo Gestione Offline Audio (CDP)...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const cdpPort = 9228;

  const preview = spawn('npx', ['vite', 'preview', '--port', '5173'], {
    shell: true,
    stdio: 'ignore'
  });

  // Wait for preview server
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://localhost:5173/');
      if (res.ok) break;
    } catch {
      await sleep(250);
    }
  }
  await sleep(500);

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--autoplay-policy=no-user-gesture-required',
    'about:blank'
  ]);

  try {
    await sleep(2000);

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
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const wsUrl = pageTarget.webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    const callbacks = new Map();
    const consoleErrors = [];

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        const text = msg.params.args.map((a) => a.value || a.description).join(' ');
        consoleErrors.push(text);
      }
      if (callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg);
      }
    });

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = msgId++;
        callbacks.set(id, res => {
          if (res.error) reject(res.error);
          else resolve(res.result);
        });
        ws.send(JSON.stringify({ id, method, params }));
      });

    const evalJs = async expr => {
      const res = await send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true
      });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result.value;
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2000);

    console.log('1️⃣ Navigazione alla home page completata.');

    // 1. Click Drive Mode button
    const driveBtnExists = await evalJs('Boolean(document.getElementById("btn-drive-mode"))');
    console.log(`2️⃣ Pulsante Modalità Guida presente: ${driveBtnExists}`);
    if (!driveBtnExists) throw new Error('btn-drive-mode not found');

    await evalJs('document.getElementById("btn-drive-mode").click()');
    await sleep(800);

    // 2. Check if AudioOfflinePromptModal opened
    const promptModalTitle = await evalJs(
      'document.getElementById("audio-offline-title")?.innerText || null'
    );
    console.log(`3️⃣ Modale prompt audio presente con titolo: "${promptModalTitle}"`);
    if (!promptModalTitle || !promptModalTitle.includes('Audio Offline')) {
      throw new Error(`Expected prompt modal title, got: ${promptModalTitle}`);
    }

    // 3. Dismiss prompt via "Non ora"
    await evalJs('document.getElementById("btn-dismiss-audio-prompt").click()');
    await sleep(600);

    const isPromptDismissed = await evalJs(
      'document.getElementById("audio-offline-title") === null'
    );
    console.log(`4️⃣ Modale prompt audio chiuso con successo: ${isPromptDismissed}`);

    // 4. Exit drive mode
    await evalJs('document.getElementById("btn-drive-exit")?.click()');
    await sleep(600);

    // 5. Open Settings Modal
    console.log('5️⃣ Apertura Impostazioni...');
    await evalJs('document.getElementById("btn-settings")?.click()');
    await sleep(600);

    // Click on "Voce" tab in Settings
    const switchedToVoiceTab = await evalJs(`(() => {
      const tab = document.getElementById('tab-voice');
      if (tab) { tab.click(); return true; }
      return false;
    })()`);
    console.log(`6️⃣ Scheda Voce selezionata: ${switchedToVoiceTab}`);
    await sleep(600);

    // 6. Verify Offline Audio section in Settings
    const hasOfflineAudioSection = await evalJs(`(() => {
      return document.body.innerText.includes('Archivio Audio Offline (PWA)');
    })()`);
    console.log(`7️⃣ Sezione Archivio Audio Offline presente: ${hasOfflineAudioSection}`);
    if (!hasOfflineAudioSection) throw new Error('Offline audio section not found in Voce tab');

    const hasGiuseppeDownloadBtn = await evalJs(
      'Boolean(document.getElementById("btn-download-giuseppe"))'
    );
    const hasElsaDownloadBtn = await evalJs(
      'Boolean(document.getElementById("btn-download-elsa"))'
    );
    const hasResetPromptBtn = await evalJs(
      'Boolean(document.getElementById("btn-reset-audio-prompt"))'
    );

    console.log(`8️⃣ Pulsante Scarica Giuseppe presente: ${hasGiuseppeDownloadBtn}`);
    console.log(`   Pulsante Scarica Elsa presente: ${hasElsaDownloadBtn}`);
    console.log(`   Pulsante Ripristina Avviso presente: ${hasResetPromptBtn}`);

    if (!hasGiuseppeDownloadBtn || !hasElsaDownloadBtn) {
      throw new Error('Download buttons missing in Settings');
    }

    // 7. Verify console errors
    console.log('9️⃣ Verifica errori console JavaScript...');
    const relevantErrors = consoleErrors.filter(
      err => !err.includes('favicon') && !err.includes('Google')
    );
    console.log(`   Errori rilevati: ${relevantErrors.length}`);
    if (relevantErrors.length > 0) {
      console.warn('Console errors:', relevantErrors);
      throw new Error('Unexpected console errors during test');
    }

    console.log('✅ TUTTI I COLLAUDI OFFLINE AUDIO SUPERATI CON SUCCESSO!');
    ws.close();
  } finally {
    chromeProc.kill();
    preview.kill();
  }
}

runTest().catch(err => {
  console.error('❌ Test fallito:', err);
  process.exit(1);
});
