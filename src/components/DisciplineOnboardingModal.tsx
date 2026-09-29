import React, { useState } from 'react';
import { Wind, Compass, Layers, CheckCircle2, ArrowRight, Shield, Info } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';
import type { Discipline } from '../types/quiz';

interface DisciplineOnboardingModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface DisciplineCardData {
  id: Discipline;
  title: string;
  countLabel: string;
  description: string;
  icon: React.ReactNode;
}

export const DisciplineOnboardingModal: React.FC<DisciplineOnboardingModalProps> = ({
  isOpen,
  onClose
}) => {
  const { settings, updateSetting, setDisciplineFilter } = useQuiz();
  const [selected, setSelected] = useState<Discipline>(settings.disciplinePreference || 'paraglider');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const disciplines: DisciplineCardData[] = [
    {
      id: 'paraglider',
      title: 'Parapendio',
      countLabel: '474 Quiz (428 comuni + 46 esclusivi)',
      description: 'Include comandi freni, elevatori, fascio funicolare, cassoni e centine. Esclude i comandi rigidi del deltaplano (trapezio e barra).',
      icon: <Wind className="w-5 h-5 text-emerald-400 light:text-emerald-600" />
    },
    {
      id: 'hang_glider',
      title: 'Deltaplano',
      countLabel: '458 Quiz (428 comuni + 30 esclusivi)',
      description: 'Include barra di controllo/trapezio, trave di chiglia, cavi e spostamento baricentro. Esclude i comandi a freno del parapendio.',
      icon: <Compass className="w-5 h-5 text-cyan-400 light:text-cyan-600" />
    },
    {
      id: 'all',
      title: 'Tutti i Quiz',
      countLabel: '504 Quiz AeCI (Completo)',
      description: 'Catalogo ministeriale integrale senza alcuna esclusione. Ideale per istruttori o per chi desidera una preparazione multidisciplinare.',
      icon: <Layers className="w-5 h-5 text-amber-400 light:text-amber-600" />
    }
  ];

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await setDisciplineFilter(selected);
      await updateSetting('disciplineOnboardingDone', true);
      if (onClose) onClose();
    } catch (err) {
      console.error('Failed to save discipline onboarding preference:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discipline-onboarding-title"
    >
      <div className="w-full max-w-lg my-auto bg-zinc-950 light:bg-white border border-zinc-800 light:border-slate-200 rounded-2xl shadow-2xl p-5 sm:p-6 text-zinc-100 light:text-slate-900 animate-scale-up space-y-4">
        {/* Header con icona e spiegazione */}
        <div className="space-y-1.5 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 mb-1">
            <Shield className="w-6 h-6" />
          </div>
          <h2 id="discipline-onboarding-title" className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 light:text-slate-900 font-mono">
            Quale corso stai seguendo?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 light:text-slate-600 max-w-md mx-auto">
            Personalizza il catalogo delle domande per escludere i quiz non pertinenti al tuo mezzo di volo:
          </p>
        </div>

        {/* Schede di selezione disciplina */}
        <div
          role="radiogroup"
          aria-label="Selezione corso di volo iniziale"
          className="space-y-2.5 pt-1"
        >
          {disciplines.map(disc => {
            const isSelected = selected === disc.id;
            return (
              <div
                key={disc.id}
                id={`onboarding-option-${disc.id}`}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => setSelected(disc.id)}
                onKeyDown={e => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setSelected(disc.id);
                  }
                }}
                className={`group relative p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer select-none text-left ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 light:bg-amber-50 light:border-amber-500 ring-1 ring-amber-500/40 shadow-sm'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900 light:bg-slate-50 light:border-slate-200 light:hover:border-slate-300 light:hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icona velivolo */}
                  <div className={`p-2 rounded-lg border mt-0.5 flex-shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500/40 light:bg-amber-100 light:border-amber-300'
                      : 'bg-zinc-800/80 border-zinc-700/60 light:bg-slate-200 light:border-slate-300'
                  }`}>
                    {disc.icon}
                  </div>

                  {/* Informazioni testuali */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-sm sm:text-base text-zinc-100 light:text-slate-900 font-mono">
                        {disc.title}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400 light:text-slate-500">
                        {disc.countLabel}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 light:text-slate-600 mt-1 leading-relaxed">
                      {disc.description}
                    </p>
                  </div>

                  {/* Indicatore radio di selezione */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500 text-zinc-950 shadow-sm'
                        : 'border-zinc-700 light:border-slate-300 bg-transparent'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-4 h-4 fill-zinc-950 text-amber-400 stroke-[2.5]" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Box informativo di salvaguardia teoria comune */}
        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 light:bg-slate-100 light:border-slate-200 text-xs text-zinc-400 light:text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            I <strong className="text-zinc-200 light:text-slate-800">428 quiz di teoria comune</strong> (aerodinamica, meteo, normativa D.P.R. 133/2010, primo soccorso, sicurezza e strumenti) rimangono sempre inclusi. Potrai modificare questa scelta in qualsiasi momento nelle <strong className="text-zinc-200 light:text-slate-800">Impostazioni</strong> o dal selettore rapido.
          </p>
        </div>

        {/* Pulsante primario di conferma */}
        <div className="pt-1">
          <button
            id="btn-confirm-discipline-onboarding"
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full py-3.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-zinc-950 font-bold text-sm sm:text-base font-mono flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            <span>Conferma e Inizia lo Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
