import React, { useEffect } from 'react';
import {
  X,
  Mic,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Flag,
  Bookmark,
  Play,
  HelpCircle,
  Headphones,
  Volume2,
  GraduationCap,
  Sparkles
} from 'lucide-react';

import { backNavigation } from '../utils/backNavigation';

interface VoiceCommandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplaySpokenGuide?: () => void;
}

interface CommandItem {
  icon: React.ReactNode;
  title: string;
  primaryPhrase: string;
  alternatives: string[];
  description: string;
}

export const VoiceCommandsModal: React.FC<VoiceCommandsModalProps> = ({
  isOpen,
  onClose,
  onReplaySpokenGuide
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const unregister = backNavigation.registerSubModal('voice-commands-modal', onClose);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unregister();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commandGroups: CommandItem[] = [
    {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      title: 'Rispondi al Quiz',
      primaryPhrase: '"Uno" • "Due" • "Tre"',
      alternatives: ['"Prima"', '"Seconda"', '"Terza"', '"Opzione uno"', '"Risposta due"'],
      description: 'Seleziona subito la risposta corrispondente.'
    },
    {
      icon: <ArrowRight className="w-5 h-5 text-amber-400" />,
      title: 'Scorri Domande',
      primaryPhrase: '"Avanti" • "Indietro"',
      alternatives: ['"Successiva"', '"Prossima"', '"Salta"', '"Precedente"', '"Torna indietro"'],
      description: 'Passa alla domanda successiva o torna a quella precedente.'
    },
    {
      icon: <RotateCcw className="w-5 h-5 text-amber-400" />,
      title: 'Riascolta Audio',
      primaryPhrase: '"Ripeti" • "Ripeti Domanda"',
      alternatives: ['"Ripeti uno / due / tre"', '"Rileggi domanda"', '"Solo la due"', '"Riascolta tre"'],
      description: 'Rilegge la sequenza oppure isola selettivamente la sola domanda o una specifica risposta.'
    },
    {
      icon: <Flag className="w-5 h-5 text-purple-400" />,
      title: 'Segna per Rivedere',
      primaryPhrase: '"Bandiera"',
      alternatives: ['"Flag"', '"Segna"', '"Rivedere"', '"Da rivedere"'],
      description: 'Applica o rimuove la bandierina per il ripasso a fine sessione.'
    },
    {
      icon: <Bookmark className="w-5 h-5 text-amber-400" />,
      title: 'Salva nei Preferiti (Bookmark)',
      primaryPhrase: '"Bookmark" • "Segnalibro"',
      alternatives: ['"Preferiti"', '"Salva"', '"Ricorda"'],
      description: 'Aggiunge o rimuove il quesito dai preferiti permanenti per ritrovarlo nell\'Archivio.'
    },
    {
      icon: <Play className="w-5 h-5 text-rose-400" />,
      title: 'Avanzamento Automatico',
      primaryPhrase: '"Pausa" • "Stop" • "Continua"',
      alternatives: ['"Ferma"', '"Basta"', '"Attendi"', '"Riprendi"', '"Vai"'],
      description: 'Mette in pausa, ferma l\'audio (il riavvio riparte dalla domanda) o riprende la lettura.'
    },
    {
      icon: <GraduationCap className="w-5 h-5 text-sky-400" />,
      title: 'Spiegazione Didattica',
      primaryPhrase: '"Spiega" • "Regola"',
      alternatives: ['"Spiegami"', '"Tranello"', '"Perché"', '"Motivo"'],
      description: 'Ascolta ad alta voce la spiegazione completa (Regola e Tranello) del quesito corrente.'
    },
    {
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      title: 'Modalità Tutor',
      primaryPhrase: '"Attiva Tutor" • "Tutor Off"',
      alternatives: ['"Tutor"', '"Modalità tutor"', '"Disattiva tutor"'],
      description: 'Abilita la lettura didattica continua sincronizzata prima dell\'avanzamento automatico.'
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      title: 'Concludi o Consegna',
      primaryPhrase: '"Concludi" • "Consegna"',
      alternatives: ['"Termina"', '"Fine sessione"', '"Conferma"', '"Annulla"'],
      description: 'Termina la sessione o consegna l\'esame con dialogo vocale di conferma di sicurezza.'
    },
    {
      icon: <HelpCircle className="w-5 h-5 text-indigo-400" />,
      title: 'Guida Vocale',
      primaryPhrase: '"Aiuto"',
      alternatives: ['"Guida"', '"Comandi"', '"Istruzioni"', '"Cosa posso dire"'],
      description: 'Apre questa schermata di aiuto direttamente con la voce.'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
    >
      <div
        className="bg-zinc-900 light:bg-white border border-zinc-700 light:border-slate-300 light:shadow-xl text-zinc-100 light:text-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-700 light:border-slate-300 flex items-center justify-between bg-zinc-950/70 light:bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="voice-modal-title" className="text-base sm:text-lg font-bold text-white light:text-slate-900 tracking-tight">
                  Guida Comandi Vocali
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60 light:bg-emerald-100 light:text-emerald-900 light:border-emerald-300">
                  Hands-Free
                </span>
              </div>
              <p className="text-xs text-zinc-400 light:text-slate-600">
                Controlla l'app a voce senza dover toccare lo schermo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-200 transition-colors"
            title="Chiudi (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Command List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {commandGroups.map((group, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-700 hover:border-zinc-600 light:bg-white light:border-slate-300 light:shadow-sm light:hover:border-slate-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    {group.icon}
                    <span className="font-bold text-xs text-white light:text-slate-900 tracking-wide">
                      {group.title}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-emerald-300 light:text-emerald-700 font-mono mb-1">
                    {group.primaryPhrase}
                  </div>
                  <p className="text-[11px] text-zinc-300 light:text-slate-700 leading-snug mb-2">
                    {group.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-zinc-700/60 light:border-slate-200 text-[10px] text-zinc-400 light:text-slate-500 truncate">
                  Anche: <span className="text-zinc-300 light:text-slate-700">{group.alternatives.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Riascolto Spiegazione Vocale */}
          {onReplaySpokenGuide && (
            <div className="mt-3 p-3 rounded-xl bg-zinc-900 border border-zinc-700 light:bg-white light:border-slate-300 light:shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-700">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white light:text-slate-900">Spiegazione Vocale di Benvenuto</div>
                  <div className="text-[11px] text-zinc-400 light:text-slate-600">Riascolta l'introduzione alla Modalità Mani Libere</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReplaySpokenGuide();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-colors flex-shrink-0"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Ascolta</span>
              </button>
            </div>
          )}

          {/* Cockpit Tips Box */}
          <div className="mt-3 p-3 rounded-xl bg-amber-950/30 border border-amber-800/60 light:bg-amber-50 light:border-amber-300 light:shadow-sm space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 light:text-amber-900">
              <Headphones className="w-4 h-4 text-amber-400" />
              <span>Consigli per l'ascolto a mani libere (Bici / Corsa / Viaggi)</span>
            </div>
            <ul className="text-[11px] text-amber-200/80 light:text-amber-800 space-y-1 pl-5 list-disc">
              <li>
                Compatibile con <strong>auricolari</strong>, vivavoce Bluetooth e caschi con interfono.
              </li>
              <li>
                Parla con tono chiaro e naturale dopo che l'assistente vocale ha terminato di leggere.
              </li>
              <li>
                Con vibrazioni da manubrio o corsa, tocca direttamente le 3 macro-fasce a tutta larghezza.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-700 light:border-slate-300 bg-zinc-950/70 light:bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Ho Capito, Torna al Quiz</span>
          </button>
        </div>
      </div>
    </div>
  );
};
