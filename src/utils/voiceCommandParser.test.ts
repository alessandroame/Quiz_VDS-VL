import { describe, it, expect } from 'vitest';
import { parseVoiceCommand } from './voiceCommandParser';

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

  it('VC-03: riconosce comandi audio e ripetizione', () => {
    expect(parseVoiceCommand('ripeti')).toBe('repeat');
    expect(parseVoiceCommand('ascolta')).toBe('repeat');
    expect(parseVoiceCommand('rileggi')).toBe('repeat');
    expect(parseVoiceCommand('ancora')).toBe('repeat');
  });

  it('VC-04: riconosce contrassegno bandiera', () => {
    expect(parseVoiceCommand('bandiera')).toBe('flag');
    expect(parseVoiceCommand('flag')).toBe('flag');
    expect(parseVoiceCommand('da rivedere')).toBe('flag');
    expect(parseVoiceCommand('segna')).toBe('flag');
  });

  it('VC-05: riconosce controllo pilota automatico (pausa, stop, ripresa)', () => {
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
    expect(parseVoiceCommand('spiegazione')).toBe('help');
    expect(parseVoiceCommand('tutorial')).toBe('help');
    expect(parseVoiceCommand('cosa posso dire')).toBe('help');
    expect(parseVoiceCommand('help')).toBe('help');
  });

  it('VC-07: ignora input vuoti o frasi non correlate', () => {
    expect(parseVoiceCommand('')).toBeNull();
    expect(parseVoiceCommand('buongiorno')).toBeNull();
    expect(parseVoiceCommand('che tempo fa oggi')).toBeNull();
    expect(parseVoiceCommand('non lo so')).toBeNull();
  });
});
