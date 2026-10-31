import type { AdaptiveVoiceAliasEntry } from '../types/database';

export type VoiceCommand =
  | 'opt1'
  | 'opt2'
  | 'opt3'
  | 'repeat_question'
  | 'repeat_opt1'
  | 'repeat_opt2'
  | 'repeat_opt3'
  | 'next'
  | 'prev'
  | 'repeat'
  | 'flag'
  | 'bookmark'
  | 'pause'
  | 'stop'
  | 'resume'
  | 'explain'
  | 'tutor_on'
  | 'tutor_off'
  | 'toggle_tutor'
  | 'help'
  | 'submit'
  | 'confirm'
  | 'cancel';

export interface VoiceSpeechAlternative {
  transcript: string;
  confidence?: number;
}

export interface VoiceParseContext {
  optionTexts?: readonly string[];
  adaptiveAliases?: Record<string, AdaptiveVoiceAliasEntry>;
  allowOptionContext?: boolean;
}

export type VoiceResolutionSource =
  | 'exact'
  | 'self_correction'
  | 'alternative'
  | 'adaptive_alias'
  | 'option_context';

export interface VoiceResolutionResult {
  command: VoiceCommand;
  matchedTranscript: string;
  source: VoiceResolutionSource;
}

const VALID_VOICE_COMMANDS: ReadonlySet<string> = new Set<VoiceCommand>([
  'opt1',
  'opt2',
  'opt3',
  'repeat_question',
  'repeat_opt1',
  'repeat_opt2',
  'repeat_opt3',
  'next',
  'prev',
  'repeat',
  'flag',
  'bookmark',
  'pause',
  'stop',
  'resume',
  'explain',
  'tutor_on',
  'tutor_off',
  'toggle_tutor',
  'help',
  'submit',
  'confirm',
  'cancel'
]);

const ITALIAN_STOPWORDS: ReadonlySet<string> = new Set([
  'alla',
  'alle',
  'allo',
  'agli',
  'anche',
  'avere',
  'come',
  'con',
  'cosa',
  'cui',
  'dalla',
  'dalle',
  'dallo',
  'degli',
  'della',
  'delle',
  'dello',
  'deve',
  'dopo',
  'entro',
  'essere',
  'fino',
  'hanno',
  'loro',
  'meno',
  'molto',
  'negli',
  'nella',
  'nelle',
  'nello',
  'ogni',
  'oltre',
  'perche',
  'pero',
  'prima',
  'puo',
  'quale',
  'quali',
  'quando',
  'quella',
  'quelle',
  'quelli',
  'quello',
  'questa',
  'queste',
  'questi',
  'questo',
  'saranno',
  'sempre',
  'senza',
  'solo',
  'sono',
  'sopra',
  'sotto',
  'stato',
  'stesso',
  'stessa',
  'sugli',
  'sulla',
  'sulle',
  'sullo',
  'tutta',
  'tutte',
  'tutti',
  'tutto',
  'verso'
]);

const MAX_ADAPTIVE_ALIASES = 40;
const MIN_SECONDARY_CONFIDENCE = 0.35;

/**
 * Strips diacritics, punctuation, and redundant whitespace for deterministic matching.
 */
export function normalizeVoiceText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isValidVoiceCommand(value: string): value is VoiceCommand {
  return VALID_VOICE_COMMANDS.has(value);
}

/**
 * Commands that must interrupt audio playback immediately without waiting for stabilization.
 */
export function isImmediateVoiceCommand(cmd: VoiceCommand): boolean {
  return cmd === 'stop' || cmd === 'pause';
}

/**
 * Commands whose spoken trigger word is also a prefix of multi-word commands
 * (e.g. "ripeti" -> "ripeti domanda" / "ripeti la due").
 */
export function isPrefixAmbiguousCommand(cmd: VoiceCommand, rawOrClean: string): boolean {
  if (cmd !== 'repeat') return false;
  const clean = normalizeVoiceText(rawOrClean);
  return /^(ripeti|rileggi|riascolta|ascolta|ancora|solo)$/.test(clean);
}

/**
 * Extracts trailing self-correction segments when the speaker revises their choice mid-utterance
 * (e.g. "uno anzi due", "la prima no scusa la terza", "non la uno ma la due").
 */
function extractSelfCorrectionTail(clean: string): string | null {
  const pivotRegex =
    /\b(?:anzi\s+no|anzi|no\s+scusa|scusa|aspetta|correggo|volevo\s+dire|cioe)\s+/gi;

  if (pivotRegex.test(clean)) {
    const parts = clean.split(pivotRegex).map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return parts[parts.length - 1];
    }
  }

  const negatedContrastMatch = clean.match(
    /^non\s+(?:l[ao]\s+|il\s+|opzione\s+|risposta\s+|numero\s+)?(?:1|uno|prima|primo|2|due|seconda|secondo|3|tre|terza|terzo)\s+(?:ma\s+)?(.+)$/i
  );
  if (negatedContrastMatch?.[1]) {
    return negatedContrastMatch[1].trim();
  }

  const inlineNoCorrectionMatch = clean.match(
    /\b(?:1|uno|prima|primo|2|due|seconda|secondo|3|tre|terza|terzo)\s+no\s+(.+)$/i
  );
  if (inlineNoCorrectionMatch?.[1]) {
    return inlineNoCorrectionMatch[1].trim();
  }

  return null;
}

/**
 * Matches a single normalized clause against built-in Italian command patterns.
 */
function matchCoreVoiceGrammar(clean: string): VoiceCommand | null {
  if (!clean) return null;

  // 1. Selective Repeat Commands (Highest priority to avoid mistaking "ripeti uno" for "uno")
  if (
    /\b(ripeti|rileggi|riascolta|ascolta|ancora)\s+(la\s+)?domanda\b/i.test(clean) ||
    /\b(solo\s+(la\s+)?domanda)\b/i.test(clean) ||
    /^(la\s+)?domanda$/i.test(clean)
  ) {
    return 'repeat_question';
  }

  if (
    /\b(ripeti|rileggi|riascolta|ascolta|ancora|solo)\s+(l[ao]\s+|il\s+)?(1|uno|prima|primo|opzione\s*(1|uno)|risposta\s*(1|uno))\b/i.test(clean)
  ) {
    return 'repeat_opt1';
  }

  if (
    /\b(ripeti|rileggi|riascolta|ascolta|ancora|solo)\s+(l[ao]\s+|il\s+)?(2|due|seconda|secondo|opzione\s*(2|due)|risposta\s*(2|due))\b/i.test(clean)
  ) {
    return 'repeat_opt2';
  }

  if (
    /\b(ripeti|rileggi|riascolta|ascolta|ancora|solo)\s+(l[ao]\s+|il\s+)?(3|tre|terza|terzo|opzione\s*(3|tre)|risposta\s*(3|tre))\b/i.test(clean)
  ) {
    return 'repeat_opt3';
  }

  // Guard against thinking-aloud negations such as "non la uno" or "non seconda"
  const hasNegatedOption =
    /\bnon\s+(l[ao]\s+|il\s+|opzione\s+|risposta\s+|numero\s+)?(1|uno|prima|primo|2|due|seconda|secondo|3|tre|terza|terzo)\b/i.test(
      clean
    );

  // 2. Answer Options (Direct Selection)
  if (!hasNegatedOption) {
    if (
      /^(1|uno|prima|primo)\b/i.test(clean) ||
      /\b(opzione 1|opzione uno|risposta 1|risposta uno|scelgo 1|scelgo la 1|scelgo uno|scelgo la uno|scelgo la prima|scelgo il primo|numero 1|numero uno|la 1|la uno|la prima|il primo)\b/i.test(clean)
    ) {
      return 'opt1';
    }

    if (
      /^(2|due|seconda|secondo)\b/i.test(clean) ||
      /\b(opzione 2|opzione due|risposta 2|risposta due|scelgo 2|scelgo la 2|scelgo due|scelgo la due|scelgo la seconda|scelgo il secondo|numero 2|numero due|la 2|la due|la seconda|il secondo)\b/i.test(clean)
    ) {
      return 'opt2';
    }

    if (
      /^(3|tre|terza|terzo)\b/i.test(clean) ||
      /\b(opzione 3|opzione tre|risposta 3|risposta tre|scelgo 3|scelgo la 3|scelgo tre|scelgo la tre|scelgo la terza|scelgo il terzo|numero 3|numero tre|la 3|la tre|la terza|il terzo)\b/i.test(clean)
    ) {
      return 'opt3';
    }
  }

  // 3. Navigation between questions
  if (/\b(avanti|successiva|prossima|prossimo|salta|passa|next)\b/i.test(clean)) {
    return 'next';
  }

  if (/\b(indietro|precedente|torna indietro|back)\b/i.test(clean)) {
    return 'prev';
  }

  // 4. Audio Control and Replay
  if (/\b(ripeti|ascolta|rileggi|riparti|ancora|repeat)\b/i.test(clean)) {
    return 'repeat';
  }

  // 5a. Permanent Bookmark
  if (
    /\b(bookmark|segnalibr[oi]|preferit[oia]|ricorda(\s+(la\s+)?(domanda|quesito))?|salva(\s+(la\s+)?(domanda|quesito|nei\s+preferiti))?)\b/i.test(
      clean
    )
  ) {
    return 'bookmark';
  }

  // 5b. Session Review Flag
  if (/\b(bandiera|bandierina|flag|segna|rivedere|da rivedere)\b/i.test(clean)) {
    return 'flag';
  }

  // 6. Session Finish / Submit (prioritized before tutor/pause/stop)
  if (
    /\b(consegna(\s+(la\s+)?(sessione|prova|quiz|esame))?|concludi(\s+(la\s+)?(sessione|prova|quiz|esame|tutor))?|termina(\s+(la\s+)?(sessione|prova|quiz|esame))?|fine\s+sessione|chiudi\s+sessione)\b/i.test(
      clean
    )
  ) {
    return 'submit';
  }

  // 7. Confirmation and Cancellation (for voice confirmation dialogues)
  if (/^(conferma|confermo|si|procedi|esegui)\b/i.test(clean)) {
    return 'confirm';
  }

  if (/^(annulla|annulla tutto|no|lascia stare)\b/i.test(clean)) {
    return 'cancel';
  }

  // 8. Tutor Mode activation / deactivation / toggle
  if (/\b(attiva tutor|abilita tutor|avvia tutor|accendi tutor|tutor on|metti tutor)\b/i.test(clean)) {
    return 'tutor_on';
  }

  if (/\b(disattiva tutor|disabilita tutor|spegni tutor|stop tutor|tutor off|togli tutor)\b/i.test(clean)) {
    return 'tutor_off';
  }

  if (/\b(tutor|modalita tutor)\b/i.test(clean)) {
    return 'toggle_tutor';
  }

  // 9. Explanation and Didactics (Regola / Tranello)
  if (/\b(spiega|spiegami|spiegazione|regola|la regola|tranello|il tranello|perche|motivo)\b/i.test(clean)) {
    return 'explain';
  }

  // 10. Autopilot Control (Pause / Stop / Play)
  if (/\b(stop|ferma|basta|azzera|interrompi)\b/i.test(clean)) {
    return 'stop';
  }

  if (/\b(pausa|alt|aspett|attendi|sospendi)\b/i.test(clean)) {
    return 'pause';
  }

  if (/\b(continua|riprendi|vai|play|riavvia|avvia)\b/i.test(clean)) {
    return 'resume';
  }

  // 11. Help and Contextual Guide
  if (/\b(aiuto|guida|comandi|istruzioni|tutorial|cosa posso dire|help)\b/i.test(clean)) {
    return 'help';
  }

  return null;
}

function extractContentTokens(text: string): string[] {
  const clean = normalizeVoiceText(text);
  if (!clean) return [];
  return clean
    .split(' ')
    .filter(tok => tok.length >= 4 && !ITALIAN_STOPWORDS.has(tok) && !/^\d+$/.test(tok));
}

function tokensMatchStem(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 5 || b.length < 5) return false;
  const minLen = Math.min(a.length, b.length);
  if (Math.abs(a.length - b.length) > 2) return false;
  const stemLen = minLen - 1;
  return a.slice(0, stemLen) === b.slice(0, stemLen);
}

/**
 * Matches spoken distinctive keywords against the 3 answer options of the active question.
 * Requires a strict margin of >= 2 points over any competing option to prevent guessing.
 */
function matchOptionByKeywords(
  clean: string,
  optionTexts: readonly string[]
): 'opt1' | 'opt2' | 'opt3' | null {
  if (optionTexts.length !== 3) return null;
  if (
    /\bnon\s+(l[ao]\s+|il\s+)?(1|2|3|uno|due|tre|prima|primo|seconda|secondo|terza|terzo|opzione|risposta)\b/i.test(
      clean
    )
  ) {
    return null;
  }

  const spokenTokens = Array.from(new Set(extractContentTokens(clean)));
  if (spokenTokens.length === 0) return null;

  const optionTokens = optionTexts.map(opt => extractContentTokens(opt));
  const scores = [0, 0, 0];

  for (const spoken of spokenTokens) {
    const matchedIndices: number[] = [];
    for (let idx = 0; idx < 3; idx++) {
      if (optionTokens[idx].some(optTok => tokensMatchStem(spoken, optTok))) {
        matchedIndices.push(idx);
      }
    }

    if (matchedIndices.length === 1) {
      scores[matchedIndices[0]] += spoken.length >= 6 ? 3 : 2;
    } else if (matchedIndices.length === 2) {
      scores[matchedIndices[0]] += 1;
      scores[matchedIndices[1]] += 1;
    }
  }

  let bestIdx = 0;
  for (let i = 1; i < 3; i++) {
    if (scores[i] > scores[bestIdx]) {
      bestIdx = i;
    }
  }

  const bestScore = scores[bestIdx];
  const secondBest = Math.max(...scores.filter((_, idx) => idx !== bestIdx));

  if (bestScore >= 2 && bestScore - secondBest >= 2) {
    return bestIdx === 0 ? 'opt1' : bestIdx === 1 ? 'opt2' : 'opt3';
  }

  return null;
}

/**
 * Resolves an N-best list of SpeechRecognition alternatives using:
 * 1. Mid-phrase self-correction detection ("uno anzi due" -> opt2)
 * 2. Deterministic Italian grammar across top-K phonetic hypotheses
 * 3. User-specific adaptive pronunciation aliases persisted in IndexedDB
 * 4. Distinctive keyword matching against the 3 active quiz options
 */
export function resolveVoiceCommand(
  alternatives: readonly VoiceSpeechAlternative[],
  context?: VoiceParseContext
): VoiceResolutionResult | null {
  if (!alternatives || alternatives.length === 0) return null;

  // Pass 1: Self-correction and core grammar across N-best hypotheses
  for (let i = 0; i < alternatives.length; i++) {
    const alt = alternatives[i];
    if (!alt || typeof alt.transcript !== 'string') continue;

    if (
      i > 0 &&
      typeof alt.confidence === 'number' &&
      alt.confidence > 0 &&
      alt.confidence < MIN_SECONDARY_CONFIDENCE
    ) {
      continue;
    }

    const clean = normalizeVoiceText(alt.transcript);
    if (!clean) continue;

    const tail = extractSelfCorrectionTail(clean);
    if (tail) {
      const correctedCmd = matchCoreVoiceGrammar(tail);
      if (correctedCmd) {
        return {
          command: correctedCmd,
          matchedTranscript: alt.transcript.trim(),
          source: 'self_correction'
        };
      }
    }

    const directCmd = matchCoreVoiceGrammar(clean);
    if (directCmd) {
      return {
        command: directCmd,
        matchedTranscript: alt.transcript.trim(),
        source: i === 0 ? 'exact' : 'alternative'
      };
    }
  }

  // Pass 2: Learned adaptive user pronunciation aliases (requires >= 2 consistent occurrences)
  if (context?.adaptiveAliases) {
    for (let i = 0; i < alternatives.length; i++) {
      const alt = alternatives[i];
      if (!alt?.transcript) continue;
      const clean = normalizeVoiceText(alt.transcript);
      const entry = context.adaptiveAliases[clean];
      if (entry && entry.occurrences >= 2 && isValidVoiceCommand(entry.command)) {
        return {
          command: entry.command,
          matchedTranscript: alt.transcript.trim(),
          source: 'adaptive_alias'
        };
      }
    }
  }

  // Pass 3: Distinctive keyword match against active question options (when stabilized)
  if (context?.allowOptionContext && context.optionTexts && context.optionTexts.length === 3) {
    const primary = alternatives[0];
    if (primary?.transcript) {
      const clean = normalizeVoiceText(primary.transcript);
      const tail = extractSelfCorrectionTail(clean);
      const targetClean = tail || clean;
      const optCmd = matchOptionByKeywords(targetClean, context.optionTexts);
      if (optCmd) {
        return {
          command: optCmd,
          matchedTranscript: primary.transcript.trim(),
          source: 'option_context'
        };
      }
    }
  }

  return null;
}

/**
 * Deterministic parser for Italian voice commands in Drive Mode.
 * Preserves single-string signature while supporting optional context.
 */
export function parseVoiceCommand(raw: string, context?: VoiceParseContext): VoiceCommand | null {
  if (!raw || typeof raw !== 'string') return null;
  const resolved = resolveVoiceCommand([{ transcript: raw }], context);
  return resolved ? resolved.command : null;
}

/**
 * Records a passive user correction when an unrecognized spoken phrase is immediately followed
 * by a manual touch/keyboard command. Activates an alias only after >= 2 consistent pairings,
 * resets conflicting pairings, excludes question-specific option words, and bounds storage via LRU.
 */
export function recordAdaptiveVoiceCorrection(
  currentMap: Record<string, AdaptiveVoiceAliasEntry> | undefined,
  unrecognizedRaw: string,
  manualCommand: VoiceCommand,
  optionTexts?: readonly string[],
  now: number = Date.now()
): {
  nextMap: Record<string, AdaptiveVoiceAliasEntry>;
  learnedCommand: VoiceCommand | null;
  normalizedPhrase: string;
} | null {
  const clean = normalizeVoiceText(unrecognizedRaw);
  if (!clean || clean.length < 2 || clean.length > 32) return null;

  const words = clean.split(' ');
  if (words.length > 4) return null;

  // Never override built-in commands
  if (matchCoreVoiceGrammar(clean) !== null) return null;

  // Do not memorize question-specific option vocabulary as a permanent global option alias
  if (
    (manualCommand === 'opt1' || manualCommand === 'opt2' || manualCommand === 'opt3') &&
    optionTexts &&
    optionTexts.length === 3
  ) {
    const spokenContent = extractContentTokens(clean);
    const allOptionTokens = optionTexts.flatMap(opt => extractContentTokens(opt));
    if (
      spokenContent.some(tok =>
        allOptionTokens.some(optTok => tokensMatchStem(tok, optTok))
      )
    ) {
      return null;
    }
  }

  const baseMap: Record<string, AdaptiveVoiceAliasEntry> = { ...(currentMap || {}) };
  const existing = baseMap[clean];

  let nextOccurrences = 1;
  if (existing) {
    nextOccurrences = existing.command === manualCommand ? existing.occurrences + 1 : 1;
  }

  baseMap[clean] = {
    phrase: clean,
    command: manualCommand,
    occurrences: nextOccurrences,
    updatedAt: now
  };

  // Enforce LRU cap so settings payload remains tiny
  const entries = Object.values(baseMap);
  if (entries.length > MAX_ADAPTIVE_ALIASES) {
    entries.sort((a, b) => b.updatedAt - a.updatedAt);
    const trimmed: Record<string, AdaptiveVoiceAliasEntry> = {};
    for (const item of entries.slice(0, MAX_ADAPTIVE_ALIASES)) {
      trimmed[item.phrase] = item;
    }
    return {
      nextMap: trimmed,
      learnedCommand: nextOccurrences === 2 ? manualCommand : null,
      normalizedPhrase: clean
    };
  }

  return {
    nextMap: baseMap,
    learnedCommand: nextOccurrences === 2 ? manualCommand : null,
    normalizedPhrase: clean
  };
}
