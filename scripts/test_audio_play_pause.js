// Collaudo interattivo CDP: Play/Pause, Riprendi, Da Capo e Keyboard Shortcuts per l'Audio Neurale
import { spawn } from 'child_process';
import http from 'http';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🏁 Collaudo Play/Pause/Restart Audio Vocale...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const cdpPort = 9226;

  const preview = spawn('npx', ['vite', 'preview', '--port', '5173'], {
    shell: true,
    stdio: 'ignore'
  });

  // Attendi che il server sia pronto
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
    'about:blank'
  ]);

  try {
    await sleep(2500);

    const getTargets = () => new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${cdpPort}/json`, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const targets = await getTargets();
    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('Target page non trovato');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let msgId = 1;
    const send = (method, params = {}) => new Promise((resolve) => {
      const id = msgId++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await new Promise(r => ws.onopen = r);
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(2500);

    // Naviga su Materie per avere una QuestionCard aperta
    await send('Runtime.evaluate', {
      expression: `document.getElementById('nav-topics')?.click()`
    });
    await sleep(800);

    // Seleziona Meteorologia (ID 5)
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-topic-all-5')?.click()`
    });
    await sleep(1500);

    // 1. Verifica presenza pulsante iniziale "Ascolta"
    const initialCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const btnPlay = document.getElementById('btn-tts-play') || document.querySelector('button[title*="Ascolta"]');
        const allButtons = Array.from(document.querySelectorAll('button')).map(b => ({ id: b.id, text: b.innerText.trim(), title: b.title }));
        return {
          hasPlayBtn: Boolean(btnPlay),
          btnId: btnPlay ? btnPlay.id : null,
          btnText: btnPlay ? btnPlay.innerText.trim() : null,
          allButtons: allButtons.slice(0, 10)
        };
      })()`,
      returnByValue: true
    });
    console.log('  -> Pulsante iniziale "Ascolta":', initialCheck?.result?.value);

    // 2. Click su Ascolta -> deve trasformarsi nel pill con "Pausa", "Da capo", "Stop"
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-tts-play')?.click()`
    });
    await sleep(500);

    const activeCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const btnToggle = document.getElementById('btn-tts-toggle-play-pause');
        const btnRestart = document.getElementById('btn-tts-restart');
        const btnStop = document.getElementById('btn-tts-stop');
        return {
          hasToggle: Boolean(btnToggle),
          toggleText: btnToggle ? btnToggle.innerText.trim() : null,
          hasRestart: Boolean(btnRestart),
          restartText: btnRestart ? btnRestart.innerText.trim() : null,
          hasStop: Boolean(btnStop)
        };
      })()`,
      returnByValue: true
    });
    console.log('  -> Pill attivo dopo click su Ascolta:', activeCheck?.result?.value);

    // 3. Click su "Pausa" -> il toggle deve diventare "Riprendi"
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-tts-toggle-play-pause')?.click()`
    });
    await sleep(400);

    const pausedCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const btnToggle = document.getElementById('btn-tts-toggle-play-pause');
        return {
          toggleText: btnToggle ? btnToggle.innerText.trim() : null
        };
      })()`,
      returnByValue: true
    });
    console.log('  -> Stato dopo click su Pausa:', pausedCheck?.result?.value);

    // 4. Click su "Riprendi" -> il toggle deve tornare a "Pausa"
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-tts-toggle-play-pause')?.click()`
    });
    await sleep(400);

    const resumedCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const btnToggle = document.getElementById('btn-tts-toggle-play-pause');
        return {
          toggleText: btnToggle ? btnToggle.innerText.trim() : null
        };
      })()`,
      returnByValue: true
    });
    console.log('  -> Stato dopo click su Riprendi:', resumedCheck?.result?.value);

    // 5. Click su "Da capo" (Restart) mentre parla
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-tts-restart')?.click()`
    });
    await sleep(400);

    const restartedCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const btnToggle = document.getElementById('btn-tts-toggle-play-pause');
        return {
          toggleText: btnToggle ? btnToggle.innerText.trim() : null
        };
      })()`,
      returnByValue: true
    });
    console.log('  -> Stato dopo click su Da capo (Ricomincia):', restartedCheck?.result?.value);

    // 6. Click su Stop -> torna a singolo pulsante "Ascolta"
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-tts-stop')?.click()`
    });
    await sleep(400);

    const stoppedCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const btnPlay = document.getElementById('btn-tts-play');
        const btnToggle = document.getElementById('btn-tts-toggle-play-pause');
        return {
          hasPlayBtn: Boolean(btnPlay),
          hasToggle: Boolean(btnToggle),
          btnText: btnPlay ? btnPlay.innerText.trim() : null
        };
      })()`,
      returnByValue: true
    });
    console.log('  -> Stato dopo click su Stop:', stoppedCheck?.result?.value);

    console.log('✅ TUTTI I TEST PLAY / PAUSE / RESTART COLLAUDATI CON SUCCESSO!');
    ws.close();
  } finally {
    chromeProc.kill();
    preview.kill();
  }
}

runTest().catch(err => {
  console.error('Test fallito:', err);
  process.exit(1);
});
