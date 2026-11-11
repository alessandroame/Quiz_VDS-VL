// Phonetic normalizer for VDS-VL aeronautical terminology, acronyms, and formulas.
// Uses lowercase Italian letter names without artificial grave accents so both
// Edge-TTS neural voices (Diego/Elsa) and Web Speech API fallback never misread
// uppercase V/I as Roman numerals ("quinto", "primo").

export function normalizeAviationPhonetics(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. Normalize typographic quotes and apostrophes
  cleaned = cleaned.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');

  // 2. Regulations and institutions (before single-letter/acronym rules)
  cleaned = cleaned.replace(/D\.P\.R\.\s*(\d+)\/(\d+)/gi, 'Decreto del Presidente della Repubblica $1 del $2');
  cleaned = cleaned.replace(/D\.P\.R\./gi, 'Decreto del Presidente della Repubblica');
  cleaned = cleaned.replace(/Ae\.C\.I\./gi, "Aero Club d'Italia");
  cleaned = cleaned.replace(/\bAeCI\b/g, "Aero Club d'Italia");
  cleaned = cleaned.replace(/\bENAC\b/g, 'Enac');
  cleaned = cleaned.replace(/\bENAV\b/g, 'Enav');
  cleaned = cleaned.replace(/\bICAO\b/g, 'Icao');

  // 3. Physics formulas, subscripts, superscripts, and composite units
  // Must run BEFORE acronym rules because superscripts like ² create a \b boundary after V/S/m.
  cleaned = cleaned.replace(/\bkg\/m²(?![a-zA-Z0-9])/gi, 'chilogrammi per metro quadrato');
  cleaned = cleaned.replace(/\bm\/s²(?![a-zA-Z0-9])/gi, 'metri al secondo quadrato');
  cleaned = cleaned.replace(/\bm²(?![a-zA-Z0-9])/gi, 'metri quadrati');
  cleaned = cleaned.replace(/\b1\/2\b/g, 'un mezzo');
  cleaned = cleaned.replace(/\bCₚ(?![a-zA-Z0-9])/g, 'ci con pi');
  cleaned = cleaned.replace(/\bCᵣ(?![a-zA-Z0-9])/g, 'ci con erre');
  cleaned = cleaned.replace(/\bEₚ(?![a-zA-Z0-9])/g, 'e con pi');
  cleaned = cleaned.replace(/\bO₂(?![a-zA-Z0-9])/g, 'ossigeno');
  cleaned = cleaned.replace(/(?<![a-zA-ZÀ-ÿ])[ρϱ](?![a-zA-ZÀ-ÿ])/g, 'ro');
  cleaned = cleaned.replace(/√n\b/g, 'radice di enne');
  cleaned = cleaned.replace(/∝/g, 'è proporzionale a');
  cleaned = cleaned.replace(/\bVx\b/g, 'vu con ics');
  cleaned = cleaned.replace(/\bVy\b/g, 'vu con ipsilon');
  cleaned = cleaned.replace(/\bVz\b/g, 'vu con zeta');
  cleaned = cleaned.replace(/\bVs\b/g, 'vu con esse');
  cleaned = cleaned.replace(/\b3V\b/g, 'tre vu');
  cleaned = cleaned.replace(/\b[vV]²(?![a-zA-Z0-9])/g, 'vu al quadrato');
  cleaned = cleaned.replace(/\bS²(?![a-zA-Z0-9])/g, 'esse al quadrato');
  cleaned = cleaned.replace(/\bb²(?![a-zA-Z0-9])/g, 'bi al quadrato');
  cleaned = cleaned.replace(/(\d+)²(?![a-zA-Z0-9])/g, '$1 al quadrato');

  // 4. Compound and single aeronautical acronyms (syllabic Italian letter names)
  cleaned = cleaned.replace(/\bVDS\s*[/-]\s*VL\b/gi, 'vu di esse, vu elle');
  cleaned = cleaned.replace(/\bTAS\/IAS\b/g, 'ti a esse su i a esse');
  cleaned = cleaned.replace(/\bEN\/LTF\b/g, 'e enne, elle ti effe');
  cleaned = cleaned.replace(/\bEN-A\b/g, 'e enne a');
  cleaned = cleaned.replace(/\bEN-B\b/g, 'e enne bi');
  cleaned = cleaned.replace(/\bEN-C\b/g, 'e enne ci');
  cleaned = cleaned.replace(/\bEN-D\b/g, 'e enne di');
  cleaned = cleaned.replace(/\bVDS\b/gi, 'vu di esse');
  cleaned = cleaned.replace(/\bVL\b/gi, 'vu elle');
  cleaned = cleaned.replace(/\bVFR\b/g, 'vu effe erre');
  cleaned = cleaned.replace(/\bIFR\b/g, 'i effe erre');
  cleaned = cleaned.replace(/\bRCT\b/g, 'erre ci ti');
  cleaned = cleaned.replace(/\bCTR\b/g, 'ci ti erre');
  cleaned = cleaned.replace(/\bTMA\b/g, 'ti emme a');
  cleaned = cleaned.replace(/\bATZ\b/g, 'a ti zeta');
  cleaned = cleaned.replace(/\bNOTAM\b/gi, 'Notam');
  cleaned = cleaned.replace(/\bMETAR\b/gi, 'Metar');
  cleaned = cleaned.replace(/\bTAF\b/gi, 'Taf');
  cleaned = cleaned.replace(/\bQNH\b/g, 'qu enne acca');
  cleaned = cleaned.replace(/\bQFE\b/g, 'qu effe e');
  cleaned = cleaned.replace(/\bVNE\b/g, 'vu enne e');
  cleaned = cleaned.replace(/\bGPS\b/g, 'gi pi esse');
  cleaned = cleaned.replace(/\bIAS\b/g, 'i a esse');
  cleaned = cleaned.replace(/\bTAS\b/g, 'ti a esse');
  cleaned = cleaned.replace(/\bGS\b/g, 'gi esse');
  cleaned = cleaned.replace(/\bATC\b/g, 'a ti ci');
  cleaned = cleaned.replace(/\bSIV\b/g, 'esse i vu');
  cleaned = cleaned.replace(/\bPIO\b/g, 'pi i o');
  cleaned = cleaned.replace(/\bMSL\b/g, 'emme esse elle');
  cleaned = cleaned.replace(/\bAIP\b/g, 'a i pi');
  cleaned = cleaned.replace(/\bISA\b/g, 'i esse a');
  cleaned = cleaned.replace(/\bVMC\b/g, 'vu emme ci');
  cleaned = cleaned.replace(/\bIMC\b/g, 'i emme ci');
  cleaned = cleaned.replace(/\bUV\b/g, 'u vu');
  cleaned = cleaned.replace(/\bUR\b/g, 'u erre');
  cleaned = cleaned.replace(/\bAWY\b/g, 'a doppia vu ipsilon');
  cleaned = cleaned.replace(/\bPLS\b/g, 'pi elle esse');
  cleaned = cleaned.replace(/\bWMO\b/g, 'doppia vu emme o');
  cleaned = cleaned.replace(/(?<![a-zA-ZÀ-ÿ])AR(?![a-zA-ZÀ-ÿ])/g, 'a erre');

  // Standalone uppercase V (velocity symbol in formulas) -> "vu" so TTS never reads "quinto"
  cleaned = cleaned.replace(/(?<![a-zA-ZÀ-ÿ])V(?![a-zA-ZÀ-ÿ])/g, 'vu');

  // 5. Aeronautical units of measurement and flight levels
  cleaned = cleaned.replace(/\bhPa\b/g, 'ettopascal');
  cleaned = cleaned.replace(/\bFL\s*(\d+)/gi, 'Livello di volo $1');
  cleaned = cleaned.replace(/\bkm\/h\b/gi, "chilometri all'ora");
  cleaned = cleaned.replace(/\bm\/s\b/gi, 'metri al secondo');
  cleaned = cleaned.replace(/\bkts?\b/gi, 'nodi');
  cleaned = cleaned.replace(/(\d+(?:[.,]\d+)?)\s*°C\b/g, '$1 gradi centigradi');
  cleaned = cleaned.replace(/(\d+(?:[.,]\d+)?)\s*°(?![a-zA-Z])/g, '$1 gradi');

  // 6. Soft punctuation: replace trailing question mark with period to avoid shrill pitch
  cleaned = cleaned.replace(/\?\s*$/g, '.');

  // 7. Phonetic overrides to resolve homographs and enforce Italian tonic accents
  for (const [pattern, replacement] of PHONETIC_OVERRIDES) {
    cleaned = cleaned.replace(pattern, (match) => {
      if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }

  // Remove double spaces
  return cleaned.replace(/\s+/g, ' ').trim();
}

// Phonetic overrides for neural Italian TTS (Diego and Elsa)
const PHONETIC_OVERRIDES: Array<[RegExp, string]> = [
  // 1. Verbs vs nouns/adjectives (homographs)
  [/\bdecade\b/gi, 'decàde'],
  [/\bdecadono\b/gi, 'decàdono'],
  [/\bsubito\b/gi, 'sùbito'],
  [/\bcircuito\b/gi, 'circùito'],
  [/\bcircuiti\b/gi, 'circùiti'],
  [/\breticolo\b/gi, 'retìcolo'],

  // 2. Flight axes and flight dynamics (penultimate tonic accent)
  [/\bverticale\b/gi, 'verticàle'],
  [/\bverticali\b/gi, 'verticàli'],
  [/\bverticalmente\b/gi, 'verticalménte'],
  [/\borizzontale\b/gi, 'orizzontàle'],
  [/\borizzontali\b/gi, 'orizzontàli'],
  [/\borizzontalmente\b/gi, 'orizzontalménte'],
  [/\brollio\b/gi, 'rollìo'],
  [/\bvelivolo\b/gi, 'velìvolo'],
  [/\bvelivoli\b/gi, 'velìvoli'],
  [/\baerodina\b/gi, 'aerodìna'],
  [/\baerodine\b/gi, 'aerodìne'],

  // 3. Flight instruments (antepenultimate tonic accent)
  [/\bvariometro\b/gi, 'variòmetro'],
  [/\bvariometri\b/gi, 'variòmetri'],
  [/\banemometro\b/gi, 'anemòmetro'],
  [/\banemometri\b/gi, 'anemòmetri'],
  [/\baltimetro\b/gi, 'altìmetro'],
  [/\baltimetri\b/gi, 'altìmetri'],
  [/\bbarometro\b/gi, 'baròmetro'],
  [/\bbarometri\b/gi, 'baròmetri'],
  [/\bigrometro\b/gi, 'igròmetro'],
  [/\bigrometri\b/gi, 'igròmetri'],

  // 4. Meteorology and cloud formations
  [/\bisobare\b/gi, 'isòbare'],
  [/\bisobara\b/gi, 'isòbara'],
  [/\bcumulo\b/gi, 'cùmulo'],
  [/\bcumuli\b/gi, 'cùmuli'],
  [/\bcumulonembo\b/gi, 'cumulonèmbo'],
  [/\bcumulonembi\b/gi, 'cumulonèmbi'],
  [/\bstratocumulo\b/gi, 'stratocùmulo'],
  [/\bstratocumuli\b/gi, 'stratocùmuli'],
  [/\baltocumulo\b/gi, 'altocùmulo'],
  [/\baltocumuli\b/gi, 'altocùmuli'],
  [/\bcirrostrato\b/gi, 'cirrostràto'],
  [/\baltostrato\b/gi, 'altostràto'],
  [/\bsottovento\b/gi, 'sottovènto'],
  [/\bsopravvento\b/gi, 'sopravvènto'],
  [/\bsopravento\b/gi, 'sopravvènto']
];

/**
 * Formats a question text for speech output, strictly returning the normalized question
 * without question ID or subject category preambles.
 */
export function formatQuestionForSpeech(questionText: string): string {
  return normalizeAviationPhonetics(questionText);
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

  return `La risposta esatta è ${ordinals[correctAnswer]}: ${normalizeAviationPhonetics(correctOptionText)}. Regola: ${normalizeAviationPhonetics(rule)}. Tranello: ${normalizeAviationPhonetics(trap)}.`;
}
