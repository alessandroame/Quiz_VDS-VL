import React, { useEffect } from 'react';
import {
  BookOpen,
  Compass,
  Timer,
  AlertTriangle,
  Search,
  BarChart3,
  Play,
  ArrowRight
} from 'lucide-react';
import type { NavTab } from './Navbar';
import { getScenarioByShortcut } from '../utils/navigation';
import { useQuiz } from '../context/QuizContext';

interface HomeScreenProps {
  onSelectTab: (tab: NavTab) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectTab }) => {
  const {
    readinessScore,
    mistakesCount,
    totalSeen,
    questions,
    activeSession
  } = useQuiz();

  const totalQuestions = questions.length; // 474 quiz

  // Navigazione rapida da tastiera: 1..6
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      const scenario = getScenarioByShortcut(e.key);
      if (scenario) {
        onSelectTab(scenario.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectTab]);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4 animate-in fade-in">
      {/* Status Strip: Prontezza & Telemetria Compatta */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 light:bg-white light:border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 light:text-slate-700">
              Preparazione Esame
            </span>
          </div>
        </div>

        {/* Telemetria sintetica a 3 colonne */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-800/80 light:border-slate-100 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-zinc-500 light:text-slate-400 uppercase font-mono block">
              Prontezza
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-base sm:text-lg text-amber-400 light:text-amber-600">
                {readinessScore}%
              </span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-zinc-500 light:text-slate-400 uppercase font-mono block">
              Quiz Esplorati
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-base sm:text-lg text-zinc-200 light:text-slate-800">
                {totalSeen}
              </span>
              <span className="text-zinc-500 text-[11px] font-mono">/{totalQuestions}</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-zinc-500 light:text-slate-400 uppercase font-mono block">
              Errori Attivi
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`font-mono font-bold text-base sm:text-lg ${
                  mistakesCount > 0 ? 'text-rose-400 light:text-rose-600' : 'text-emerald-400 light:text-emerald-600'
                }`}
              >
                {mistakesCount}
              </span>
              <span className="text-zinc-500 text-[11px] font-mono">nel quaderno</span>
            </div>
          </div>
        </div>

        {/* Barra di progresso prontezza */}
        <div className="w-full h-1 rounded-full bg-zinc-800 light:bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, readinessScore))}%` }}
          />
        </div>
      </div>

      {/* Banner Ripresa Rapida Sessione (se presente in Dexie) */}
      {activeSession && (
        <div
          onClick={() => {
            if (activeSession.type === 'exam') {
              onSelectTab(activeSession.examMode === 'tutor' ? 'tutor' : 'exam');
            } else if (activeSession.type === 'topic') {
              onSelectTab('topics');
            } else if (activeSession.type === 'mistakes') {
              onSelectTab('mistakes');
            }
          }}
          className="p-3 sm:p-3.5 bg-amber-950/30 border-2 border-amber-500/50 hover:border-amber-500 rounded-xl flex items-center justify-between gap-3 cursor-pointer shadow-md light:bg-amber-50 light:border-amber-400 transition-all group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 light:text-amber-700">
                Sessione in Corso
              </div>
              <div className="font-bold text-xs sm:text-sm text-zinc-100 light:text-slate-900 truncate">
                {activeSession.subjectName || (activeSession.type === 'exam' ? 'Simulazione Esame' : 'Quaderno Errori')}
              </div>
              <div className="text-[11px] text-zinc-400 light:text-slate-600 truncate">
                Domanda {activeSession.currentIndex + 1} di {activeSession.questionIds.length} • {activeSession.answers ? Object.keys(activeSession.answers).length : 0} risposte date
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-amber-400 light:text-amber-700 text-xs font-bold group-hover:translate-x-0.5 transition-transform flex-shrink-0">
            <span className="hidden sm:inline">Riprendi</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Grid 6 Macro-Pulsanti (I 6 Scenari Puri) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* 1. TUTOR DIDATTICO */}
        <button
          id="btn-home-tutor"
          onClick={() => onSelectTab('tutor')}
          className="group relative p-3.5 sm:p-4 rounded-xl bg-zinc-900 border-2 border-emerald-500/40 hover:border-emerald-500 text-left transition-all shadow-sm hover:shadow-emerald-950/20 light:bg-white light:border-emerald-500/50 light:hover:border-emerald-600 flex flex-col justify-between min-h-[105px] active:scale-[0.99]"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 light:bg-emerald-100 light:text-emerald-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-100 light:text-slate-900 group-hover:text-emerald-400 light:group-hover:text-emerald-600 transition-colors">
                  Tutor Didattico
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 light:bg-emerald-100 light:text-emerald-800 uppercase tracking-wider font-mono">
                  Consigliata
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 light:bg-slate-100 light:text-slate-500 hidden md:inline">
                  [1]
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 light:text-slate-600">
              30 quiz senza limiti di tempo con feedback didattico immediato (Regola e Tranello).
            </p>
          </div>
        </button>

        {/* 2. STUDIO PER MATERIE */}
        <button
          id="btn-home-topics"
          onClick={() => onSelectTab('topics')}
          className="group relative p-3.5 sm:p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/80 text-left transition-all shadow-sm light:bg-white light:border-slate-200 light:hover:border-amber-500 flex flex-col justify-between min-h-[105px] active:scale-[0.99]"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-700 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-100 light:text-slate-900 group-hover:text-amber-400 light:group-hover:text-amber-600 transition-colors">
                  Studio Materie
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 light:bg-slate-100 light:text-slate-700 font-mono">
                  9 Materie
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 light:bg-slate-100 light:text-slate-500 hidden md:inline">
                  [2]
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 light:text-slate-600">
              Esercitazione tematica mirata sulle 9 materie ufficiali del programma AeCI.
            </p>
          </div>
        </button>

        {/* 3. ESAME UFFICIALE AECI */}
        <button
          id="btn-home-exam"
          onClick={() => onSelectTab('exam')}
          className="group relative p-3.5 sm:p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-sky-500/80 text-left transition-all shadow-sm light:bg-white light:border-slate-200 light:hover:border-sky-500 flex flex-col justify-between min-h-[105px] active:scale-[0.99]"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 light:bg-sky-100 light:text-sky-700 flex items-center justify-center">
                  <Timer className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-100 light:text-slate-900 group-hover:text-sky-400 light:group-hover:text-sky-600 transition-colors">
                  Esame Ufficiale
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 light:bg-sky-100 light:text-sky-800 uppercase tracking-wider font-mono">
                  45 Minuti
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 light:bg-slate-100 light:text-slate-500 hidden md:inline">
                  [3]
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 light:text-slate-600">
              Simulazione prova d'esame AeCI: 30 quiz, countdown 45 min, max 3 errori.
            </p>
          </div>
        </button>

        {/* 4. QUADERNO ERRORI */}
        <button
          id="btn-home-mistakes"
          onClick={() => onSelectTab('mistakes')}
          className="group relative p-3.5 sm:p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-rose-500/80 text-left transition-all shadow-sm light:bg-white light:border-slate-200 light:hover:border-rose-500 flex flex-col justify-between min-h-[105px] active:scale-[0.99]"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 light:bg-rose-100 light:text-rose-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-100 light:text-slate-900 group-hover:text-rose-400 light:group-hover:text-rose-600 transition-colors">
                  Quaderno Errori
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                    mistakesCount > 0
                      ? 'bg-rose-500/20 text-rose-300 light:bg-rose-100 light:text-rose-800'
                      : 'bg-emerald-500/20 text-emerald-300 light:bg-emerald-100 light:text-emerald-800'
                  }`}
                >
                  {mistakesCount > 0 ? `${mistakesCount} Errori` : '0 Errori'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 light:bg-slate-100 light:text-slate-500 hidden md:inline">
                  [4]
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 light:text-slate-600">
              Ripasso Leitner: rimozione vincolata a 2 risposte esatte consecutive.
            </p>
          </div>
        </button>

        {/* 5. ARCHIVIO & RICERCA */}
        <button
          id="btn-home-archive"
          onClick={() => onSelectTab('archive')}
          className="group relative p-3.5 sm:p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-purple-500/80 text-left transition-all shadow-sm light:bg-white light:border-slate-200 light:hover:border-purple-500 flex flex-col justify-between min-h-[105px] active:scale-[0.99]"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 light:bg-purple-100 light:text-purple-700 flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-100 light:text-slate-900 group-hover:text-purple-400 light:group-hover:text-purple-600 transition-colors">
                  Archivio & Cerca
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 light:bg-slate-100 light:text-slate-700 font-mono">
                  474 Quiz
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 light:bg-slate-100 light:text-slate-500 hidden md:inline">
                  [5]
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 light:text-slate-600">
              Catalogo completo dei 474 quiz con ricerca full-text, note e preferiti.
            </p>
          </div>
        </button>

        {/* 6. STATISTICHE & TELEMETRIA */}
        <button
          id="btn-home-stats"
          onClick={() => onSelectTab('stats')}
          className="group relative p-3.5 sm:p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/80 text-left transition-all shadow-sm light:bg-white light:border-slate-200 light:hover:border-amber-500 flex flex-col justify-between min-h-[105px] active:scale-[0.99]"
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-700 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-100 light:text-slate-900 group-hover:text-amber-400 light:group-hover:text-amber-600 transition-colors">
                  Statistiche
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 light:bg-amber-100 light:text-amber-800 font-mono">
                  {readinessScore}%
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 light:bg-slate-100 light:text-slate-500 hidden md:inline">
                  [6]
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 light:text-slate-600">
              Radar di rendimento sulle 9 materie e storico delle sessioni svolte.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
