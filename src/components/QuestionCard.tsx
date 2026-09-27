import React, { useState } from 'react';
import { Bookmark, Flag, Edit3, CheckCircle2, XCircle, Info } from 'lucide-react';
import type { Question } from '../types/quiz';
import { useQuiz } from '../context/QuizContext';
import { soundFX } from '../utils/audio';

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
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteText, setNoteText] = useState('');

  const stat = statsMap.get(question.id);
  const isBookmarked = stat?.isBookmarked || false;

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
          <span className="text-slate-400 light:text-slate-500 truncate max-w-[180px] sm:max-w-xs font-medium">
            {question.subjectName}
          </span>
          {indexNumber !== undefined && totalNumber !== undefined && (
            <span className="text-slate-500 light:text-slate-400">
              ({indexNumber}/{totalNumber})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
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
                ? 'text-sky-400 light:text-sky-600'
                : 'text-slate-400 light:text-slate-500 hover:text-slate-200'
            }`}
            title="Nota personale"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Note view if existing and editor closed */}
      {stat?.userNote && !showNoteEditor && (
        <div className="mb-3 px-3 py-1.5 bg-sky-950/40 border border-sky-800/40 rounded-lg text-xs text-sky-200 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 mt-0.5 text-sky-400 flex-shrink-0" />
          <span>{stat.userNote}</span>
        </div>
      )}

      {/* Note Editor */}
      {showNoteEditor && (
        <div className="mb-3 p-2 bg-slate-950/60 border border-slate-800 rounded-lg">
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Scrivi qui la tua nota..."
            className="w-full bg-transparent text-xs text-slate-100 light:text-slate-900 resize-none outline-none"
            rows={2}
          />
          <div className="flex justify-end gap-2 mt-1">
            <button
              onClick={() => setShowNoteEditor(false)}
              className="text-[11px] px-2 py-0.5 rounded text-slate-400 hover:text-slate-200"
            >
              Annulla
            </button>
            <button
              onClick={handleSaveNote}
              className="text-[11px] px-2.5 py-0.5 rounded bg-sky-600 text-white font-medium"
            >
              Salva
            </button>
          </div>
        </div>
      )}

      {/* Testo Domanda */}
      <h3 className="text-base sm:text-lg font-medium text-slate-100 light:text-slate-900 leading-snug mb-5">
        {question.question}
      </h3>

      {/* 3 Opzioni */}
      <div className="space-y-2.5">
        {question.options.map((opt, idx) => {
          const optNum = (idx + 1) as 1 | 2 | 3;
          const isSelected = selectedAnswer === optNum;
          const isCorrectAnswer = question.correctAnswer === optNum;

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
          }

          return (
            <button
              key={optNum}
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
                    : 'bg-slate-800 light:bg-slate-200 text-slate-300 light:text-slate-700'
                }`}
              >
                {optNum}
              </span>

              <div className="flex-1 pt-0.5">
                <span>{opt}</span>
              </div>

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

      {/* Spiegazione Sintetica (visibile solo se feedback attivo e risposta data) */}
      {showFeedback && selectedAnswer && (
        <div className="mt-4 pt-3 border-t border-slate-800 light:border-slate-200 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 font-bold mb-1.5">
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
