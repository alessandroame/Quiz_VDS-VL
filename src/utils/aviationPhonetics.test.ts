import { describe, it, expect } from 'vitest';
import {
  normalizeAviationPhonetics,
  formatOptionForSpeech,
  formatExplanationForSpeech
} from './aviationPhonetics';

describe('aviationPhonetics', () => {
  describe('normalizeAviationPhonetics', () => {
    it('espande D.P.R. con numero e anno in Decreto del Presidente della Repubblica', () => {
      const input = 'Secondo il D.P.R. 133/2010 il pilota è responsabile.';
      const output = normalizeAviationPhonetics(input);
      expect(output).toContain('Decreto del Presidente della Repubblica 133 del 2010');
      expect(output).not.toContain('D.P.R.');
    });

    it('espande acronimi aeronautici essenziali (VDS/VL, AeCI, RCT)', () => {
      const input = 'Attestato VDS/VL con esame Ae.C.I. e copertura RCT.';
      const output = normalizeAviationPhonetics(input);
      expect(output).toContain('V D S Volo Libero');
      expect(output).toContain("Aero Club d'Italia");
      expect(output).toContain('R C T');
    });

    it('espande correttamente unità di misura (QNH, hPa, km/h, m/s, kt)', () => {
      const input = 'Regolare il QNH a 1013 hPa con vento di 25 km/h e salita a 2 m/s.';
      const output = normalizeAviationPhonetics(input);
      expect(output).toContain('Q N H');
      expect(output).toContain('ettopascal');
      expect(output).toContain("chilometri all'ora");
      expect(output).toContain('metri al secondo');
    });

    it('espande livelli di volo FL e temperature', () => {
      const input = 'Salita a FL 195 con temperatura di 15 °C.';
      const output = normalizeAviationPhonetics(input);
      expect(output).toContain('Livello di volo 195');
      expect(output).toContain('15 gradi centigradi');
    });

    it('ammorbidisce la punteggiatura interrogativa a fine frase', () => {
      const input = 'Chi è il responsabile della condotta del mezzo?';
      const output = normalizeAviationPhonetics(input);
      expect(output.endsWith('.')).toBe(true);
      expect(output).not.toContain('?');
    });
  });

  describe('formatOptionForSpeech', () => {
    it('antepone il numero in italiano cockpit (Uno., Due., Tre.)', () => {
      expect(formatOptionForSpeech(1, 'Il pilota.')).toBe('Uno. Il pilota.');
      expect(formatOptionForSpeech(2, 'Il passeggero.')).toBe('Due. Il passeggero.');
      expect(formatOptionForSpeech(3, "L'istruttore.")).toBe("Tre. L'istruttore.");
    });
  });

  describe('formatExplanationForSpeech', () => {
    it('genera la frase didattica con risposta corretta, regola e tranello', () => {
      const text = formatExplanationForSpeech(
        2,
        'Attestato VDS valido.',
        'D.P.R. 133/2010 regola di precedenza.',
        'Non confondere con il volo commerciale.'
      );
      expect(text).toContain('Risposta errata. La risposta esatta è la due: Attestato V D S valido..');
      expect(text).toContain('Regola: Decreto del Presidente della Repubblica 133 del 2010');
      expect(text).toContain('Tranello: Non confondere con il volo commerciale.');
    });
  });
});
