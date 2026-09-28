const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\aless\\.gemini\\antigravity\\brain\\7895f15b-0ae5-48a0-a929-6b6e8b3cc02a';
const publicProposalsDir = path.join(__dirname, '..', 'public', 'proposals');
if (!fs.existsSync(publicProposalsDir)) {
  fs.mkdirSync(publicProposalsDir, { recursive: true });
}

const icons = [
  {
    id: 1,
    title: '1. Paraglider Question Mark',
    subtitle: 'Il Punto di Domanda in Volo (Consigliata)',
    file: 'paraglider_question_icon_1790614519390.jpg',
    desc: 'La vela ad arco del parapendio disegna la testa del punto interrogativo (?), mentre il pilota sospeso nei cordini ne forma il punto inferiore. Riconoscibilità istantanea e forte coerenza concettuale.'
  },
  {
    id: 2,
    title: '2. Delta Check',
    subtitle: 'Deltaplano & Spunta Risposta Corretta',
    file: 'delta_check_icon_1790614543591.jpg',
    desc: 'L\'ala a delta con trapezio e chiglia in virata dinamica si estende verso l\'alto trasformandosi in una decisa spunta di verifica (✓).'
  },
  {
    id: 3,
    title: '3. Quiz Flight Card',
    subtitle: 'Scheda Quiz con Cupola Parapendio',
    file: 'quiz_flight_card_1790614563430.jpg',
    desc: 'La scheda a crocette (opzioni A, B, C ufficiali AeCI con la risposta esatta spuntata) sormontata dal profilo aerodinamico di un parapendio in decollo.'
  },
  {
    id: 4,
    title: '4. Cockpit Variometer Quiz',
    subtitle: 'Variometro Avionico con Domanda',
    file: 'vario_quiz_dial_1790614585446.jpg',
    desc: 'Quadrante circolare da cockpit avionico con scala graduata di salita in termica e punto interrogativo centrale sagomato su profilo alare.'
  },
  {
    id: 5,
    title: '5. Aero Exam Badge',
    subtitle: 'Stemma Brevetto Volo Libero & Quiz',
    file: 'wings_quiz_badge_1790614604419.jpg',
    desc: 'Stemma celebrativo con ali dorate da pilota che unisce sia il parapendio che il deltaplano attorno a un medaglione con spunta (✓) e punto interrogativo (?).'
  }
];

// Copy to public/proposals
icons.forEach(icon => {
  const src = path.join(brainDir, icon.file);
  const dst = path.join(publicProposalsDir, icon.file);
  fs.copyFileSync(src, dst);
});

// Encode as Base64 for bulletproof rendering in iframe
const iconData = icons.map(icon => {
  const filePath = path.join(brainDir, icon.file);
  const b64 = fs.readFileSync(filePath).toString('base64');
  return {
    ...icon,
    b64: 'data:image/jpeg;base64,' + b64
  };
});

const cardsHtml = iconData.map((ic, idx) => `
  <div class="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden p-3 flex flex-col items-center text-center">
    <div class="relative w-full aspect-square mb-3 rounded-lg overflow-hidden border border-amber-500/20 shadow-lg">
      <img src="${ic.b64}" alt="${ic.title}" class="w-full h-full object-cover" />
      <span class="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-amber-400 text-xs font-bold px-2 py-0.5 rounded border border-amber-500/30">
        #${ic.id}
      </span>
    </div>
    <div class="text-[11px] font-mono uppercase tracking-wider text-amber-500 font-bold mb-1">${ic.subtitle}</div>
    <h3 class="text-sm font-bold text-zinc-100 mb-1.5">${ic.title}</h3>
    <p class="text-xs text-zinc-400 leading-relaxed mb-3 flex-1">${ic.desc}</p>
    <div class="w-full py-1.5 px-3 bg-zinc-800 text-amber-400 text-xs font-semibold rounded-lg border border-zinc-700">
      Proposta ${ic.id}
    </div>
  </div>
`).join('\n');

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
  <div class="bg-[#09090b] text-zinc-100 border border-[#27272a] rounded-2xl p-4 shadow-xl">
    <div class="flex items-center justify-between border-b border-[#27272a] pb-3 mb-4">
      <div>
        <h2 class="text-base font-bold text-amber-500 flex items-center gap-2">
          <span>🪂</span> 5 Proposte Ufficiali: Volo Libero + Quiz
        </h2>
        <p class="text-xs text-zinc-400 mt-0.5">Sintesi visiva di Parapendio, Deltaplano e Quiz Esame</p>
      </div>
      <span class="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-mono">
        5 Concept 1:1
      </span>
    </div>

    <!-- Grid of all 5 icons side by side -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      ${cardsHtml}
    </div>
  </div>
</body>
</html>`;

const outPath = path.join(brainDir, 'icons_viewer.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('✅ icons_viewer.html written successfully with all 5 base64 icons to', outPath);
