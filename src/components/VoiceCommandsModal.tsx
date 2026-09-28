import React, { useEffect } from 'react';
import {
  X,
  Mic,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Flag,
  Play,
  HelpCircle,
  Headphones
} from 'lucide-react';

interface VoiceCommandsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandItem {
  icon: React.ReactNode;
  title: string;
  primaryPhrase: string;
  alternatives: string[];
  description: string;
}

export const VoiceCommandsModal: React.FC<VoiceCommandsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      icon: <ArrowRight className="w-5 h-5 text-sky-400" />,
      title: 'Scorri Domande',
      primaryPhrase: '"Avanti" • "Indietro"',
      alternatives: ['"Successiva"', '"Prossima"', '"Salta"', '"Precedente"', '"Torna indietro"'],
      description: 'Passa alla domanda successiva o torna a quella precedente.'
    },
    {
      icon: <RotateCcw className="w-5 h-5 text-amber-400" />,
      title: 'Riascolta Audio',
      primaryPhrase: '"Ripeti"',
      alternatives: ['"Ascolta"', '"Rileggi"', '"Riparti"', '"Ancora"'],
      description: 'Rilegge dall\'inizio la domanda attiva e le tre opzioni di risposta.'
    },
    {
      icon: <Flag className="w-5 h-5 text-purple-400" />,
      title: 'Segna per Rivedere',
      primaryPhrase: '"Bandiera"',
      alternatives: ['"Flag"', '"Segna"', '"Rivedere"', '"Da rivedere"'],
      description: 'Applica o rimuove la bandierina per il ripasso a fine sessione.'
    },
    {
      icon: <Play className="w-5 h-5 text-rose-400" />,
      title: 'Pilota Automatico',
      primaryPhrase: '"Pausa" • "Continua"',
      alternatives: ['"Ferma"', '"Stop"', '"Attendi"', '"Riprendi"', '"Vai"'],
      description: 'Sospende o riavvia la riproduzione automatica sequenziale.'
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="voice-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Guida Comandi Vocali
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  Hands-Free
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Controlla l'app a voce senza distogliere lo sguardo dalla strada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    {group.icon}
                    <span className="font-bold text-xs text-white tracking-wide">
                      {group.title}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-emerald-300 font-mono mb-1">
                    {group.primaryPhrase}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug mb-2">
                    {group.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 truncate">
                  Anche: <span className="text-slate-400">{group.alternatives.join(', ')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Cockpit Tips Box */}
          <div className="mt-3 p-3 rounded-xl bg-sky-950/40 border border-sky-800/40 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
              <Headphones className="w-4 h-4 text-sky-400" />
              <span>Consigli Cockpit per la Guida</span>
            </div>
            <ul className="text-[11px] text-sky-200/80 space-y-1 pl-5 list-disc">
              <li>
                Compatibile con <strong>vivavoce Bluetooth auto</strong>, auricolari e caschi.
              </li>
              <li>
                Parla con tono chiaro e naturale dopo che l'assistente vocale ha terminato di leggere.
              </li>
              <li>
                In caso di forte rumore nell'abitacolo, puoi comunque premere i macro-pulsanti sul display.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 flex justify-end">
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
