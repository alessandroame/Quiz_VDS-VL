export type VoiceCommand =
  | 'opt1'
  | 'opt2'
  | 'opt3'
  | 'next'
  | 'prev'
  | 'repeat'
  | 'flag'
  | 'pause'
  | 'stop'
  | 'resume'
  | 'explain'
  | 'tutor_on'
  | 'tutor_off'
  | 'toggle_tutor'
  | 'help';

/**
 * Deterministic parser for Italian voice commands in Drive Mode.
 * Takes the raw transcription from SpeechRecognition and returns the corresponding VoiceCommand.
 */
export function parseVoiceCommand(raw: string): VoiceCommand | null {
  if (!raw || typeof raw !== 'string') return null;

  // Clean diacritics, punctuation and normalize whitespace
  const clean = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return null;

  // 1. Answer Options (Highest priority)
  // Matches: "uno", "1", "prima", "primo", "opzione uno", "scelgo la 1", "scelgo la prima", "la prima", "la uno", etc.
  if (
    /^(1|uno|prima|primo)\b/i.test(clean) ||
    /\b(opzione 1|opzione uno|risposta 1|risposta uno|scelgo 1|scelgo la 1|scelgo uno|scelgo la uno|scelgo la prima|scelgo il primo|numero 1|numero uno|la 1|la uno|la prima|il primo)\b/i.test(clean)
  ) {
    return 'opt1';
  }

  // Matches: "due", "2", "seconda", "secondo", "opzione due", "scelgo la 2", "scelgo la seconda", "la seconda", "la due", etc.
  if (
    /^(2|due|seconda|secondo)\b/i.test(clean) ||
    /\b(opzione 2|opzione due|risposta 2|risposta due|scelgo 2|scelgo la 2|scelgo due|scelgo la due|scelgo la seconda|scelgo il secondo|numero 2|numero due|la 2|la due|la seconda|il secondo)\b/i.test(clean)
  ) {
    return 'opt2';
  }

  // Matches: "tre", "3", "terza", "terzo", "opzione tre", "scelgo la 3", "scelgo la terza", "la terza", "la tre", etc.
  if (
    /^(3|tre|terza|terzo)\b/i.test(clean) ||
    /\b(opzione 3|opzione tre|risposta 3|risposta tre|scelgo 3|scelgo la 3|scelgo tre|scelgo la tre|scelgo la terza|scelgo il terzo|numero 3|numero tre|la 3|la tre|la terza|il terzo)\b/i.test(clean)
  ) {
    return 'opt3';
  }

  // 2. Navigation between questions
  // Matches: "avanti", "successiva", "prossima", "salta", "dopo", "next", "passa"
  if (/\b(avanti|successiva|prossima|prossimo|salta|passa|next)\b/i.test(clean)) {
    return 'next';
  }

  // Matches: "indietro", "precedente", "torna indietro", "prima domanda", "back"
  if (/\b(indietro|precedente|torna indietro|back)\b/i.test(clean)) {
    return 'prev';
  }

  // 3. Audio Control and Replay
  // Matches: "ripeti", "ascolta", "rileggi", "riparti", "repeat"
  if (/\b(ripeti|ascolta|rileggi|riparti|ancora|repeat)\b/i.test(clean)) {
    return 'repeat';
  }

  // 4. Bookmark / Review Flag
  // Matches: "bandiera", "flag", "rivedere", "segna", "da rivedere"
  if (/\b(bandiera|flag|segna|rivedere|da rivedere)\b/i.test(clean)) {
    return 'flag';
  }

  // 5. Tutor Mode activation / deactivation / toggle (prioritized before generic start/stop)
  if (/\b(attiva tutor|abilita tutor|avvia tutor|accendi tutor|tutor on|metti tutor)\b/i.test(clean)) {
    return 'tutor_on';
  }

  if (/\b(disattiva tutor|disabilita tutor|spegni tutor|stop tutor|tutor off|togli tutor)\b/i.test(clean)) {
    return 'tutor_off';
  }

  if (/\b(tutor|modalita tutor)\b/i.test(clean)) {
    return 'toggle_tutor';
  }

  // 6. Explanation and Didactics (Regola / Tranello)
  // Matches: "spiega", "spiegami", "spiegazione", "regola", "la regola", "tranello", "il tranello", "perche", "motivo"
  if (/\b(spiega|spiegami|spiegazione|regola|la regola|tranello|il tranello|perche|motivo)\b/i.test(clean)) {
    return 'explain';
  }

  // 7. Autopilot Control (Pause / Stop / Play)
  if (/\b(stop|ferma|basta|azzera|interrompi)\b/i.test(clean)) {
    return 'stop';
  }

  if (/\b(pausa|alt|aspett|attendi|sospendi)\b/i.test(clean)) {
    return 'pause';
  }

  if (/\b(continua|riprendi|vai|play|riavvia|avvia)\b/i.test(clean)) {
    return 'resume';
  }

  // 8. Help and Contextual Guide
  // Matches: "aiuto", "guida", "comandi", "istruzioni", "tutorial", "cosa posso dire", "help"
  if (/\b(aiuto|guida|comandi|istruzioni|tutorial|cosa posso dire|help)\b/i.test(clean)) {
    return 'help';
  }

  return null;
}
