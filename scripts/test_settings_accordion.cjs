// Interactive CDP Test for Single-Open Accordion Settings Modal
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const chromePath = chromePaths.find(p => fs.existsSync(p));
if (!chromePath) {
  console.error('Browser non trovato');
  process.exit(1);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const cdpPort = 9230;

  // Start preview server if not running
  let previewProc = null;
  try {
    const res = await fetch('http://localhost:5173/');
    if (!res.ok) throw new Error('Not ok');
    console.log('Preview server già attivo.');
  } catch {
    console.log('Avvio vite preview su porta 5173...');
    previewProc = spawn('npx', ['vite', 'preview', '--port', '5173'], {
      shell: true,
      stdio: 'ignore'
    });
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch('http://localhost:5173/');
        if (res.ok) break;
      } catch {
        await sleep(250);
      }
    }
  }

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
    if (!pageTarget) throw new Error('Target page non trovato');

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

    const errors = [];
    ws.addEventListener('message', event => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        errors.push(msg.params.args.map(a => a.value || a.description).join(' '));
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');

    // 1. Mobile Portrait (390x844)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log('[1] Navigazione su http://localhost:5173...');
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await sleep(2000);

    console.log('[2] Apertura Modale Impostazioni...');
    const evalOpen = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('btn-settings') ||
                    document.querySelector('button[aria-label="Impostazioni"]');
        if (btn) { btn.click(); return true; }
        return false;
      })()`,
      returnByValue: true
    });
    if (!evalOpen.result.value) throw new Error('Pulsante impostazioni non trovato');
    await sleep(600);

    console.log('[3] Verifica Struttura Accordion Singolo (6 Sezioni)...');
    const evalAccordion = await send('Runtime.evaluate', {
      expression: `(() => {
        const tabs = Array.from(document.querySelectorAll('[id^="tab-"]')).map(btn => ({
          id: btn.id,
          expanded: btn.getAttribute('aria-expanded'),
          text: btn.innerText.replace(/\\s+/g, ' ').trim()
        }));
        const hasCollapseAll = Boolean(document.getElementById('btn-settings-collapse-all'));
        const modal = document.querySelector('div[role="dialog"][aria-label="Impostazioni"]');
        return {
          totalTabs: tabs.length,
          tabs,
          hasCollapseAll,
          isModalOpen: Boolean(modal)
        };
      })()`,
      returnByValue: true
    });
    console.log('   Stato rilevato:', JSON.stringify(evalAccordion.result.value, null, 2));
    const accData = evalAccordion.result.value;
    if (accData.totalTabs !== 6) {
      throw new Error(`Attese 6 schede accordion, trovate: ${accData.totalTabs}`);
    }
    const appTab = accData.tabs.find(t => t.id === 'tab-appearance');
    if (!appTab || appTab.expanded !== 'true') {
      throw new Error('La sezione Aspetto non è aperta di default');
    }

    console.log('[4] Cattura screenshot Mobile Portrait con Sezione 1 aperta...');
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/test_settings_accordion_mobile_open.png', Buffer.from(shot1.data, 'base64'));

    console.log('[5] Test "Comprimi tutto" (collasso totale delle sezioni)...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-settings-collapse-all')?.click()`
    });
    await sleep(400);

    const evalAllCollapsed = await send('Runtime.evaluate', {
      expression: `(() => {
        const tabs = Array.from(document.querySelectorAll('[id^="tab-"]')).map(btn => btn.getAttribute('aria-expanded'));
        const hasExpandFirst = Boolean(document.getElementById('btn-settings-expand-first'));
        const allClosed = tabs.every(exp => exp === 'false');
        return { allClosed, hasExpandFirst, count: tabs.length };
      })()`,
      returnByValue: true
    });
    console.log('   Tutte le sezioni collassate:', evalAllCollapsed.result.value);
    if (!evalAllCollapsed.result.value.allClosed || !evalAllCollapsed.result.value.hasExpandFirst) {
      throw new Error('Comprimi tutto non ha chiuso tutte le sezioni');
    }

    console.log('[6] Cattura screenshot Mobile Portrait compresso al 100%...');
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/test_settings_accordion_mobile_all_collapsed.png', Buffer.from(shot2.data, 'base64'));

    console.log('[7] Test Mutua Esclusione: apertura Sezione Voce...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('tab-voice')?.click()`
    });
    await sleep(400);

    const evalVoiceExclusive = await send('Runtime.evaluate', {
      expression: `(() => {
        const voiceExp = document.getElementById('tab-voice')?.getAttribute('aria-expanded');
        const appExp = document.getElementById('tab-appearance')?.getAttribute('aria-expanded');
        const hasVoiceControls = Boolean(document.getElementById('btn-download-giuseppe'));
        return { voiceExp, appExp, hasVoiceControls };
      })()`,
      returnByValue: true
    });
    console.log('   Stato mutua esclusione (Voce aperta, Aspetto chiusa):', evalVoiceExclusive.result.value);
    if (evalVoiceExclusive.result.value.voiceExp !== 'true' || evalVoiceExclusive.result.value.appExp !== 'false') {
      throw new Error('Violata la mutua esclusione dell\'accordion');
    }

    console.log('[8] Apertura Sezione About e verifica contenuti informativi...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('tab-about')?.click()`
    });
    await sleep(400);

    const evalAbout = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        return {
          aboutExp: document.getElementById('tab-about')?.getAttribute('aria-expanded'),
          voiceExp: document.getElementById('tab-voice')?.getAttribute('aria-expanded'),
          hasTitle: text.includes('VDS-VL Quiz Master'),
          hasVersion: text.includes('v1.0.0'),
          hasDpr: text.includes('D.P.R. 133/2010'),
          has504: text.includes('504 Quiz'),
          hasRules: text.includes('30 Quiz · 45 Minuti'),
          hasThreshold: text.includes('Max 3 errori')
        };
      })()`,
      returnByValue: true
    });
    console.log('   Dettagli About:', JSON.stringify(evalAbout.result.value, null, 2));
    const aboutCheck = evalAbout.result.value;
    if (aboutCheck.aboutExp !== 'true' || aboutCheck.voiceExp !== 'false' || !aboutCheck.hasTitle) {
      throw new Error('Sezione About non visualizzata correttamente');
    }

    // 2. Desktop Test (1440x900)
    console.log('[9] Passaggio a risoluzione Desktop (1440x900)...');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await sleep(400);

    console.log('[10] Apertura Sezione Modalità Guida su Desktop...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('tab-drive')?.click()`
    });
    await sleep(400);

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/test_settings_accordion_desktop.png', Buffer.from(shot3.data, 'base64'));
    console.log('    Screenshot Desktop salvato in public/test_settings_accordion_desktop.png');

    console.log('[11] Test chiusura impostazioni con pulsante Indietro...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-close-settings')?.click()`
    });
    await sleep(400);

    const evalClosed = await send('Runtime.evaluate', {
      expression: `Boolean(document.querySelector('div[role="dialog"][aria-label="Impostazioni"]'))`,
      returnByValue: true
    });
    if (evalClosed.result.value) {
      throw new Error('La modale non si è chiusa correttamente');
    }

    console.log('[12] Verifica errori console JavaScript...');
    if (errors.length > 0) {
      console.warn('   Errori rilevati in console:', errors);
      throw new Error('Rilevati errori JavaScript in console durante il test');
    } else {
      console.log('   0 errori in console JavaScript! Test Accordion superato al 100%.');
    }

    ws.close();
  } finally {
    chromeProc.kill();
    if (previewProc) previewProc.kill();
  }
}

main().catch(err => {
  console.error('Test fallito:', err);
  process.exit(1);
});
