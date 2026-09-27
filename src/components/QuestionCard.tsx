import React, { useState, useEffect } from 'react';
import { Bookmark, Flag, Edit3, CheckCircle2, XCircle, Volume2, FileText, Trash2 } from 'lucide-react';
import type { Question } from '../types/quiz';
import { useQuiz } from '../context/QuizContext';
import { soundFX } from '../utils/audio';
import { useAviationVoice } from '../hooks/useAviationVoice';

interface QuestionCardProps {
  question: Question;
  selectedAnswer?: 1 | 2 | 3;
  onSelectAnswer: (answer: 1 | 2 | 3) => void;
  showFeedback?: boolean; // Se true, mostra subito verde/rosso e spiegazione
  isFlagged?: boolean;
  onToggleFlag?: () => void;
  indexNumber?: number; // es. "Domanda 4 di 30"
  totalNumber?: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  showFeedback = false,
  isFlagged = false,
  onToggleFlag,
  indexNumber,
  totalNumber
}) => {
  const { statsMap, toggleBookmark, saveNote, settings } = useQuiz();
  const stat = statsMap.get(question.id);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteText, setNoteText] = useState(stat?.userNote || '');

  // Sincronizza lo stato della nota al cambio quesito o aggiornamento DB
  useEffect(() => {
    setShowNoteEditor(false);
    setNoteText(stat?.userNote || '');
  }, [question.id, stat?.userNote]);

  const {
    isThisQuestionActive,
    isSequencePlaying,
    isPartPlaying,
    playFullSequence,
    playQuestion,
    playOption,
    playExplanation,
    stop
  } = useAviationVoice(question.id);

  const isBookmarked = stat?.isBookmarked || false;

  // Interrompe l'audio quando si cambia domanda, o avvia autoplay se impostato
  useEffect(() => {
    if (settings.ttsEnabled && settings.ttsAutoPlayQuestion) {
      playFullSequence();
    }
    return () => {
      stop();
    };
  }, [question.id]);

  // Gestione scorciatoie da tastiera dedicate al parlato (V: full, Q: domanda, Alt+1/2/3: opzioni)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showNoteEditor) return;

      if ((e.key === 'v' || e.key === 'V') && !e.altKey && !e.ctrlKey) {
        if (isSequencePlaying && isThisQuestionActive) {
          stop();
        } else {
          playFullSequence();
        }
      } else if ((e.key === 'q' || e.key === 'Q') && !e.altKey && !e.ctrlKey) {
        playQuestion();
      } else if (e.altKey && e.key === '1') {
        e.preventDefault();
        playOption(1);
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        playOption(2);
      } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        playOption(3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [question.id, isSequencePlaying, isThisQuestionActive, showNoteEditor]);

  const handleSelect = (idx: 1 | 2 | 3) => {
    if (showFeedback && selectedAnswer) return; // Non cambiare se già verificato in modalità feedback
    onSelectAnswer(idx);

    if (settings.soundEnabled) {
      if (showFeedback) {
        if (idx === question.correctAnswer) soundFX.playCorrect();
        else soundFX.playWrong();
      } else {
        soundFX.playClick();
      }
    }

    // Spiegazione didattica vocale su errore:
    if (settings.ttsEnabled && showFeedback) {
      if (idx !== question.correctAnswer) {
        if (settings.ttsAutoExplainOnMistake) {
          playExplanation();
        }
      } else {
        stop();
      }
    }
  };

  const handleSaveNote = async () => {
    await saveNote(question.id, noteText);
    setShowNoteEditor(false);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-md dark:bg-slate-900 dark:border-slate-800 light:bg-white light:border-slate-200 light:shadow-sm transition-all">
      {/* Top Header Card */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/80 light:border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sky-400 light:text-sky-600 bg-sky-500/10 px-2 py-0.5 rounded">
            #{question.id}
          </span>
          <span className="text-slate-400 light:text-slate-500 truncate max-w-[150px] sm:max-w-xs font-medium">
            {question.subjectName}
          </span>
          {indexNumber !== undefined && totalNumber !== undefined && (
            <span className="text-slate-500 light:text-slate-400">
              ({indexNumber}/{totalNumber})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* TTS Audio Sequenziale Completo */}
          {settings.ttsEnabled && (
            <button
              onClick={() => isSequencePlaying && isThisQuestionActive ? stop() : playFullSequence()}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                isSequencePlaying && isThisQuestionActive
                  ? 'bg-sky-500/20 text-sky-400 font-semibold ring-1 ring-sky-500/40'
                  : 'text-slate-400 light:text-slate-500 hover:text-slate-200 light:hover:text-slate-800'
              }`}
              title="Ascolta domanda e opzioni in sequenza (Tasto V)"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isSequencePlaying && isThisQuestionActive ? 'animate-pulse text-sky-400' : ''}`} />
              <span className="hidden sm:inline">
                {isSequencePlaying && isThisQuestionActive ? 'Ascolto...' : 'Ascolta'}
              </span>
            </button>
          )}

          {/* Flag button */}
          {onToggleFlag && (
            <button
              onClick={onToggleFlag}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                isFlagged
                  ? 'bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-700 font-semibold'
                  : 'text-slate-400 light:text-slate-500 hover:text-slate-200 light:hover:text-slate-800'
              }`}
              title="⚑ Rivedi più tardi"
            >
              <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-400' : ''}`} />
              <span className="hidden sm:inline">Rivedi</span>
            </button>
          )}

          {/* Bookmark button */}
          <button
            onClick={() => toggleBookmark(question.id)}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              isBookmarked
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-400 light:text-slate-500 hover:text-slate-200'
            }`}
            title="Preferita"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Note toggle button */}
          <button
            onClick={() => {
              setNoteText(stat?.userNote || '');
              setShowNoteEditor(!showNoteEditor);
            }}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              stat?.userNote
                ? 'text-sky-400 light:text-sky-600 bg-sky-500/10'
                : 'text-slate-400 light:text-slate-500 hover:text-slate-200 light:hover:text-slate-800'
            }`}
            title="Nota personale"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Note view if existing and editor closed */}
      {stat?.userNote && !showNoteEditor && (
        <div className="mb-4 p-3 rounded-xl border bg-sky-950/40 border-sky-800/60 dark:bg-sky-950/40 dark:border-sky-800/60 dark:text-sky-100 light:bg-sky-50 light:border-sky-200 light:text-sky-950 text-xs shadow-sm space-y-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-sky-800/40 dark:border-sky-800/40 light:border-sky-200/80 pb-1.5">
            <span className="font-bold flex items-center gap-1.5 text-sky-400 light:text-sky-700 text-[11px] uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              Nota Personale
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setNoteText(stat.userNote || '');
                  setShowNoteEditor(true);
                }}
                className="px-2 py-0.5 rounded text-[11px] text-sky-400 hover:text-sky-200 light:text-sky-700 light:hover:text-sky-950 hover:bg-sky-900/40 light:hover:bg-sky-100 transition-colors flex items-center gap-1 font-medium"
                title="Modifica nota"
              >
                <Edit3 className="w-3 h-3" />
                <span>Modifica</span>
              </button>
              <button
                onClick={async () => {
                  await saveNote(question.id, '');
                  setNoteText('');
                }}
                className="px-2 py-0.5 rounded text-[11px] text-rose-400 hover:text-rose-200 light:text-rose-600 light:hover:text-rose-900 hover:bg-rose-950/40 light:hover:bg-rose-100 transition-colors flex items-center gap-1 font-medium"
                title="Elimina nota"
              >
                <Trash2 className="w-3 h-3" />
                <span>Elimina</span>
              </button>
            </div>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed text-slate-200 dark:text-slate-200 light:text-slate-800 text-xs font-normal">
            {stat.userNote}
          </p>
        </div>
      )}

      {/* Note Editor */}
      {showNoteEditor && (
        <div className="mb-4 p-3 rounded-xl border bg-slate-950/90 border-slate-800 dark:bg-slate-950/90 dark:border-slate-800 light:bg-slate-50 light:border-slate-300 space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-sky-400 light:text-sky-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5" />
              {stat?.userNote ? 'Modifica Nota Personale' : 'Nuova Nota Personale'}
            </span>
            {stat?.userNote && (
              <button
                onClick={async () => {
                  await saveNote(question.id, '');
                  setNoteText('');
                  setShowNoteEditor(false);
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
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Scrivi qui la tua nota o appunto didattico sul quesito..."
            className="w-full bg-slate-900 dark:bg-slate-900 border border-slate-800 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 dark:text-slate-100 light:bg-white light:border-slate-200 light:text-slate-900 resize-none outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNoteEditor(false)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-800 dark:border-slate-800 text-slate-400 hover:text-slate-200 light:border-slate-300 light:text-slate-700 hover:bg-slate-800/40 light:hover:bg-slate-100 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleSaveNote}
              className="text-xs px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-sm transition-all"
            >
              Salva Nota
            </button>
          </div>
        </div>
      )}

      {/* Testo Domanda con microfono / speaker dedicato */}
      <div className="flex items-start gap-2 mb-5">
        <h3 className={`text-base sm:text-lg font-medium leading-snug flex-1 transition-colors ${
          isPartPlaying('question')
            ? 'text-sky-300 light:text-sky-700'
            : 'text-slate-100 light:text-slate-900'
        }`}>
          {question.question}
        </h3>
        {settings.ttsEnabled && (
          <button
            onClick={() => playQuestion()}
            className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
              isPartPlaying('question')
                ? 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/40'
                : 'text-slate-500 hover:text-slate-300 light:hover:text-slate-700'
            }`}
            title="Riascolta solo la domanda (Tasto Q)"
          >
            <Volume2 className={`w-4 h-4 ${isPartPlaying('question') ? 'animate-pulse text-sky-400' : ''}`} />
          </button>
        )}
      </div>

      {/* 3 Opzioni */}
      <div className="space-y-2.5">
        {question.options.map((opt, idx) => {
          const optNum = (idx + 1) as 1 | 2 | 3;
          const isSelected = selectedAnswer === optNum;
          const isCorrectAnswer = question.correctAnswer === optNum;
          const isCurrentOptPlaying = isPartPlaying(`opt${optNum}` as any);

          // Stili in base al feedback immediato o selezione neutra
          let btnStyle = 'border-slate-800 hover:border-slate-700 bg-slate-950/60 light:border-slate-200 light:bg-slate-50 light:hover:bg-slate-100';

          if (showFeedback && selectedAnswer) {
            if (isCorrectAnswer) {
              btnStyle = 'border-emerald-500/80 bg-emerald-950/30 text-emerald-200 light:border-emerald-600 light:bg-emerald-50 light:text-emerald-900 font-medium';
            } else if (isSelected && !isCorrectAnswer) {
              btnStyle = 'border-rose-500/80 bg-rose-950/30 text-rose-200 light:border-rose-600 light:bg-rose-50 light:text-rose-900';
            } else {
              btnStyle = 'opacity-50 border-slate-800 bg-slate-950/20 light:border-slate-200 light:bg-white';
            }
          } else if (isSelected) {
            btnStyle = 'border-sky-500 bg-sky-950/40 text-sky-200 light:border-sky-600 light:bg-sky-50 light:text-sky-950 font-medium ring-1 ring-sky-500';
          } else if (isCurrentOptPlaying) {
            btnStyle = 'border-sky-500/60 bg-sky-950/20 text-sky-200 ring-1 ring-sky-500/30';
          }

          return (
            <button
              key={optNum}
              id={`btn-option-${optNum}`}
              data-answer-option={optNum}
              onClick={() => handleSelect(optNum)}
              disabled={showFeedback && selectedAnswer !== undefined}
              className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3 text-sm leading-relaxed ${btnStyle}`}
            >
              <span
                className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs mt-0.5 ${
                  showFeedback && selectedAnswer
                    ? isCorrectAnswer
                      ? 'bg-emerald-500 text-white'
                      : isSelected
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 light:bg-slate-200 text-slate-400'
                    : isSelected
                    ? 'bg-sky-500 text-white'
                    : isCurrentOptPlaying
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700'
                }`}
              >
                {optNum}
              </span>

              <div className="flex-1 pt-0.5">
                <span>{opt}</span>
              </div>

              {/* Icona micro per ascolto singola opzione */}
              {settings.ttsEnabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    playOption(optNum);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      playOption(optNum);
                    }
                  }}
                  className={`p-1 rounded transition-colors flex-shrink-0 ${
                    isCurrentOptPlaying
                      ? 'text-sky-400 bg-sky-500/20'
                      : 'text-slate-600 hover:text-slate-300 light:text-slate-400 light:hover:text-slate-600'
                  }`}
                  title={`Riascolta opzione ${optNum} (Alt+${optNum})`}
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isCurrentOptPlaying ? 'animate-pulse text-sky-400' : ''}`} />
                </span>
              )}

              {showFeedback && selectedAnswer && isCorrectAnswer && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
              {showFeedback && selectedAnswer && isSelected && !isCorrectAnswer && (
                <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Spiegazione Sintetica (visibile se feedback attivo e risposta data) */}
      {showFeedback && selectedAnswer && (
        <div className="mt-4 pt-3 border-t border-slate-800 light:border-slate-200 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between font-bold mb-1.5">
            <div className="flex items-center gap-1.5">
              {selectedAnswer === question.correctAnswer ? (
                <span className="text-emerald-400 light:text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Esatta
                </span>
              ) : (
                <span className="text-rose-400 light:text-rose-600 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Errata
                </span>
              )}
            </div>

            {settings.ttsEnabled && (
              <button
                onClick={() => playExplanation()}
                className={`px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors ${
                  isPartPlaying('explanation')
                    ? 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800'
                }`}
                title="Riascolta spiegazione vocale della risposta corretta"
              >
                <Volume2 className={`w-3 h-3 ${isPartPlaying('explanation') ? 'animate-pulse text-sky-400' : ''}`} />
                <span>{isPartPlaying('explanation') ? 'Spiegazione in corso...' : 'Ascolta Spiegazione'}</span>
              </button>
            )}
          </div>

          <div className="space-y-1.5 text-slate-300 light:text-slate-700 bg-slate-950/60 light:bg-slate-50 p-2.5 rounded-lg border border-slate-800/60 light:border-slate-200">
            <div>
              <strong className="text-sky-400 light:text-sky-600">Regola: </strong>
              <span>{question.explanation.rule}</span>
            </div>
            <div>
              <strong className="text-amber-400 light:text-amber-600">Tranello: </strong>
              <span>{question.explanation.trap}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
