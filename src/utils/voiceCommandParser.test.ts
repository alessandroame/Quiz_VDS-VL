import { describe, it, expect } from 'vitest';
import {
  parseVoiceCommand,
  resolveVoiceCommand,
  recordAdaptiveVoiceCorrection
} from './voiceCommandParser';

describe('Suite: voiceCommandParser (Parser comandi vocali Modalità Guida)', () => {
  it('VC-01: riconosce le opzioni di risposta con varie inflessioni', () => {
    // Opzione 1
    expect(parseVoiceCommand('uno')).toBe('opt1');
    expect(parseVoiceCommand('1')).toBe('opt1');
    expect(parseVoiceCommand('prima')).toBe('opt1');
    expect(parseVoiceCommand('la prima')).toBe('opt1');
    expect(parseVoiceCommand('la 1')).toBe('opt1');
    expect(parseVoiceCommand('la uno')).toBe('opt1');
    expect(parseVoiceCommand('opzione uno')).toBe('opt1');
    expect(parseVoiceCommand('opzione 1')).toBe('opt1');
    expect(parseVoiceCommand('scelgo la 1')).toBe('opt1');
    expect(parseVoiceCommand('scelgo la prima')).toBe('opt1');
    expect(parseVoiceCommand('uno.')).toBe('opt1');

    // Opzione 2
    expect(parseVoiceCommand('due')).toBe('opt2');
    expect(parseVoiceCommand('2')).toBe('opt2');
    expect(parseVoiceCommand('seconda')).toBe('opt2');
    expect(parseVoiceCommand('la seconda')).toBe('opt2');
    expect(parseVoiceCommand('la due')).toBe('opt2');
    expect(parseVoiceCommand('opzione due')).toBe('opt2');
    expect(parseVoiceCommand('risposta 2')).toBe('opt2');
    expect(parseVoiceCommand('la 2')).toBe('opt2');
    expect(parseVoiceCommand('scelgo la seconda')).toBe('opt2');
    expect(parseVoiceCommand('due!')).toBe('opt2');

    // Opzione 3
    expect(parseVoiceCommand('tre')).toBe('opt3');
    expect(parseVoiceCommand('3')).toBe('opt3');
    expect(parseVoiceCommand('terza')).toBe('opt3');
    expect(parseVoiceCommand('la terza')).toBe('opt3');
    expect(parseVoiceCommand('la tre')).toBe('opt3');
    expect(parseVoiceCommand('opzione tre')).toBe('opt3');
    expect(parseVoiceCommand('scelgo 3')).toBe('opt3');
    expect(parseVoiceCommand('scelgo la terza')).toBe('opt3');
  });

  it('VC-02: riconosce i comandi di navigazione', () => {
    expect(parseVoiceCommand('avanti')).toBe('next');
    expect(parseVoiceCommand('prossima')).toBe('next');
    expect(parseVoiceCommand('successiva')).toBe('next');
    expect(parseVoiceCommand('salta')).toBe('next');
    expect(parseVoiceCommand('next')).toBe('next');

    expect(parseVoiceCommand('indietro')).toBe('prev');
    expect(parseVoiceCommand('precedente')).toBe('prev');
    expect(parseVoiceCommand('torna indietro')).toBe('prev');
  });

  it('VC-03: riconosce comandi audio e ripetizione generica', () => {
    expect(parseVoiceCommand('ripeti')).toBe('repeat');
    expect(parseVoiceCommand('ascolta')).toBe('repeat');
    expect(parseVoiceCommand('rileggi')).toBe('repeat');
    expect(parseVoiceCommand('ancora')).toBe('repeat');
  });

  it('VC-03b: riconosce ripetizione selettiva della sola domanda e delle singole risposte', () => {
    // Solo Domanda
    expect(parseVoiceCommand('ripeti domanda')).toBe('repeat_question');
    expect(parseVoiceCommand('ripeti la domanda')).toBe('repeat_question');
    expect(parseVoiceCommand('rileggi domanda')).toBe('repeat_question');
    expect(parseVoiceCommand('solo domanda')).toBe('repeat_question');
    expect(parseVoiceCommand('la domanda')).toBe('repeat_question');
    expect(parseVoiceCommand('riascolta domanda')).toBe('repeat_question');
    expect(parseVoiceCommand('ancora domanda')).toBe('repeat_question');
    expect(parseVoiceCommand('ascolta la domanda')).toBe('repeat_question');

    // Solo Opzione 1
    expect(parseVoiceCommand('ripeti uno')).toBe('repeat_opt1');
    expect(parseVoiceCommand('ripeti la uno')).toBe('repeat_opt1');
    expect(parseVoiceCommand('ripeti prima')).toBe('repeat_opt1');
    expect(parseVoiceCommand('ripeti opzione uno')).toBe('repeat_opt1');
    expect(parseVoiceCommand('rileggi uno')).toBe('repeat_opt1');
    expect(parseVoiceCommand('solo uno')).toBe('repeat_opt1');
    expect(parseVoiceCommand('solo la uno')).toBe('repeat_opt1');
    expect(parseVoiceCommand('riascolta uno')).toBe('repeat_opt1');
    expect(parseVoiceCommand('ascolta prima')).toBe('repeat_opt1');

    // Solo Opzione 2
    expect(parseVoiceCommand('ripeti due')).toBe('repeat_opt2');
    expect(parseVoiceCommand('ripeti la due')).toBe('repeat_opt2');
    expect(parseVoiceCommand('ripeti seconda')).toBe('repeat_opt2');
    expect(parseVoiceCommand('ripeti opzione due')).toBe('repeat_opt2');
    expect(parseVoiceCommand('rileggi la due')).toBe('repeat_opt2');
    expect(parseVoiceCommand('solo due')).toBe('repeat_opt2');
    expect(parseVoiceCommand('solo la due')).toBe('repeat_opt2');
    expect(parseVoiceCommand('riascolta due')).toBe('repeat_opt2');
    expect(parseVoiceCommand('ascolta la due')).toBe('repeat_opt2');

    // Solo Opzione 3
    expect(parseVoiceCommand('ripeti tre')).toBe('repeat_opt3');
    expect(parseVoiceCommand('ripeti la tre')).toBe('repeat_opt3');
    expect(parseVoiceCommand('ripeti terza')).toBe('repeat_opt3');
    expect(parseVoiceCommand('ripeti opzione 3')).toBe('repeat_opt3');
    expect(parseVoiceCommand('rileggi tre')).toBe('repeat_opt3');
    expect(parseVoiceCommand('solo tre')).toBe('repeat_opt3');
    expect(parseVoiceCommand('solo la tre')).toBe('repeat_opt3');
    expect(parseVoiceCommand('riascolta tre')).toBe('repeat_opt3');
    expect(parseVoiceCommand('ascolta la tre')).toBe('repeat_opt3');
  });

  it('VC-04: riconosce contrassegno bandiera', () => {
    expect(parseVoiceCommand('bandiera')).toBe('flag');
    expect(parseVoiceCommand('flag')).toBe('flag');
    expect(parseVoiceCommand('da rivedere')).toBe('flag');
    expect(parseVoiceCommand('segna')).toBe('flag');
  });

  it('VC-04b: riconosce salvataggio preferiti e bookmark permanente', () => {
    expect(parseVoiceCommand('bookmark')).toBe('bookmark');
    expect(parseVoiceCommand('segnalibro')).toBe('bookmark');
    expect(parseVoiceCommand('segnalibri')).toBe('bookmark');
    expect(parseVoiceCommand('preferiti')).toBe('bookmark');
    expect(parseVoiceCommand('preferito')).toBe('bookmark');
    expect(parseVoiceCommand('salva')).toBe('bookmark');
    expect(parseVoiceCommand('salva domanda')).toBe('bookmark');
    expect(parseVoiceCommand('salva quesito')).toBe('bookmark');
    expect(parseVoiceCommand('salva nei preferiti')).toBe('bookmark');
  });

  it('VC-05: riconosce controllo avanzamento automatico (pausa, stop, ripresa)', () => {
    expect(parseVoiceCommand('pausa')).toBe('pause');
    expect(parseVoiceCommand('alt')).toBe('pause');
    expect(parseVoiceCommand('attendi')).toBe('pause');

    expect(parseVoiceCommand('stop')).toBe('stop');
    expect(parseVoiceCommand('ferma')).toBe('stop');
    expect(parseVoiceCommand('basta')).toBe('stop');
    expect(parseVoiceCommand('interrompi')).toBe('stop');

    expect(parseVoiceCommand('continua')).toBe('resume');
    expect(parseVoiceCommand('riprendi')).toBe('resume');
    expect(parseVoiceCommand('vai')).toBe('resume');
  });

  it('VC-06: riconosce richiesta aiuto e guida', () => {
    expect(parseVoiceCommand('aiuto')).toBe('help');
    expect(parseVoiceCommand('guida')).toBe('help');
    expect(parseVoiceCommand('comandi')).toBe('help');
    expect(parseVoiceCommand('istruzioni')).toBe('help');
    expect(parseVoiceCommand('tutorial')).toBe('help');
    expect(parseVoiceCommand('cosa posso dire')).toBe('help');
    expect(parseVoiceCommand('help')).toBe('help');
  });

  it('VC-08: riconosce comandi di spiegazione didattica (Regola e Tranello)', () => {
    expect(parseVoiceCommand('spiega')).toBe('explain');
    expect(parseVoiceCommand('spiegami')).toBe('explain');
    expect(parseVoiceCommand('spiegazione')).toBe('explain');
    expect(parseVoiceCommand('regola')).toBe('explain');
    expect(parseVoiceCommand('la regola')).toBe('explain');
    expect(parseVoiceCommand('tranello')).toBe('explain');
    expect(parseVoiceCommand('il tranello')).toBe('explain');
    expect(parseVoiceCommand('perché')).toBe('explain');
    expect(parseVoiceCommand('perche')).toBe('explain');
    expect(parseVoiceCommand('motivo')).toBe('explain');
  });

  it('VC-09: riconosce comandi di attivazione, disattivazione e commutazione tutor', () => {
    expect(parseVoiceCommand('attiva tutor')).toBe('tutor_on');
    expect(parseVoiceCommand('abilita tutor')).toBe('tutor_on');
    expect(parseVoiceCommand('avvia tutor')).toBe('tutor_on');
    expect(parseVoiceCommand('tutor on')).toBe('tutor_on');

    expect(parseVoiceCommand('disattiva tutor')).toBe('tutor_off');
    expect(parseVoiceCommand('disabilita tutor')).toBe('tutor_off');
    expect(parseVoiceCommand('spegni tutor')).toBe('tutor_off');
    expect(parseVoiceCommand('stop tutor')).toBe('tutor_off');
    expect(parseVoiceCommand('tutor off')).toBe('tutor_off');

    expect(parseVoiceCommand('tutor')).toBe('toggle_tutor');
    expect(parseVoiceCommand('modalità tutor')).toBe('toggle_tutor');
    expect(parseVoiceCommand('modalita tutor')).toBe('toggle_tutor');
  });

  it('VC-10: riconosce comandi di conclusione e consegna sessione', () => {
    expect(parseVoiceCommand('consegna')).toBe('submit');
    expect(parseVoiceCommand('consegna esame')).toBe('submit');
    expect(parseVoiceCommand('consegna quiz')).toBe('submit');
    expect(parseVoiceCommand('consegna la sessione')).toBe('submit');
    expect(parseVoiceCommand('concludi')).toBe('submit');
    expect(parseVoiceCommand('concludi sessione')).toBe('submit');
    expect(parseVoiceCommand('concludi tutor')).toBe('submit');
    expect(parseVoiceCommand('concludi esame')).toBe('submit');
    expect(parseVoiceCommand('termina')).toBe('submit');
    expect(parseVoiceCommand('termina sessione')).toBe('submit');
    expect(parseVoiceCommand('termina quiz')).toBe('submit');
    expect(parseVoiceCommand('fine sessione')).toBe('submit');
    expect(parseVoiceCommand('chiudi sessione')).toBe('submit');
  });

  it('VC-11: riconosce comandi di conferma e annullamento per dialoghi di sicurezza', () => {
    expect(parseVoiceCommand('conferma')).toBe('confirm');
    expect(parseVoiceCommand('confermo')).toBe('confirm');
    expect(parseVoiceCommand('si')).toBe('confirm');
    expect(parseVoiceCommand('sì')).toBe('confirm');
    expect(parseVoiceCommand('procedi')).toBe('confirm');
    expect(parseVoiceCommand('esegui')).toBe('confirm');

    expect(parseVoiceCommand('annulla')).toBe('cancel');
    expect(parseVoiceCommand('annulla tutto')).toBe('cancel');
    expect(parseVoiceCommand('no')).toBe('cancel');
    expect(parseVoiceCommand('lascia stare')).toBe('cancel');
  });

  it('VC-07: ignora input vuoti o frasi non correlate', () => {
    expect(parseVoiceCommand('')).toBeNull();
    expect(parseVoiceCommand('buongiorno')).toBeNull();
    expect(parseVoiceCommand('che tempo fa oggi')).toBeNull();
    expect(parseVoiceCommand('non lo so')).toBeNull();
  });

  it('VC-12: resolves mid-phrase self-corrections and blocks negated option thoughts', () => {
    expect(parseVoiceCommand('uno anzi due')).toBe('opt2');
    expect(parseVoiceCommand('la prima no scusa la terza')).toBe('opt3');
    expect(parseVoiceCommand('uno no due')).toBe('opt2');
    expect(parseVoiceCommand('non la uno ma la due')).toBe('opt2');
    expect(parseVoiceCommand('uno anzi due scusa tre')).toBe('opt3');
    expect(parseVoiceCommand('ripeti uno anzi ripeti due')).toBe('repeat_opt2');

    // Thinking-aloud negations without affirmative replacement must not select an answer
    expect(parseVoiceCommand('non la uno')).toBeNull();
    expect(parseVoiceCommand('non seconda')).toBeNull();
  });

  it('VC-13: selects valid command from N-best alternatives when top hypothesis is noisy', () => {
    const res = resolveVoiceCommand([
      { transcript: 'treno', confidence: 0.49 },
      { transcript: 'tre', confidence: 0.44 }
    ]);
    expect(res).not.toBeNull();
    expect(res?.command).toBe('opt3');
    expect(res?.source).toBe('alternative');

    // Rejects secondary alternative below minimum confidence threshold (0.35)
    const rejected = resolveVoiceCommand([
      { transcript: 'rumore vento', confidence: 0.65 },
      { transcript: 'due', confidence: 0.15 }
    ]);
    expect(rejected).toBeNull();
  });

  it('VC-14: matches distinctive active question option keywords and refuses ambiguous shared terms', () => {
    const options7006 = [
      "Volando in linea retta ed all'incidenza massima consentita.",
      'Volando comunque al regime di massima efficienza in aria calma.',
      'Volando in linea retta ad una incidenza compresa tra quella di massima efficienza in aria calma e quella di stallo.'
    ];

    expect(
      parseVoiceCommand('quella di stallo', {
        optionTexts: options7006,
        allowOptionContext: true
      })
    ).toBe('opt3');

    expect(
      parseVoiceCommand('massima consentita', {
        optionTexts: options7006,
        allowOptionContext: true
      })
    ).toBe('opt1');

    // "aria calma" is shared by option 2 and option 3 -> must return null instead of guessing
    expect(
      parseVoiceCommand('aria calma', {
        optionTexts: options7006,
        allowOptionContext: true
      })
    ).toBeNull();
  });

  it('VC-15: learns adaptive user pronunciation aliases only after 2 consistent corrections and blocks option-text poisoning', () => {
    const sampleOpts = [
      'Ispezionarlo attentamente sulle parti dolenti.',
      'Chiamare immediatamente eliambulanza o soccorso attrezzato.',
      'Cercare di metterlo in piedi.'
    ];

    // 1st occurrence: candidate stored (occurrences = 1), not yet active
    const step1 = recordAdaptiveVoiceCorrection(undefined, 'dura', 'opt2', sampleOpts, 1000);
    expect(step1).not.toBeNull();
    expect(step1?.learnedCommand).toBeNull();
    expect(parseVoiceCommand('dura', { adaptiveAliases: step1?.nextMap })).toBeNull();

    // 2nd consistent occurrence: promoted to active learned alias (occurrences = 2)
    const step2 = recordAdaptiveVoiceCorrection(step1?.nextMap, 'Dura!', 'opt2', sampleOpts, 2000);
    expect(step2?.learnedCommand).toBe('opt2');
    expect(parseVoiceCommand('dura', { adaptiveAliases: step2?.nextMap })).toBe('opt2');

    // Conflicting pairing resets occurrences back to 1 so inconsistent noise stops triggering
    const conflict = recordAdaptiveVoiceCorrection(step2?.nextMap, 'dura', 'opt3', sampleOpts, 3000);
    expect(conflict?.learnedCommand).toBeNull();
    expect(parseVoiceCommand('dura', { adaptiveAliases: conflict?.nextMap })).toBeNull();

    // Question-specific words ("eliambulanza") must never be memorized as permanent global option aliases
    const poisoned = recordAdaptiveVoiceCorrection(undefined, 'eliambulanza', 'opt2', sampleOpts, 4000);
    expect(poisoned).toBeNull();
  });
});
