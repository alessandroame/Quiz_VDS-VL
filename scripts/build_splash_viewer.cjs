const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\aless\\.gemini\\antigravity\\brain\\7895f15b-0ae5-48a0-a929-6b6e8b3cc02a';
const mobilePng = path.join(brainDir, 'splash_screen_mobile.png');
const desktopPng = path.join(brainDir, 'splash_screen_desktop.png');

const mobileB64 = 'data:image/png;base64,' + fs.readFileSync(mobilePng).toString('base64');
const desktopB64 = 'data:image/png;base64,' + fs.readFileSync(desktopPng).toString('base64');

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    body { margin: 0; padding: 12px; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased">
  <div class="bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-2xl p-4 shadow-2xl max-w-4xl mx-auto">
    <div class="flex items-center justify-between border-b border-[#27272a] pb-3 mb-4">
      <div>
        <h2 class="text-base font-bold text-amber-500 flex items-center gap-2">
          <span>🚀</span> Splash Screen Ufficiale VDS-VL
        </h2>
        <p class="text-xs text-zinc-400 mt-0.5">Icona espansa alla massima dimensione con glow avionico</p>
      </div>
      <div class="flex items-center gap-1.5 bg-[#18181b] p-1 rounded-lg border border-[#27272a]">
        <button id="btn-mobile" onclick="showView('mobile')" class="px-3 py-1 text-xs font-bold rounded-md bg-amber-500 text-black transition-all">
          📱 Mobile (390x844)
        </button>
        <button id="btn-desktop" onclick="showView('desktop')" class="px-3 py-1 text-xs font-semibold rounded-md text-zinc-400 hover:text-white transition-all">
          💻 Desktop
        </button>
      </div>
    </div>

    <!-- Mobile View -->
    <div id="view-mobile" class="flex flex-col items-center justify-center p-2">
      <div class="relative rounded-[32px] overflow-hidden border-4 border-[#27272a] shadow-2xl bg-black max-w-[280px]">
        <img src="${mobileB64}" alt="Splash Screen Mobile" class="w-full h-auto block" />
      </div>
      <span class="text-[11px] text-zinc-400 mt-2">Risoluzione reale iPhone (390 x 844 px @2x)</span>
    </div>

    <!-- Desktop View -->
    <div id="view-desktop" class="hidden flex-col items-center justify-center p-2">
      <div class="relative rounded-xl overflow-hidden border-2 border-[#27272a] shadow-2xl bg-black w-full max-w-2xl">
        <img src="${desktopB64}" alt="Splash Screen Desktop" class="w-full h-auto block" />
      </div>
      <span class="text-[11px] text-zinc-400 mt-2">Risoluzione Desktop (1440 x 900 px)</span>
    </div>
  </div>

  <script>
    function showView(view) {
      if (view === 'mobile') {
        document.getElementById('view-mobile').classList.remove('hidden');
        document.getElementById('view-desktop').classList.add('hidden');
        document.getElementById('btn-mobile').className = 'px-3 py-1 text-xs font-bold rounded-md bg-amber-500 text-black transition-all';
        document.getElementById('btn-desktop').className = 'px-3 py-1 text-xs font-semibold rounded-md text-zinc-400 hover:text-white transition-all';
      } else {
        document.getElementById('view-mobile').classList.add('hidden');
        document.getElementById('view-desktop').classList.remove('hidden');
        document.getElementById('btn-desktop').className = 'px-3 py-1 text-xs font-bold rounded-md bg-amber-500 text-black transition-all';
        document.getElementById('btn-mobile').className = 'px-3 py-1 text-xs font-semibold rounded-md text-zinc-400 hover:text-white transition-all';
      }
    }
  </script>
</body>
</html>`;

const outPath = path.join(brainDir, 'splash_viewer.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('✅ splash_viewer.html written successfully to', outPath);
