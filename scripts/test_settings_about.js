import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';

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
  const cdpPort = 9227;
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
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    console.log('[1] Caricamento applicazione su http://localhost:5173...');
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await sleep(2000);

    console.log('[2] Apertura Modale Impostazioni...');
    const evalOpenSettings = await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('button[aria-label="Impostazioni"]') || 
                    document.querySelector('button:has(svg.lucide-settings)') ||
                    Array.from(document.querySelectorAll('button')).find(b => b.innerHTML.includes('lucide-settings'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true
    });
    console.log('   Pulsante impostazioni cliccato:', evalOpenSettings.result.value);
    await sleep(500);

    console.log('[3] Selezione Tab "About"...');
    const evalClickAbout = await send('Runtime.evaluate', {
      expression: `(() => {
        const tabAbout = document.getElementById('tab-about');
        if (tabAbout) {
          tabAbout.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true
    });
    console.log('   Tab About cliccato:', evalClickAbout.result.value);
    await sleep(500);

    console.log('[4] Verifica contenuti visualizzati nella scheda About...');
    const evalAboutContent = await send('Runtime.evaluate', {
      expression: `(() => {
        const text = document.body.innerText;
        return {
          hasTitle: text.includes('VDS-VL Quiz Master'),
          hasVersion: text.includes('v1.0.0'),
          hasDpr: text.includes('D.P.R. 133/2010'),
          has504: text.includes('504 Quiz'),
          hasRules: text.includes('30 Quiz · 45 Minuti'),
          hasThreshold: text.includes('Max 3 errori'),
          hasOffline: text.includes('Funzionamento Offline')
        };
      })()`,
      returnByValue: true
    });
    console.log('   Dettagli About verificati:', JSON.stringify(evalAboutContent.result.value, null, 2));

    const allPassed = Object.values(evalAboutContent.result.value).every(Boolean);
    if (!allPassed) {
      throw new Error('Alcuni contenuti della scheda About non sono stati trovati nel DOM');
    }

    console.log('[5] Cattura screenshot di collaudo visivo (Mobile 390x844)...');
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/test_settings_about_screenshot.png', Buffer.from(screenshot.data, 'base64'));
    console.log('   Screenshot salvato in public/test_settings_about_screenshot.png');

    console.log('[6] Verifica errori console...');
    if (errors.length > 0) {
      console.warn('   Errori rilevati in console:', errors);
      throw new Error('Rilevati errori JavaScript in console durante il test');
    } else {
      console.log('   0 errori in console JavaScript! Test superato con successo.');
    }

    ws.close();
  } finally {
    chromeProc.kill();
  }
}

main().catch(err => {
  console.error('Test fallito:', err);
  process.exit(1);
});
