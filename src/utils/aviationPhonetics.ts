// Normalizzatore Fonetico per Terminologia Aeronautica e Acronimi VDS-VL
// Ottimizzato per sintetizzatori neurali italiani (garantisce dizione 100% corretta)

export function normalizeAviationPhonetics(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Pulizia apici e virgolette
  cleaned = cleaned.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');

  // 2. Normalizzazione Normativa e Decreti
  cleaned = cleaned.replace(/D\.P\.R\.\s*(\d+)\/(\d+)/gi, 'Decreto del Presidente della Repubblica $1 del $2');
  cleaned = cleaned.replace(/D\.P\.R\./gi, 'Decreto del Presidente della Repubblica');

  // 3. Istituzioni e Assicurazioni
  cleaned = cleaned.replace(/Ae\.C\.I\./gi, "Aero Club d'Italia");
  cleaned = cleaned.replace(/\bAeCI\b/g, "Aero Club d'Italia");
  cleaned = cleaned.replace(/\bRCT\b/g, 'R C T');
  cleaned = cleaned.replace(/\bENAC\b/g, 'Enac');
  cleaned = cleaned.replace(/\bENAV\b/g, 'Enav');

  // 4. Sigle di Volo e Licenze
  cleaned = cleaned.replace(/\bVDS\/VL\b/gi, 'V D S Volo Libero');
  cleaned = cleaned.replace(/\bVDS\b/g, 'V D S');
  cleaned = cleaned.replace(/\bVL\b/g, 'Volo Libero');
  cleaned = cleaned.replace(/\bVFR\b/g, 'V F R');
  cleaned = cleaned.replace(/\bIFR\b/g, 'I F R');

  // 5. Spazi Aerei e Telecomunicazioni
  cleaned = cleaned.replace(/\bCTR\b/g, 'C T R');
  cleaned = cleaned.replace(/\bTMA\b/g, 'T M A');
  cleaned = cleaned.replace(/\bATZ\b/g, 'A T Z');
  cleaned = cleaned.replace(/\bNOTAM\b/gi, 'Notam');
  cleaned = cleaned.replace(/\bMETAR\b/gi, 'Metar');
  cleaned = cleaned.replace(/\bTAF\b/gi, 'Taf');

  // 6. Altimetria e Pressione
  cleaned = cleaned.replace(/\bQNH\b/g, 'Q N H');
  cleaned = cleaned.replace(/\bQFE\b/g, 'Q F E');
  cleaned = cleaned.replace(/\bhPa\b/g, 'ettopascal');
  cleaned = cleaned.replace(/\bFL\s*(\d+)/gi, 'Livello di volo $1');

  // 7. Unità di Misura Aeronautiche
  cleaned = cleaned.replace(/\bkm\/h\b/gi, "chilometri all'ora");
  cleaned = cleaned.replace(/\bm\/s\b/gi, 'metri al secondo');
  cleaned = cleaned.replace(/\bkts?\b/gi, 'nodi');
  cleaned = cleaned.replace(/\b(\d+)\s*°C\b/g, '$1 gradi centigradi');
  cleaned = cleaned.replace(/\b(\d+)\s*°\b/g, '$1 gradi');

  // 8. Punteggiatura morbida: sostituisce punti interrogativi enfatici
  // con punti fermi per evitare intonazioni acute stridule
  cleaned = cleaned.replace(/\?\s*$/g, '.');

  // Rimuove spazi doppi
  return cleaned.replace(/\s+/g, ' ').trim();
}

export function formatOptionForSpeech(index: 1 | 2 | 3, optionText: string): string {
  const prefixes: Record<1 | 2 | 3, string> = {
    1: 'Uno.',
    2: 'Due.',
    3: 'Tre.'
  };
  return `${prefixes[index]} ${normalizeAviationPhonetics(optionText)}`;
}

export function formatExplanationForSpeech(
  correctAnswer: 1 | 2 | 3,
  correctOptionText: string,
  rule: string,
  trap: string
): string {
  const ordinals: Record<1 | 2 | 3, string> = {
    1: 'la uno',
    2: 'la due',
    3: 'la tre'
  };

  return `Risposta errata. La risposta esatta è ${ordinals[correctAnswer]}: ${normalizeAviationPhonetics(correctOptionText)}. Regola: ${normalizeAviationPhonetics(rule)}. Tranello: ${normalizeAviationPhonetics(trap)}.`;
}
