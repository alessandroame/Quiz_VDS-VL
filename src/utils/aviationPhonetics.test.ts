import { describe, it, expect } from 'vitest';
import {
  normalizeAviationPhonetics,
  formatQuestionForSpeech,
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

    it('espande acronimi aeronautici essenziali con spelling sillabico italiano (VDS/VL, VDS-VL, AeCI, RCT)', () => {
      const input = 'Attestato VDS/VL e manuale VDS-VL con esame Ae.C.I., abilitazione VL e copertura RCT.';
      const output = normalizeAviationPhonetics(input);
      expect(output).toContain('vu di esse, vu elle');
      expect(output).toContain("Aero Club d'Italia");
      expect(output).toContain('vu elle');
      expect(output).toContain('erre ci ti');
      // Never leave isolated uppercase V that neural TTS misreads as "quinto"
      expect(output).not.toMatch(/\bV\b/);
    });

    it('espande correttamente unità di misura (QNH, hPa, km/h, m/s, kt)', () => {
      const input = 'Regolare il QNH a 1013 hPa con vento di 25 km/h e salita a 2 m/s.';
      const output = normalizeAviationPhonetics(input);
      expect(output).toContain('qu enne acca');
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

    it('enforces correct Italian tonic accents on verbs and aeronautical terms', () => {
      const input = 'La portanza decade rapidamente con componente verticale e orizzontale, generando rollio nel circuito.';
      const output = normalizeAviationPhonetics(input);
      expect(output).toContain('decàde');
      expect(output).toContain('verticàle');
      expect(output).toContain('orizzontàle');
      expect(output).toContain('rollìo');
      expect(output).toContain('circùito');
    });

    it('corrects flight instruments and meteorological terms', () => {
      const input = 'Consultare il variometro e le isobare attorno al cumulonembo.';
      const output = normalizeAviationPhonetics(input);
      expect(output).toContain('variòmetro');
      expect(output).toContain('isòbare');
      expect(output).toContain('cumulonèmbo');
    });

    it('preserves sentence-initial capitalization during phonetic replacement', () => {
      const input = 'Rollio e beccheggio. Subito atterrare.';
      const output = normalizeAviationPhonetics(input);
      expect(output).toContain('Rollìo');
      expect(output).toContain('Sùbito');
    });

    it('spells out technical aviation acronyms with Italian phonetic letter names', () => {
      const input = 'Danni da raggi UV prima della VNE controllati via GPS e circuito SIV.';
      const output = normalizeAviationPhonetics(input);
      expect(output).toContain('u vu');
      expect(output).toContain('vu enne e');
      expect(output).toContain('gi pi esse');
      expect(output).toContain('esse i vu');
    });

    it('reads aerodynamic formulas, subscripts, superscripts, and standalone V cleanly in Italian', () => {
      const input = 'R = 1/2 ρ S Cᵣ V² con carico in kg/m², superficie 25 m², rapporto Cₚ / Cᵣ, gas O₂ e velocità V.';
      const output = normalizeAviationPhonetics(input);
      expect(output).toContain('un mezzo');
      expect(output).toContain('ro');
      expect(output).toContain('ci con erre');
      expect(output).toContain('vu al quadrato');
      expect(output).toContain('chilogrammi per metro quadrato');
      expect(output).toContain('25 metri quadrati');
      expect(output).toContain('ci con pi');
      expect(output).toContain('ossigeno');
      expect(output).toContain('velocità vu.');
      expect(output).not.toMatch(/\bV\b/);
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
    it('genera la frase didattica neutrale con risposta corretta, regola e tranello senza prefissi di errore', () => {
      const text = formatExplanationForSpeech(
        2,
        'Attestato VDS valido.',
        'D.P.R. 133/2010 regola di precedenza.',
        'Non confondere con il volo commerciale.'
      );
      expect(text).toContain('La risposta esatta è la due: Attestato vu di esse valido..');
      expect(text).not.toContain('Risposta errata');
      expect(text).toContain('Regola: Decreto del Presidente della Repubblica 133 del 2010');
      expect(text).toContain('Tranello: Non confondere con il volo commerciale.');
    });
  });

  describe('formatQuestionForSpeech', () => {
    it('returns normalized question text without question ID or category preamble', () => {
      const questionText = 'Secondo il D.P.R. 133/2010, chi è responsabile della navigazione?';
      const output = formatQuestionForSpeech(questionText);

      expect(output).toBe('Secondo il Decreto del Presidente della Repubblica 133 del 2010, chi è responsabile della navigazione.');
      expect(output).not.toMatch(/^Domanda\s+\d+/i);
      expect(output).not.toContain('Normativa');
    });

    it('handles aviation units and soft punctuation correctly', () => {
      const questionText = 'A quale quota QNH corrisponde il livello FL 195?';
      const output = formatQuestionForSpeech(questionText);

      expect(output).toBe('A quale quota qu enne acca corrisponde il livello Livello di volo 195.');
    });
  });
});
