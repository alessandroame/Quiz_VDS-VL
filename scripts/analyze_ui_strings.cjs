// scripts/analyze_ui_strings.cjs
const fs = require('fs');
const catalog = JSON.parse(fs.readFileSync('reports/ui_strings_catalog.json', 'utf8'));

const results = {
  pleonasms: [],
  maniLibereWeird: [],
  flavorStorytelling: [],
  arcadeGaming: [],
  synonyms: []
};

for (const item of catalog) {
  const lower = item.text.toLowerCase();
  
  if (lower.includes('didattic') || lower.includes('da capo dall\'inizio') || lower.includes('ricomincia da capo')) {
    results.pleonasms.push(item);
  }
  if (lower.includes('mani libere') && !lower.includes('modalità mani libere')) {
    results.maniLibereWeird.push(item);
  }
  if (lower.includes('decollo') || lower.includes('cockpit') || lower.includes('cruscotto') || lower.includes('plancia')) {
    results.flavorStorytelling.push(item);
  }
  if (lower.includes('sfida') || lower.includes('master') || lower.includes('campione') || lower.includes('record')) {
    results.arcadeGaming.push(item);
  }
  if (lower.includes('comincia') || lower.includes('parti ') || lower.includes('avvia')) {
    results.synonyms.push(item);
  }
}

console.log('--- RISULTATI SCAN SEMANTICO RAPIDO ---');
console.log('1. Pleonasmi trovati:', results.pleonasms.length);
results.pleonasms.forEach(p => console.log('   *', p.file + ':' + p.line, '->', p.text));

console.log('\n2. Mani libere fuori contesto:', results.maniLibereWeird.length);
results.maniLibereWeird.forEach(p => console.log('   *', p.file + ':' + p.line, '->', p.text));

console.log('\n3. Cosplay / Storytelling / Decollo:', results.flavorStorytelling.length);
results.flavorStorytelling.forEach(p => console.log('   *', p.file + ':' + p.line, '->', p.text));

console.log('\n4. Arcade / Gamification:', results.arcadeGaming.length);
results.arcadeGaming.forEach(p => console.log('   *', p.file + ':' + p.line, '->', p.text));

console.log('\n5. Sinonimi incoerenti (Avvia/Comincia):', results.synonyms.length);
results.synonyms.forEach(p => console.log('   *', p.file + ':' + p.line, '->', p.text));
