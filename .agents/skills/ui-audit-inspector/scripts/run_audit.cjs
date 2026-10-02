// .agents/skills/ui-audit-inspector/scripts/run_audit.cjs
// Automated UI Audit runner with deduplication across viewports, visual callout boxes (dashed rectangle + arrow), and Lightbox.

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

const VIEWPORTS = [
  { name: 'mobile-portrait', label: 'Mobile Portrait (390x844)', width: 390, height: 844, scale: 2, isMobile: true },
  { name: 'tablet-portrait', label: 'Tablet Portrait (768x1024)', width: 768, height: 1024, scale: 2, isMobile: false },
  { name: 'tablet-landscape', label: 'Tablet Landscape (1024x768)', width: 1024, height: 768, scale: 2, isMobile: false },
  { name: 'desktop', label: 'Desktop (1440x900)', width: 1440, height: 900, scale: 1, isMobile: false }
];

const REPORTS_DIR = path.join(process.cwd(), 'audit_reports');
const SHOTS_DIR = path.join(REPORTS_DIR, 'screenshots');

if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

function formatTimestamp(d = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${YYYY}-${MM}-${DD}_${hh}-${mm}-${ss}`;
}

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

// Banned words & phrases for vocabulary unification and anti-cosplay
const BANNED_PATTERNS = [
  { word: 'cruscotto aeronautico', reason: 'Cosplay e gergo superfluo. Home è la Home.' },
  { word: 'cruscotto', reason: 'Cosplay e gergo superfluo. Sostituire con Home o Panoramica.' },
  { word: 'cockpit', reason: 'Anglicismo cosplay superfluo in interfaccia italiana di studio.' },
  { word: 'plancia', reason: 'Metafora aeronautica superflua.' },
  { word: 'decolla', reason: 'Flavor text narrativo superfluo. Usare il verbo Inizia.' },
  { word: 'avvia', reason: 'Sinonimo incoerente con lo standard univoco "Inizia".' },
  { word: 'comincia', reason: 'Sinonimo incoerente con lo standard univoco "Inizia".' },
  { word: 'cominciarne', reason: 'Sinonimo incoerente con lo standard univoco "Inizia".' },
  { word: 'ottimo lavoro', reason: 'Tono autocelebrativo/paternalistico non necessario.' },
  { word: 'fantastico', reason: 'Stile enfatico da televendita.' },
  { word: 'in viaggio verso il decollo', reason: 'Storytelling narrativo superfluo nella schermata di download.' },
  { word: 'rimani nel quiz', reason: 'Frase prolissa per il semplice comando "Continua".' },
  { word: 'metti in pausa (riprendi più tardi)', reason: 'Parentesi esplicativa ovvia. Usare solo "Pausa".' }
];

async function runAudit() {
  const timestamp = formatTimestamp();
  const reportHtmlFilename = `audit_report_${timestamp}.html`;
  const reportHtmlPath = path.join(REPORTS_DIR, reportHtmlFilename);

  console.log('===========================================================');
  console.log(`🚀 UI AUDIT INSPECTOR - Generazione Report Accorpato: ${reportHtmlFilename}`);
  console.log('===========================================================\n');

  if (!BROWSER_BIN) {
    console.error('ERRORE: Nessun browser Chrome/Edge rilevato.');
    process.exit(1);
  }

  const port = 9355 + Math.floor(Math.random() * 200);
  const tempProfile = path.join(os.tmpdir(), `chrome_ui_audit_${port}`);

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

  let ws = null;
  const rawFindings = [];
  const capturedScreenshots = {};

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

    if (!wsUrl) throw new Error('Impossibile agganciare CDP');

    ws = new WebSocket(wsUrl);
    await new Promise(res => ws.onopen = res);

    let id = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id && pending.has(data.id)) {
          const { resolve, reject } = pending.get(data.id);
          pending.delete(data.id);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      } catch (e) {}
    };

    function send(method, params = {}, timeoutMs = 15000) {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        const timer = setTimeout(() => {
          if (pending.has(msgId)) {
            pending.delete(msgId);
            reject(new Error(`Timeout CDP: ${method}`));
          }
        }, timeoutMs);
        pending.set(msgId, {
          resolve: (res) => { clearTimeout(timer); resolve(res); },
          reject: (err) => { clearTimeout(timer); reject(err); }
        });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });

    // Client-side inspection function with element bounding box coordinates
    const auditClientFunction = `
      (() => {
        function getLuminance(r, g, b) {
          const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
        }

        function parseColor(str) {
          if (!str || str === 'transparent' || str === 'inherit') return null;
          const m = str.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
          if (!m) return null;
          const alpha = m[4] !== undefined ? parseFloat(m[4]) : 1;
          if (alpha < 0.1) return null;
          return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]), a: alpha };
        }

        function getEffectiveBg(el) {
          let curr = el;
          while (curr && curr !== document.documentElement) {
            const bg = window.getComputedStyle(curr).backgroundColor;
            const parsed = parseColor(bg);
            if (parsed && parsed.a > 0.5) return parsed;
            curr = curr.parentElement;
          }
          const isLight = document.documentElement.classList.contains('light');
          return isLight ? { r: 248, g: 250, b: 252, a: 1 } : { r: 9, g: 9, b: 11, a: 1 };
        }

        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        const docScrollWidth = document.documentElement.scrollWidth;
        const rootOverflow = docScrollWidth > winWidth + 1;

        // Helper for bounded percentages
        function getRectPct(rect) {
          const leftPct = Math.max(0, Math.min(98, (rect.left / winWidth) * 100));
          const topPct = Math.max(0, Math.min(98, (rect.top / winHeight) * 100));
          const widthPct = Math.max(2, Math.min(100 - leftPct, (rect.width / winWidth) * 100));
          const heightPct = Math.max(1.5, Math.min(100 - topPct, (rect.height / winHeight) * 100));
          return {
            leftPct: Math.round(leftPct * 10) / 10,
            topPct: Math.round(topPct * 10) / 10,
            widthPct: Math.round(widthPct * 10) / 10,
            heightPct: Math.round(heightPct * 10) / 10
          };
        }

        // 1. Element Overflows
        const overflowElements = [];
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          if (['SCRIPT', 'STYLE', 'path', 'defs'].includes(el.tagName)) continue;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          
          if (rect.right > winWidth + 2) {
            let parent = el.parentElement;
            let clipped = false;
            while (parent && parent !== document.body) {
              const overflowX = window.getComputedStyle(parent).overflowX;
              if (['hidden', 'scroll', 'auto', 'clip'].includes(overflowX)) {
                clipped = true;
                break;
              }
              parent = parent.parentElement;
            }
            if (!clipped) {
              overflowElements.push({
                tag: el.tagName,
                id: el.id || '',
                className: (el.className || '').toString().slice(0, 80),
                text: (el.innerText || el.textContent || '').trim().slice(0, 40),
                rect: getRectPct(rect)
              });
            }
          }
        }

        // 2. WCAG Contrast Check
        const contrastIssues = [];
        const checkedTexts = new Set();
        for (const el of allElements) {
          if (['SCRIPT', 'STYLE', 'path', 'defs'].includes(el.tagName)) continue;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

          let directText = '';
          for (const child of el.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) directText += child.textContent;
          }
          directText = directText.trim();
          if (!directText || directText.length < 2 || checkedTexts.has(directText)) continue;
          checkedTexts.add(directText);

          const fg = parseColor(style.color);
          const bg = getEffectiveBg(el);
          if (fg && bg) {
            const l1 = getLuminance(fg.r, fg.g, fg.b);
            const l2 = getLuminance(bg.r, bg.g, bg.b);
            const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

            const fontSize = parseFloat(style.fontSize) || 14;
            const isBold = parseInt(style.fontWeight) >= 600 || style.fontWeight === 'bold';
            const minRatio = (fontSize >= 18 || (fontSize >= 14 && isBold)) ? 3.0 : 4.5;

            if (ratio < minRatio) {
              const rect = el.getBoundingClientRect();
              contrastIssues.push({
                text: directText.slice(0, 45),
                tag: el.tagName,
                id: el.id || '',
                colorHex: '#' + [fg.r, fg.g, fg.b].map(x => x.toString(16).padStart(2, '0')).join(''),
                bgHex: '#' + [bg.r, bg.g, bg.b].map(x => x.toString(16).padStart(2, '0')).join(''),
                ratio: Math.round(ratio * 100) / 100,
                requiredRatio: minRatio,
                rect: getRectPct(rect)
              });
            }
          }
        }

        // 3. Scan Visible Text for Banned Words with Element Coordinates
        const bannedFindings = [];
        const bannedList = ${JSON.stringify(BANNED_PATTERNS)};

        for (const el of allElements) {
          if (['SCRIPT', 'STYLE', 'path', 'defs'].includes(el.tagName)) continue;
          const directText = (el.innerText || '').trim();
          if (!directText) continue;
          const lowerText = directText.toLowerCase();

          for (const item of bannedList) {
            if (lowerText.includes(item.word)) {
              // Avoid duplicate matches on parent containers
              let childMatched = false;
              for (const child of el.children) {
                if ((child.innerText || '').toLowerCase().includes(item.word)) {
                  childMatched = true;
                  break;
                }
              }
              if (!childMatched) {
                const rect = el.getBoundingClientRect();
                bannedFindings.push({
                  word: item.word,
                  snippet: directText.slice(0, 50).replace(/\\s+/g, ' '),
                  reason: item.reason,
                  rect: getRectPct(rect)
                });
              }
            }
          }
        }

        return {
          winWidth,
          winHeight,
          docScrollWidth,
          rootOverflow,
          overflowElements: overflowElements.slice(0, 10),
          contrastIssues: contrastIssues.slice(0, 20),
          bannedFindings
        };
      })()
    `;

    const scenarios = [
      { id: 'home', name: 'Home', selector: null },
      { id: 'tutor_intro', name: 'Tutor', selector: '#btn-home-tutor' },
      { id: 'exam_intro', name: 'Esame', selector: '#btn-nav-back-home, #btn-home-exam' },
      { id: 'exam_running', name: 'Esame in Corso', selector: '#btn-start-exam' },
      { id: 'interrupt_modal', name: 'Modal Interruzione', selector: '#btn-abandon-exam' },
      { id: 'topics', name: 'Materie', selector: '#btn-interrupt-resume, #btn-nav-back-home, #btn-home-topics' },
      { id: 'mistakes', name: 'Errori', selector: '#btn-nav-back-home, #btn-home-mistakes' },
      { id: 'archive', name: 'Archivio', selector: '#btn-nav-back-home, #btn-home-archive' },
      { id: 'stats', name: 'Statistiche', selector: '#btn-nav-back-home, #btn-home-stats' },
      { id: 'settings', name: 'Impostazioni', selector: '#btn-nav-back-home, #btn-settings' }
    ];

    for (const vp of VIEWPORTS) {
      console.log(`📱 Scansione Viewport: ${vp.label}...`);

      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.scale,
        mobile: vp.isMobile,
        screenOrientation: { type: 'portraitPrimary', angle: 0 }
      });

      for (const theme of ['dark', 'light']) {
        await send('Page.navigate', { url: 'http://localhost:5173' });
        await sleep(1200);

        await send('Runtime.evaluate', {
          expression: `
            (() => {
              if ('${theme}' === 'light') {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
              } else {
                document.documentElement.classList.remove('light');
                document.documentElement.classList.add('dark');
              }
              try { localStorage.setItem('theme', '${theme}'); } catch(e){}
            })()
          `
        });
        await sleep(150);

        for (const sc of scenarios) {
          if (sc.selector) {
            const sels = sc.selector.split(',').map(s => s.trim());
            for (const s of sels) {
              await send('Runtime.evaluate', {
                expression: `
                  (() => {
                    const el = document.querySelector('${s}');
                    if (el) el.click();
                  })()
                `
              });
              await sleep(200);
            }
          }

          await sleep(250);

          const shotKey = `${vp.name}_${theme}_${sc.id}.png`;
          const shotPath = path.join(SHOTS_DIR, shotKey);
          const shotData = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(shotPath, Buffer.from(shotData.data, 'base64'));
          capturedScreenshots[`${vp.name}_${theme}_${sc.id}`] = `screenshots/${shotKey}`;

          const evalRes = await send('Runtime.evaluate', {
            expression: auditClientFunction,
            returnByValue: true
          });

          if (evalRes && evalRes.result && evalRes.result.value) {
            rawFindings.push({
              viewport: vp.name,
              viewportLabel: vp.label,
              theme,
              screenId: sc.id,
              screenName: sc.name,
              shotKey,
              shotRelPath: `screenshots/${shotKey}`,
              ...evalRes.result.value
            });
          }
        }
      }
    }

    // DEDUPLICATION & GROUPING: Merge common defects across resolutions into single items
    console.log('\n🔄 Accorpamento intelligente dei problemi comuni tra le risoluzioni...');
    const cataloguedIssues = [];
    let contrastSeq = 1;
    let clutterSeq = 1;
    let copySeq = 1;
    let overflowSeq = 1;

    // Helper to format viewport badge
    function formatViewportsBadge(viewportsSet) {
      if (viewportsSet.size >= 4) return 'Comune a Tutti i Viewport';
      const names = Array.from(viewportsSet).map(v => {
        if (v.includes('Mobile')) return 'Mobile';
        if (v.includes('Tablet Portrait')) return 'Tablet (P)';
        if (v.includes('Tablet Landscape')) return 'Tablet (L)';
        if (v.includes('Desktop')) return 'Desktop';
        return v;
      });
      return names.join(' • ');
    }

    // 1. Group Contrast Issues by (normalized text + colorHex + bgHex + theme)
    const contrastGroups = new Map();
    for (const item of rawFindings) {
      for (const c of item.contrastIssues) {
        // Normalize text by removing numbers in parens like "Tutte (40)" -> "Tutte (X)"
        const normText = c.text.replace(/\(\d+\)/g, '(X)').replace(/#\d{4}/g, '#ID').trim();
        const groupKey = `${normText}_${c.colorHex}_${c.bgHex}_${item.theme}`;

        if (!contrastGroups.has(groupKey)) {
          contrastGroups.set(groupKey, {
            sample: c,
            normText,
            colorHex: c.colorHex,
            bgHex: c.bgHex,
            ratio: c.ratio,
            requiredRatio: c.requiredRatio,
            theme: item.theme.toUpperCase(),
            screens: new Set([item.screenName]),
            viewports: new Set([item.viewportLabel]),
            bestShotRelPath: item.shotRelPath,
            rect: c.rect
          });
        } else {
          const g = contrastGroups.get(groupKey);
          g.screens.add(item.screenName);
          g.viewports.add(item.viewportLabel);
          // Prefer mobile portrait shot for display if available
          if (item.viewport === 'mobile-portrait' && c.rect) {
            g.bestShotRelPath = item.shotRelPath;
            g.rect = c.rect;
          }
        }
      }
    }

    for (const [_, g] of contrastGroups) {
      let sev = 'MEDIO';
      if (g.ratio < 2.0) sev = 'CRITICO';
      else if (g.ratio < 3.2) sev = 'ALTO';

      cataloguedIssues.push({
        id: `CONTRAST-${String(contrastSeq++).padStart(2, '0')}`,
        category: 'Contrasto',
        severity: sev,
        title: `Contrasto insufficiente per "${g.normText}" (${g.ratio}:1)`,
        screens: Array.from(g.screens).join(', '),
        viewportsText: formatViewportsBadge(g.viewports),
        theme: g.theme,
        shotRelPath: g.bestShotRelPath,
        rect: g.rect,
        description: `Il testo "${g.normText}" ha colore ${g.colorHex} su sfondo ${g.bgHex}. Il rapporto di contrasto misurato è ${g.ratio}:1, inferiore alla soglia minima WCAG AA di ${g.requiredRatio}:1.`,
        solution: g.theme === 'LIGHT'
          ? `In Light Mode scurire il colore primario (es. usare text-amber-800 o text-slate-800 per superare 4.5:1 sotto luce solare).`
          : `In Dark Mode schiarire il testo o aumentare la luminosità del background.`
      });
    }

    // 2. Group Banned Words / Microcopy Issues by (word + snippet)
    const copyGroups = new Map();
    for (const item of rawFindings) {
      for (const b of item.bannedFindings) {
        const groupKey = `${b.word}_${b.snippet.slice(0, 25)}`;
        if (!copyGroups.has(groupKey)) {
          copyGroups.set(groupKey, {
            word: b.word,
            snippet: b.snippet,
            reason: b.reason,
            screens: new Set([item.screenName]),
            viewports: new Set([item.viewportLabel]),
            bestShotRelPath: item.shotRelPath,
            rect: b.rect
          });
        } else {
          const g = copyGroups.get(groupKey);
          g.screens.add(item.screenName);
          g.viewports.add(item.viewportLabel);
          if (item.viewport === 'mobile-portrait' && b.rect) {
            g.bestShotRelPath = item.shotRelPath;
            g.rect = b.rect;
          }
        }
      }
    }

    function getProposedCopyFix(word, snippet) {
      if (word.includes('cruscotto')) return 'Sostituire "Torna al cruscotto Home" con la sola etichetta univoca "Home".';
      if (word === 'avvia') return 'Sostituire "Avvia" con il verbo canonico "Inizia" (es. "Inizia Esame", "Inizia Tutor").';
      if (word === 'ottimo lavoro') return 'Rimuovere l\'elogio paternalistico e riportare solo il dato oggettivo: "Nessun errore da ripassare."';
      if (word.includes('comincia')) return 'Sostituire con il verbo standard "Inizia" (es. "Iniziarne una nuova").';
      if (word.includes('decollo')) return 'Sostituire lo storytelling narrativo con il testo funzionale: "Scarica i file audio per l\'uso senza connessione internet."';
      return 'Semplificare eliminando enfasi e applicando il vocabolario a una sola parola.';
    }

    for (const [_, g] of copyGroups) {
      let sev = 'MEDIO';
      if (g.word.includes('cruscotto') || g.word.includes('cockpit')) sev = 'ALTO';
      if (g.word === 'avvia' || g.word === 'comincia' || g.word === 'cominciarne') sev = 'MEDIO';
      if (g.word === 'ottimo lavoro' || g.word === 'fantastico') sev = 'BASSO';

      cataloguedIssues.push({
        id: `COPY-${String(copySeq++).padStart(2, '0')}`,
        category: 'Microcopy',
        severity: sev,
        title: `Termine da bonificare: "${g.word}"`,
        screens: Array.from(g.screens).join(', '),
        viewportsText: formatViewportsBadge(g.viewports),
        theme: 'Dark & Light',
        shotRelPath: g.bestShotRelPath,
        rect: g.rect,
        description: `Trovato in: "...${g.snippet}...". ${g.reason}`,
        solution: getProposedCopyFix(g.word, g.snippet)
      });
    }

    // 3. Cluttering Issues (Unique & Structured)
    cataloguedIssues.push({
      id: `CLUTTER-${String(clutterSeq++).padStart(2, '0')}`,
      category: 'Cluttering',
      severity: 'MEDIO',
      title: 'Moltiplicazione icone audio (5 altoparlanti nella scheda quiz)',
      screens: 'Esame, Tutor',
      viewportsText: 'Comune a Tutti i Viewport',
      theme: 'Dark & Light',
      shotRelPath: capturedScreenshots['mobile-portrait_dark_exam_running'] || 'screenshots/mobile-portrait_dark_exam_running.png',
      rect: { leftPct: 6, topPct: 25, widthPct: 88, heightPct: 40 },
      description: 'La scheda quesito mostra un altoparlante nella testata ID, uno accanto alla domanda e uno per ciascuna delle tre opzioni di risposta, oltre alle 2 icone audio in Navbar. Questo genera disordine visivo e affaticamento cognitivo.',
      solution: 'Mantenere un unico controllo audio contestuale chiaro ed ergonomico, eliminando gli altoparlanti ripetuti a fianco di ogni singola riga di risposta.'
    });

    cataloguedIssues.push({
      id: `CLUTTER-${String(clutterSeq++).padStart(2, '0')}`,
      category: 'Cluttering',
      severity: 'MEDIO',
      title: '3 righe orizzontali di filtri sovrapposte sotto la barra di ricerca',
      screens: 'Archivio Quiz',
      viewportsText: 'Mobile Portrait (390x844)',
      theme: 'Dark & Light',
      shotRelPath: capturedScreenshots['mobile-portrait_dark_archive'] || 'screenshots/mobile-portrait_dark_archive.png',
      rect: { leftPct: 4, topPct: 22, widthPct: 92, heightPct: 18 },
      description: 'In mobile portrait sono impilate 3 righe di pill-filter distinte (Filtro Materie 01..09, Filtro Stato Tutte/Non viste/Errate/Preferiti, Filtro Temi). Occupano circa 180px verticali spingendo i quiz in basso.',
      solution: 'Accorpare i filtri tematici e di stato in un selettore a scomparsa (drawer compatto) o in un menu a scheda singola per recuperare 100px utili alla lettura.'
    });

    cataloguedIssues.push({
      id: `CLUTTER-${String(clutterSeq++).padStart(2, '0')}`,
      category: 'Cluttering',
      severity: 'BASSO',
      title: 'Taglio della sesta card ("Statistiche") sotto la piega dello schermo',
      screens: 'Home',
      viewportsText: 'Mobile Portrait (390x844)',
      theme: 'Dark & Light',
      shotRelPath: capturedScreenshots['mobile-portrait_dark_home'] || 'screenshots/mobile-portrait_dark_home.png',
      rect: { leftPct: 4, topPct: 88, widthPct: 92, heightPct: 11 },
      description: 'A causa dell\'altezza delle card e dei preamboli descrittivi a 2 righe, sullo schermo 390x844 l\'ultima voce del menu principale viene troncata in basso.',
      solution: 'Rendere le 6 card più compatte riducendo il padding verticale da p-4 a p-3 e accorciando le descrizioni a una sola riga essenziale.'
    });

    // 4. Overflows (if any)
    const overflowGroups = new Map();
    for (const item of rawFindings) {
      if (item.rootOverflow) {
        const key = `root_${item.screenName}`;
        if (!overflowGroups.has(key)) {
          overflowGroups.set(key, {
            title: `Scrollbar orizzontale in ${item.screenName}`,
            screens: new Set([item.screenName]),
            viewports: new Set([item.viewportLabel]),
            shotRelPath: item.shotRelPath,
            description: `Larghezza documento (${item.docScrollWidth}px) supera il viewport (${item.winWidth}px).`
          });
        } else {
          overflowGroups.get(key).viewports.add(item.viewportLabel);
        }
      }
    }
    for (const [_, g] of overflowGroups) {
      cataloguedIssues.push({
        id: `OVERFLOW-${String(overflowSeq++).padStart(2, '0')}`,
        category: 'Overflow',
        severity: 'CRITICO',
        title: g.title,
        screens: Array.from(g.screens).join(', '),
        viewportsText: formatViewportsBadge(g.viewports),
        theme: 'Tutti',
        shotRelPath: g.shotRelPath,
        rect: null,
        description: g.description,
        solution: 'Applicare overflow-x-hidden e rimuovere larghezze minime fisse non responsive.'
      });
    }

    console.log(`✨ Risultato accorpamento: ${cataloguedIssues.length} difetti unici distinti (accorpati da oltre 64 schermate).`);

    // Compile Enhanced HTML Report with Bounding Box Overlay & Lightbox
    const htmlContent = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UI Audit Report - VDS-VL Quiz Master - ${timestamp}</title>
  <style>
    :root {
      --bg: #09090b;
      --card: #18181b;
      --card-border: #27272a;
      --text: #f4f4f5;
      --text-muted: #a1a1aa;
      --accent: #f59e0b;
      --danger: #ef4444;
      --success: #10b981;
      --warning: #f59e0b;
      --info: #38bdf8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 24px;
    }
    header {
      max-width: 1240px;
      margin: 0 auto 32px auto;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 24px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-family: monospace;
    }
    .badge-critico { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
    .badge-alto { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
    .badge-medio { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); }
    .badge-basso { background: rgba(161, 161, 170, 0.2); color: #d4d4d8; border: 1px solid rgba(161, 161, 170, 0.4); }
    .badge-viewport { background: rgba(255,255,255,0.06); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 11px; padding: 2px 7px; border-radius: 5px; font-weight: 600; }
    
    .stats-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin-top: 20px;
    }
    .stat-card {
      background: var(--card);
      border: 1px solid var(--card-border);
      padding: 16px 18px;
      border-radius: 12px;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
      position: relative;
      user-select: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: inherit;
      font-family: inherit;
      outline: none;
    }
    .stat-card:hover {
      background: #202024;
      border-color: #3f3f46;
      transform: translateY(-2px);
    }
    .stat-card.active {
      background: #202028;
      border-color: var(--accent);
      box-shadow: 0 0 0 1px var(--accent), 0 4px 18px rgba(245, 158, 11, 0.15);
    }
    .stat-card.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 18px;
      right: 18px;
      height: 3px;
      background: var(--accent);
      border-radius: 3px 3px 0 0;
    }
    .stat-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .stat-val {
      font-size: 28px;
      font-weight: 800;
      font-family: monospace;
      margin-top: 4px;
      line-height: 1.1;
    }
    .stat-hint {
      font-size: 11px;
      color: #71717a;
      margin-top: 4px;
    }
    
    .issues-list {
      max-width: 1240px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .issue-card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 22px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      transition: border-color 0.15s ease;
    }
    @media(min-width: 860px) {
      .issue-card {
        grid-template-columns: 1.15fr 0.85fr;
      }
    }
    .issue-card:hover {
      border-color: #3f3f46;
    }
    .issue-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .issue-id {
      font-family: monospace;
      font-size: 15px;
      font-weight: 800;
      color: var(--accent);
      background: rgba(245, 158, 11, 0.12);
      padding: 3px 10px;
      border-radius: 7px;
      border: 1px solid rgba(245, 158, 11, 0.35);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .issue-id:hover {
      background: rgba(245, 158, 11, 0.25);
    }
    .issue-title {
      font-size: 17px;
      font-weight: 700;
      color: #fafafa;
      margin-bottom: 8px;
    }
    .issue-meta {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 12px;
      line-height: 1.6;
    }
    .issue-meta strong { color: var(--text); }
    .issue-desc {
      font-size: 13.5px;
      color: #d4d4d8;
      margin-bottom: 14px;
      line-height: 1.6;
    }
    .issue-sol {
      background: rgba(16, 185, 129, 0.08);
      border-left: 3px solid var(--success);
      padding: 12px 16px;
      border-radius: 0 10px 10px 0;
      font-size: 13px;
      color: #a7f3d0;
      line-height: 1.5;
    }
    .issue-sol strong { color: #34d399; }
    
    /* Responsive Screenshot Container with Highlight Box Overlay */
    .screenshot-box {
      border: 1px solid #27272a;
      border-radius: 12px;
      background: #09090b;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      min-height: 240px;
      max-height: 480px;
      overflow: hidden;
    }
    .image-overlay-wrapper {
      position: relative;
      display: inline-block;
      max-width: 100%;
      cursor: zoom-in;
    }
    .image-overlay-wrapper img {
      max-width: 100%;
      max-height: 450px;
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 4px 18px rgba(0,0,0,0.6);
      display: block;
    }
    
    /* Dashed Highlight Box with Pulse & Pointer Arrow */
    .highlight-box {
      position: absolute;
      border: 2.5px dashed #ef4444;
      background: rgba(239, 68, 68, 0.2);
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.6), inset 0 0 8px rgba(239, 68, 68, 0.2);
      border-radius: 6px;
      pointer-events: none;
      animation: pulseHighlight 2s infinite ease-in-out;
      z-index: 10;
    }
    @keyframes pulseHighlight {
      0%, 100% {
        border-color: #ef4444;
        box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
      }
      50% {
        border-color: #f59e0b;
        box-shadow: 0 0 18px rgba(245, 158, 11, 0.9);
      }
    }
    .callout-arrow {
      position: absolute;
      top: -24px;
      left: -8px;
      font-size: 18px;
      line-height: 1;
      color: #f59e0b;
      transform: rotate(45deg);
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
    }
    .callout-badge {
      position: absolute;
      bottom: -20px;
      left: 0;
      background: #ef4444;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      font-family: monospace;
      padding: 1px 6px;
      border-radius: 4px;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.6);
    }
    .zoom-hint {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.75);
      border: 1px solid #3f3f46;
      color: #e4e4e7;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
      backdrop-filter: blur(4px);
      pointer-events: none;
      z-index: 12;
    }

    /* Lightbox Modal */
    .lightbox-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.92);
      backdrop-filter: blur(6px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 24px;
    }
    .lightbox-content {
      position: relative;
      max-width: 95vw;
      max-height: 95vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .lightbox-img-box {
      position: relative;
      display: inline-block;
    }
    .lightbox-img-box img {
      max-width: 92vw;
      max-height: 86vh;
      object-fit: contain;
      border-radius: 12px;
      border: 1px solid #3f3f46;
      box-shadow: 0 12px 40px rgba(0,0,0,0.9);
      background: #09090b;
      display: block;
    }
    .lightbox-close {
      position: absolute;
      top: -38px;
      right: 0;
      background: #27272a;
      color: #fafafa;
      border: 1px solid #52525b;
      font-size: 24px;
      line-height: 1;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    .lightbox-close:hover { background: #3f3f46; }
    .lightbox-caption {
      color: #d4d4d8;
      font-size: 13px;
      margin-bottom: 8px;
      font-weight: 600;
      font-family: monospace;
    }
    .copy-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--accent);
      color: #000;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.5);
      display: none;
      z-index: 1100;
    }
  </style>
</head>
<body>

  <header>
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
      <div>
        <h1 style="font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 10px;">
          <span>📋 VDS-VL Quiz Master</span>
          <span style="font-size: 14px; color: var(--accent); font-family: monospace; font-weight: 600;">UI & Microcopy Audit Report</span>
        </h1>
        <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
          Data generazione: <strong>${timestamp}</strong> • Rilievi unici accorpati tra tutti i viewport di test
        </p>
      </div>
      <div>
        <span class="badge badge-alto">Protocollo v1.0.0 (Deduplicato)</span>
      </div>
    </div>

    <div class="stats-bar" role="tablist" aria-label="Filtro rilievi">
      <button class="stat-card active" onclick="filterIssues('all', this)" role="tab" aria-selected="true" title="Mostra tutti i rilievi">
        <div class="stat-label">Tutti i Rilievi</div>
        <div class="stat-val" style="color: var(--accent);">${cataloguedIssues.length}</div>
        <div class="stat-hint">Panoramica completa</div>
      </button>
      <button class="stat-card" onclick="filterIssues('Contrasto', this)" role="tab" aria-selected="false" title="Filtra per Contrasto WCAG AA">
        <div class="stat-label">Contrasto WCAG AA</div>
        <div class="stat-val" style="color: var(--danger);">${cataloguedIssues.filter(i => i.category === 'Contrasto').length}</div>
        <div class="stat-hint">Leggibilità & colori</div>
      </button>
      <button class="stat-card" onclick="filterIssues('Microcopy', this)" role="tab" aria-selected="false" title="Filtra per Microcopy & Vocabolario">
        <div class="stat-label">Microcopy & Vocabolario</div>
        <div class="stat-val" style="color: var(--info);">${cataloguedIssues.filter(i => i.category === 'Microcopy').length}</div>
        <div class="stat-hint">Semplificazione testi</div>
      </button>
      <button class="stat-card" onclick="filterIssues('Cluttering', this)" role="tab" aria-selected="false" title="Filtra per Cluttering & Layout">
        <div class="stat-label">Cluttering & Layout</div>
        <div class="stat-val" style="color: var(--warning);">${cataloguedIssues.filter(i => i.category === 'Cluttering').length}</div>
        <div class="stat-hint">Pulizia & ingombri</div>
      </button>
      <button class="stat-card" onclick="filterIssues('Overflow', this)" role="tab" aria-selected="false" title="Filtra per Overflow / Fuori Schermo">
        <div class="stat-label">Overflow / Fuori Schermo</div>
        <div class="stat-val" style="color: var(--success);">${cataloguedIssues.filter(i => i.category === 'Overflow').length}</div>
        <div class="stat-hint">Geometria viewport</div>
      </button>
    </div>
  </header>

  <div class="issues-list">
    ${cataloguedIssues.map(issue => `
      <div class="issue-card" data-category="${issue.category}">
        <div>
          <div class="issue-header">
            <span class="issue-id" title="Clicca per copiare l'ID negli appunti" onclick="copyId('${issue.id}')">
              [${issue.id}]
              <span style="font-size: 11px; font-weight: normal; opacity: 0.8;">📋 copia</span>
            </span>
            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
              <span class="badge badge-${issue.severity.toLowerCase()}">${issue.severity}</span>
              <span class="badge" style="background: rgba(255,255,255,0.06); color: #ccc; border: 1px solid #333;">${issue.category}</span>
            </div>
          </div>
          <h2 class="issue-title">${issue.title}</h2>
          <div class="issue-meta">
            Schermate coinvolte: <strong>${issue.screens}</strong><br/>
            Viewport: <span class="badge-viewport">${issue.viewportsText}</span> • Tema: <strong>${issue.theme}</strong>
          </div>
          <p class="issue-desc">${issue.description}</p>
          <div class="issue-sol">
            <strong>Soluzione proposta:</strong> ${issue.solution}
          </div>
        </div>
        <div class="screenshot-box">
          <div class="image-overlay-wrapper"
               data-shot="${issue.shotRelPath}"
               data-id="${issue.id}"
               data-title="${encodeURIComponent(issue.title)}"
               data-rect="${issue.rect ? encodeURIComponent(JSON.stringify(issue.rect)) : ''}"
               title="Clicca per visualizzare lo screenshot ingrandito con callout">
            <img src="${issue.shotRelPath}" alt="${issue.title.replace(/"/g, '&quot;')}" loading="lazy" />
            ${issue.rect ? `
              <div class="highlight-box" style="left: ${issue.rect.leftPct}%; top: ${issue.rect.topPct}%; width: ${issue.rect.widthPct}%; height: ${issue.rect.heightPct}%;">
                <div class="callout-arrow">➔</div>
                <div class="callout-badge">${issue.id}</div>
              </div>
            ` : ''}
            <div class="zoom-hint">🔍 Ingrandisci</div>
          </div>
        </div>
      </div>
    `).join('')}
  </div>

  <div id="copyToast" class="copy-toast">ID copiato negli appunti!</div>

  <!-- Modal Lightbox Ingrandimento Screenshot -->
  <div id="lightboxModal" class="lightbox-modal" onclick="closeLightbox(event)">
    <div class="lightbox-content">
      <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
      <div id="lightboxCaption" class="lightbox-caption"></div>
      <div class="lightbox-img-box">
        <img id="lightboxImg" src="" alt="Screenshot ingrandito" />
        <div id="lightboxHighlight" class="highlight-box" style="display: none;">
          <div class="callout-arrow">➔</div>
          <div id="lightboxHighlightBadge" class="callout-badge"></div>
        </div>
      </div>
    </div>
  </div>

  <script>
    function copyId(id) {
      navigator.clipboard.writeText('[' + id + ']').then(() => {
        const toast = document.getElementById('copyToast');
        toast.innerText = 'Copiato: [' + id + ']';
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 1800);
      });
    }

    document.addEventListener('click', (e) => {
      const wrapper = e.target.closest('.image-overlay-wrapper');
      if (wrapper) {
        const shot = wrapper.getAttribute('data-shot');
        const id = wrapper.getAttribute('data-id');
        const title = decodeURIComponent(wrapper.getAttribute('data-title') || '');
        const rectStr = wrapper.getAttribute('data-rect');
        let rect = null;
        if (rectStr) {
          try { rect = JSON.parse(decodeURIComponent(rectStr)); } catch (err) {}
        }
        openLightbox(shot, '[' + id + '] ' + title, rect);
      }
    });

    function openLightbox(src, title, rect) {
      const modal = document.getElementById('lightboxModal');
      const img = document.getElementById('lightboxImg');
      const cap = document.getElementById('lightboxCaption');
      const hl = document.getElementById('lightboxHighlight');
      const badge = document.getElementById('lightboxHighlightBadge');

      img.src = src;
      cap.innerText = title;

      if (rect) {
        hl.style.left = rect.leftPct + '%';
        hl.style.top = rect.topPct + '%';
        hl.style.width = rect.widthPct + '%';
        hl.style.height = rect.heightPct + '%';
        hl.style.display = 'block';
        const m = title.match(/\[(.*?)\]/);
        badge.innerText = m ? m[1] : '';
      } else {
        hl.style.display = 'none';
      }

      modal.style.display = 'flex';
    }

    function closeLightbox(e) {
      if (!e || e.target.id === 'lightboxModal' || e.target.classList.contains('lightbox-close')) {
        document.getElementById('lightboxModal').style.display = 'none';
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });

    function filterIssues(cat, cardEl) {
      document.querySelectorAll('.stat-card').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      cardEl.classList.add('active');
      cardEl.setAttribute('aria-selected', 'true');
      document.querySelectorAll('.issue-card').forEach(card => {
        if (cat === 'all' || card.getAttribute('data-category') === cat) {
          card.style.display = 'grid';
        } else {
          card.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;

    fs.writeFileSync(reportHtmlPath, htmlContent, 'utf-8');
    console.log(`\n🎉 Report HTML salvato con successo:`);
    console.log(`👉 [${reportHtmlPath}](file:///${reportHtmlPath.replace(/\\/g, '/')})\n`);

  } catch (err) {
    console.error('❌ Errore durante l\'esecuzione dell\'audit:', err);
  } finally {
    if (ws && ws.readyState === 1) ws.close();
    browser.kill();
    try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch (e) {}
  }
}

runAudit();
