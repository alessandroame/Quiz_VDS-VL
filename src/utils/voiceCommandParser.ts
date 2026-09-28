export type VoiceCommand =
  | 'opt1'
  | 'opt2'
  | 'opt3'
  | 'next'
  | 'prev'
  | 'repeat'
  | 'flag'
  | 'pause'
  | 'resume'
  | 'help';

/**
 * Parser deterministico per i comandi vocali in italiano della Modalità Alla Guida.
 * Riceve la trascrizione grezza da SpeechRecognition e restituisce l'azione corrispondente.
 */
export function parseVoiceCommand(raw: string): VoiceCommand | null {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.toLowerCase().trim();

  // 1. Opzioni di Risposta (Massima priorità)
  // Riconosce: "uno", "prima", "opzione uno", "opzione 1", "risposta uno", "1", "scelgo la prima", ecc.
  if (
    /^(1|uno|prima|primo)\b/i.test(t) ||
    /\b(opzione 1|opzione uno|risposta 1|risposta uno|scelgo 1|scelgo la 1|numero 1|la 1)\b/i.test(t)
  ) {
    return 'opt1';
  }

  // Riconosce: "due", "seconda", "opzione due", "opzione 2", "risposta due", "2", "scelgo la due", ecc.
  if (
    /^(2|due|seconda|secondo)\b/i.test(t) ||
    /\b(opzione 2|opzione due|risposta 2|risposta due|scelgo 2|scelgo la 2|numero 2|la 2)\b/i.test(t)
  ) {
    return 'opt2';
  }

  // Riconosce: "tre", "terza", "opzione tre", "opzione 3", "risposta tre", "3", "scelgo la tre", ecc.
  if (
    /^(3|tre|terza|terzo)\b/i.test(t) ||
    /\b(opzione 3|opzione tre|risposta 3|risposta tre|scelgo 3|scelgo la 3|numero 3|la 3)\b/i.test(t)
  ) {
    return 'opt3';
  }

  // 2. Navigazione tra le domande
  // Riconosce: "avanti", "successiva", "prossima", "salta", "dopo", "next"
  if (/\b(avanti|successiva|prossima|prossimo|salta|passa|next)\b/i.test(t)) {
    return 'next';
  }

  // Riconosce: "indietro", "precedente", "torna indietro", "prima domanda", "back"
  if (/\b(indietro|precedente|torna indietro|back)\b/i.test(t)) {
    return 'prev';
  }

  // 3. Controllo Audio e Ripasso
  // Riconosce: "ripeti", "ascolta", "rileggi", "riparti", "repeat"
  if (/\b(ripeti|ascolta|rileggi|riparti|ancora|repeat)\b/i.test(t)) {
    return 'repeat';
  }

  // 4. Bandierina / Rivedi
  // Riconosce: "bandiera", "flag", "rivedere", "segna", "da rivedere"
  if (/\b(bandiera|flag|segna|rivedere|da rivedere)\b/i.test(t)) {
    return 'flag';
  }

  // 5. Controllo Pilota Automatico (Pausa / Play)
  if (/\b(pausa|ferma|stop|alt|aspett|attendi)\b/i.test(t)) {
    return 'pause';
  }

  if (/\b(continua|riprendi|vai|play|riavvia|avvia)\b/i.test(t)) {
    return 'resume';
  }

  // 6. Guida e Aiuto Contestuale
  // Riconosce: "aiuto", "guida", "comandi", "istruzioni", "cosa posso dire", "help"
  if (/\b(aiuto|guida|comandi|istruzioni|cosa posso dire|help)\b/i.test(t)) {
    return 'help';
  }

  return null;
}
