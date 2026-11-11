import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Square,
  Edit3,
  Trash2,
  Plus
} from 'lucide-react';
import { useQuiz } from '../context/QuizContext';
import { useAviationVoice } from '../hooks/useAviationVoice';
import type { Question } from '../types/quiz';

interface ArchiveItemExpandedContentProps {
  question: Question;
}

export interface ArchiveItemProps {
  question: Question;
  isExpanded: boolean;
  onToggle: () => void;
}

const ArchiveItemExpandedContent: React.FC<ArchiveItemExpandedContentProps> = ({ question: q }) => {
  const { statsMap, settings, saveNote } = useQuiz();
  const stat = statsMap.get(q.id);

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(stat?.userNote || '');

  useEffect(() => {
    setIsEditingNote(false);
    setNoteText(stat?.userNote || '');
  }, [q.id, stat?.userNote]);

  const {
    isPlaying,
    isPaused,
    isThisQuestionActive,
    isPartPlaying,
    isPartPaused,
    isPartActive,
    togglePlayPause,
    restartFullSequence,
    playQuestion,
    restartQuestion,
    playOption,
    restartOption,
    playExplanation,
    restartExplanation,
    stop
  } = useAviationVoice(q.id);

  return (
    <div className="p-3.5 border-t border-zinc-700/80 light:border-slate-200 bg-zinc-950/60 light:bg-slate-50 space-y-3">
      {/* Quick voice controls */}
      {settings.ttsEnabled && (
        <div className="flex items-center justify-between pb-2 border-b border-zinc-700/60 light:border-slate-200 text-xs">
          <span className="text-[11px] text-zinc-400 light:text-slate-600 font-medium">
            Ascolto Vocale
          </span>
          <div className="flex items-center gap-1.5">
            {isPartActive('question') ? (
              <div className="inline-flex items-center bg-zinc-800/80 light:bg-slate-100 border border-zinc-700/80 light:border-slate-300 rounded p-0.5 gap-0.5 text-[11px] animate-in fade-in duration-150">
                <button
                  onClick={() => playQuestion()}
                  className={`px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold transition-colors ${
                    isPartPlaying('question')
                      ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50 light:bg-amber-100 light:text-amber-800 light:ring-amber-400'
                      : 'bg-zinc-700/50 text-zinc-300 ring-1 ring-zinc-600 light:bg-slate-200 light:text-slate-700'
                  }`}
                  title={isPartPlaying('question') ? 'Metti in pausa la lettura della domanda' : 'Riprendi lettura della domanda'}
                >
                  {isPartPlaying('question') ? (
                    <Pause className="w-2.5 h-2.5 animate-pulse text-amber-400 light:text-amber-700" />
                  ) : (
                    <Play className="w-2.5 h-2.5 text-amber-400 light:text-amber-700" />
                  )}
                  <span>Domanda</span>
                </button>
                <button
                  onClick={() => restartQuestion()}
                  className="p-1 rounded text-zinc-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-zinc-700/60 light:hover:bg-slate-200 transition-colors"
                  title="Ricomincia lettura domanda dall'inizio"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => playQuestion()}
                className="px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-700 light:hover:text-slate-900 light:border-slate-300 shadow-sm"
                title="Ascolta solo la domanda"
              >
                <Volume2 className="w-3 h-3 text-zinc-400 light:text-slate-500" />
                <span>Domanda</span>
              </button>
            )}

            {isThisQuestionActive && (isPlaying || isPaused) ? (
              <div className="inline-flex items-center bg-zinc-800/80 light:bg-slate-100 border border-zinc-700/80 light:border-slate-300 rounded p-0.5 gap-0.5 text-[11px] animate-in fade-in duration-150">
                <button
                  onClick={togglePlayPause}
                  className={`px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold transition-colors ${
                    isPlaying
                      ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50 light:bg-amber-100 light:text-amber-800 light:ring-amber-400'
                      : 'bg-zinc-700/50 text-zinc-300 ring-1 ring-zinc-600 light:bg-slate-200 light:text-slate-700'
                  }`}
                  title={isPlaying ? 'Metti in pausa (Tasto V)' : 'Riprendi ascolto (Tasto V)'}
                >
                  {isPlaying ? <Pause className="w-2.5 h-2.5 animate-pulse text-amber-400 light:text-amber-700" /> : <Play className="w-2.5 h-2.5 text-amber-400 light:text-amber-700" />}
                  <span>{isPlaying ? 'Pausa' : 'Riprendi'}</span>
                </button>
                <button
                  onClick={restartFullSequence}
                  className="px-1.5 py-0.5 rounded text-zinc-300 light:text-slate-700 hover:text-white light:hover:text-black flex items-center gap-1 transition-colors"
                  title="Ricomincia dall'inizio"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Da capo</span>
                </button>
                <button
                  onClick={stop}
                  className="p-1 rounded text-zinc-500 hover:text-rose-400 light:text-slate-400 light:hover:text-rose-600 hover:bg-zinc-700/40 light:hover:bg-slate-200 transition-colors"
                  title="Interrompi ascolto (Esc)"
                >
                  <Square className="w-2 h-2 fill-current" />
                </button>
              </div>
            ) : (
              <button
                onClick={togglePlayPause}
                className="px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-700 light:hover:text-slate-900 light:border-slate-300 shadow-sm"
                title="Ascolta sequenza completa"
              >
                <Volume2 className="w-3 h-3 text-zinc-400 light:text-slate-500" />
                <span>Tutto</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3 Options with isolated audio triggers */}
      <div className="space-y-1.5">
        {q.options.map((opt, idx) => {
          const optNum = (idx + 1) as 1 | 2 | 3;
          const isCorrect = q.correctAnswer === optNum;
          const isOptPlaying = isPartPlaying(`opt${optNum}` as any);
          const isOptPaused = isPartPaused(`opt${optNum}` as any);
          const isOptActive = isPartActive(`opt${optNum}` as any);

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border transition-all ${
                isCorrect
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 light:bg-emerald-50 light:border-emerald-300 light:text-emerald-900 font-medium'
                  : 'bg-zinc-900/60 border-zinc-700/80 text-zinc-300 light:bg-white light:border-slate-300 light:text-slate-700'
              } ${isOptPlaying ? 'ring-1 ring-amber-400' : isOptPaused ? 'ring-1 ring-amber-400/50' : ''}`}
            >
              <span className="font-bold">{optNum}.</span>
              <span className="flex-1">{opt}</span>

              {settings.ttsEnabled && (
                isOptActive ? (
                  <span className="inline-flex items-center bg-zinc-800/90 light:bg-slate-200 border border-zinc-700/90 light:border-slate-300 rounded p-0.5 gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => playOption(optNum)}
                      className={`p-0.5 rounded transition-colors ${
                        isOptPlaying
                          ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50 light:bg-amber-100 light:text-amber-800 light:ring-amber-400'
                          : 'bg-zinc-700/50 text-zinc-300 ring-1 ring-zinc-600 light:bg-slate-100 light:text-slate-700'
                      }`}
                      title={isOptPlaying ? `Metti in pausa opzione ${optNum}` : `Riprendi ascolto opzione ${optNum}`}
                    >
                      {isOptPlaying ? (
                        <Pause className="w-3 h-3 text-amber-400 light:text-amber-700 animate-pulse" />
                      ) : (
                        <Play className="w-3 h-3 text-amber-400 light:text-amber-700" />
                      )}
                    </button>
                    <button
                      onClick={() => restartOption(optNum)}
                      className="p-0.5 rounded text-zinc-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-zinc-700/60 light:hover:bg-slate-300 transition-colors"
                      title={`Ricomincia opzione ${optNum} da capo`}
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => playOption(optNum)}
                    className="p-0.5 rounded transition-colors text-zinc-500 hover:text-zinc-300 light:text-slate-500 light:hover:text-slate-700"
                    title={`Ascolta opzione ${optNum}`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )
              )}

              {isCorrect && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Didactic explanation */}
      <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 light:bg-white light:border-slate-300 text-xs space-y-1 text-zinc-300 light:text-slate-700">
        <div className="flex items-center justify-between pb-1 border-b border-zinc-700/60 light:border-slate-200">
          <span className="font-bold text-[11px] text-zinc-400 light:text-slate-600">Spiegazione Didattica</span>
          {settings.ttsEnabled && (
            isPartActive('explanation') ? (
              <div className="inline-flex items-center bg-zinc-800/80 light:bg-slate-100 border border-zinc-700/80 light:border-slate-300 rounded p-0.5 gap-0.5 text-[10px] animate-in fade-in duration-150">
                <button
                  onClick={() => playExplanation()}
                  className={`px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold transition-colors ${
                    isPartPlaying('explanation')
                      ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50 light:bg-amber-100 light:text-amber-800 light:ring-amber-400'
                      : 'bg-zinc-700/50 text-zinc-300 ring-1 ring-zinc-600 light:bg-slate-200 light:text-slate-700'
                  }`}
                  title={isPartPlaying('explanation') ? 'Metti in pausa la spiegazione' : 'Riprendi spiegazione'}
                >
                  {isPartPlaying('explanation') ? (
                    <>
                      <Pause className="w-2.5 h-2.5 animate-pulse text-amber-400 light:text-amber-700" />
                      <span>Pausa</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-2.5 h-2.5 text-amber-400 light:text-amber-700" />
                      <span>Riprendi</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => restartExplanation()}
                  className="px-1 py-0.5 rounded text-zinc-300 light:text-slate-700 hover:text-white light:hover:text-black hover:bg-zinc-700/60 light:hover:bg-slate-200 flex items-center gap-0.5 transition-colors"
                  title="Ricomincia spiegazione da capo"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Da capo</span>
                </button>
                <button
                  onClick={stop}
                  className="p-0.5 rounded text-zinc-500 hover:text-rose-400 light:text-slate-400 light:hover:text-rose-600 hover:bg-zinc-700/40 light:hover:bg-slate-200 transition-colors"
                  title="Interrompi spiegazione (Esc)"
                >
                  <Square className="w-2 h-2 fill-current" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => playExplanation()}
                className="text-[11px] font-medium px-2 py-0.5 rounded-lg flex items-center gap-1.5 text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-700 light:hover:text-slate-900 light:border-slate-300 transition-colors shadow-sm"
                title="Ascolta spiegazione didattica"
              >
                <Volume2 className="w-3.5 h-3.5 text-zinc-400 light:text-slate-500" />
                <span>Ascolta Spiegazione</span>
              </button>
            )
          )}
        </div>
        <div>
          <strong className="text-emerald-400 light:text-emerald-700">Regola: </strong>
          <span>{q.explanation.rule}</span>
        </div>
        <div>
          <strong className="text-amber-400 light:text-amber-800">Tranello: </strong>
          <span>{q.explanation.trap}</span>
        </div>
      </div>

      {/* Personal note section */}
      {stat?.userNote && !isEditingNote && (
        <div className="p-3 rounded-xl border bg-amber-950/40 border-amber-700/60 dark:bg-amber-950/40 dark:border-amber-700/60 dark:text-zinc-100 light:bg-amber-50 light:border-amber-300 light:text-amber-950 text-xs space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-amber-700/60 light:border-amber-300/80 pb-1.5">
            <span className="font-bold flex items-center gap-1.5 text-amber-400 light:text-amber-700 text-[11px] uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              Nota Personale
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setNoteText(stat.userNote || '');
                  setIsEditingNote(true);
                }}
                className="text-[11px] text-amber-400 hover:text-amber-200 light:text-amber-700 light:hover:text-amber-950 flex items-center gap-1 font-medium"
                title="Modifica nota"
              >
                <Edit3 className="w-3 h-3" />
                <span>Modifica</span>
              </button>
              <button
                onClick={async () => {
                  await saveNote(q.id, '');
                  setNoteText('');
                }}
                className="text-[11px] text-rose-400 hover:text-rose-200 light:text-rose-600 light:hover:text-rose-900 flex items-center gap-1 font-medium"
                title="Elimina nota"
              >
                <Trash2 className="w-3 h-3" />
                <span>Elimina</span>
              </button>
            </div>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed text-zinc-200 dark:text-zinc-200 light:text-slate-800 text-xs font-normal">
            {stat.userNote}
          </p>
        </div>
      )}

      {isEditingNote && (
        <div className="p-3 rounded-xl border bg-zinc-950/90 border-zinc-700 dark:bg-zinc-950/90 dark:border-zinc-700 light:bg-slate-50 light:border-slate-300 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-400 light:text-amber-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5" />
              {stat?.userNote ? 'Modifica Nota Personale' : 'Aggiungi Nota Personale'}
            </span>
            {stat?.userNote && (
              <button
                onClick={async () => {
                  await saveNote(q.id, '');
                  setNoteText('');
                  setIsEditingNote(false);
                }}
                className="text-[11px] text-rose-400 hover:text-rose-200 light:text-rose-600 flex items-center gap-1"
                title="Elimina nota esistente"
              >
                <Trash2 className="w-3 h-3" />
                <span>Elimina</span>
              </button>
            )}
          </div>
          <textarea
            id={`textarea-note-${q.id}`}
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Scrivi qui la tua nota personale per questo quesito..."
            className="w-full bg-zinc-900 dark:bg-zinc-900 border border-zinc-700 dark:border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-100 dark:text-zinc-100 light:bg-white light:border-slate-300 light:text-slate-900 resize-none outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditingNote(false)}
              className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 dark:border-zinc-700 text-zinc-300 hover:text-white light:border-slate-300 light:text-slate-700 hover:bg-zinc-800/40 light:hover:bg-slate-100 transition-colors"
            >
              Annulla
            </button>
            <button
              id={`btn-save-note-${q.id}`}
              onClick={async () => {
                await saveNote(q.id, noteText);
                setIsEditingNote(false);
              }}
              className="text-xs px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-sm transition-all"
            >
              Salva Nota
            </button>
          </div>
        </div>
      )}

      {!stat?.userNote && !isEditingNote && (
        <button
          id={`btn-add-note-${q.id}`}
          onClick={() => {
            setNoteText('');
            setIsEditingNote(true);
          }}
          className="w-full py-2 px-3 rounded-lg border border-dashed border-zinc-700 dark:border-zinc-700 hover:border-amber-500/60 light:border-slate-300 light:hover:border-amber-600 text-zinc-300 hover:text-amber-400 light:text-slate-600 light:hover:text-amber-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Aggiungi una nota personale sulla domanda #{q.id}</span>
        </button>
      )}
    </div>
  );
};

export const ArchiveItem: React.FC<ArchiveItemProps> = ({ question: q, isExpanded, onToggle }) => {
  const { statsMap } = useQuiz();
  const stat = statsMap.get(q.id);

  return (
    <div className="border border-zinc-700 rounded-xl overflow-hidden bg-zinc-900/50 light:bg-white light:border-slate-300 light:shadow-sm">
      <div
        id={`archive-item-${q.id}`}
        onClick={onToggle}
        className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-zinc-800/40 light:hover:bg-slate-50 transition-colors"
      >
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-amber-400 light:text-amber-800 text-xs">
              #{q.id}
            </span>
            <span className="text-[11px] text-zinc-400 light:text-slate-600 font-medium">
              {q.subjectName}
            </span>
            {stat?.isBookmarked && (
              <Bookmark className="w-3 h-3 text-amber-400 fill-amber-400" />
            )}
            {stat?.userNote && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-800 font-medium">
                <FileText className="w-3 h-3" />
                <span>Nota</span>
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-200 light:text-slate-800 font-medium line-clamp-2">
            {q.question}
          </p>
          {stat?.userNote && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-400 light:text-amber-800 bg-amber-950/50 light:bg-amber-50 px-2 py-0.5 rounded border border-amber-700/50 light:border-amber-300 w-fit max-w-full">
              <FileText className="w-3 h-3 flex-shrink-0 text-amber-400 light:text-amber-600" />
              <span className="truncate italic font-normal">"{stat.userNote}"</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-zinc-400 flex-shrink-0 mt-1">
          {stat?.lastResult && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                stat.lastResult === 'correct'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {stat.lastResult === 'correct' ? 'OK' : 'ERR'}
            </span>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isExpanded && <ArchiveItemExpandedContent question={q} />}
    </div>
  );
};
