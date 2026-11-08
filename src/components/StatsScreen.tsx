import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  Calendar,
  Clock,
  AlertTriangle,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import type { Question } from '../types/quiz';
import type { QuestionStat } from '../types/database';
import { useQuiz } from '../context/QuizContext';
import { hasSessionAnswers, resolveSessionOutcome } from '../services/examEvaluator';
import { OFFICIAL_EXAM_QUOTAS, getSubjectPointWeight } from '../utils/aeciRegulation';
import {
  calculateReadinessBreakdown,
  calculateExamTrend,
  calculateMistakeLeitnerBuckets,
  isMistakeQuestion
} from '../utils/analytics';
import { SubjectDetailModal, type SubjectFilterMode } from './SubjectDetailModal';
import { QuestionDetailModal } from './QuestionDetailModal';

export interface StatsScreenProps {
  onTrainSubject?: (subjectId: number) => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ onTrainSubject }) => {
  const {
    questions,
    statsMap,
    sessions,
    totalSeen,
    readinessScore,
    mistakesCount,
    subjectsAnalytics
  } = useQuiz();

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [subjectInitialFilter, setSubjectInitialFilter] = useState<SubjectFilterMode>('all');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const statsList = useMemo<QuestionStat[]>(
    () => Array.from(statsMap.values()),
    [statsMap]
  );

  const answeredSessions = useMemo(() => sessions.filter(hasSessionAnswers), [sessions]);
  const passedCount = useMemo(
    () => answeredSessions.filter(s => resolveSessionOutcome(s) === 'passed').length,
    [answeredSessions]
  );
  const oralCheckCount = useMemo(
    () => answeredSessions.filter(s => resolveSessionOutcome(s) === 'oral_check').length,
    [answeredSessions]
  );

  const totalQuestionsCount = questions.length;
  const coveragePercent =
    totalQuestionsCount > 0 ? Math.round((totalSeen / totalQuestionsCount) * 100) : 0;

  // Chart 1: 3-Pillar Readiness Breakdown (35% Coverage, 35% Weighted Accuracy, 30% Simulations)
  const readinessBreakdown = useMemo(
    () => calculateReadinessBreakdown(totalQuestionsCount, totalSeen, statsList, sessions),
    [totalQuestionsCount, totalSeen, statsList, sessions]
  );

  // Chart 2: Chronological /100 pt Exam Trend (up to last 10 valid sessions)
  const examTrend = useMemo(
    () => calculateExamTrend(sessions, 10),
    [sessions]
  );

  // Chart 3: Leitner Error Recovery Funnel (0/2 Critical, 1/2 Recovering, 2/2 Mastered)
  const leitnerBuckets = useMemo(
    () => calculateMistakeLeitnerBuckets(statsList),
    [statsList]
  );

  // Top 10 most frequently missed questions
  const topWrongQuestions = useMemo(
    () =>
      questions
        .map(q => {
          const s = statsMap.get(q.id);
          return {
            question: q,
            timesWrong: s?.timesWrong || 0,
            timesSeen: s?.timesSeen || 0
          };
        })
        .filter(item => item.timesWrong > 0)
        .sort((a, b) => b.timesWrong - a.timesWrong)
        .slice(0, 10),
    [questions, statsMap]
  );

  // Geometry helper for the 340x130 SVG Exam Trend chart
  const trendChartGeometry = useMemo(() => {
    if (examTrend.length === 0) return null;
    const minObserved = Math.min(...examTrend.map(p => p.scoreOn100));
    const yMin = Math.max(0, Math.min(50, Math.floor((minObserved - 5) / 5) * 5));
    const yMax = 100;
    const padLeft = 28;
    const padRight = 12;
    const padTop = 16;
    const padBottom = 22;
    const plotW = 340 - padLeft - padRight;
    const plotH = 130 - padTop - padBottom;

    const toY = (score: number) => {
      const clamped = Math.min(yMax, Math.max(yMin, score));
      return Math.round((padTop + ((yMax - clamped) / (yMax - yMin)) * plotH) * 10) / 10;
    };

    const toX = (idx: number, count: number) => {
      if (count <= 1) return padLeft + plotW / 2;
      return Math.round((padLeft + (idx / (count - 1)) * plotW) * 10) / 10;
    };

    const points = examTrend.map((pt, idx) => ({
      ...pt,
      x: toX(idx, examTrend.length),
      y: toY(pt.scoreOn100)
    }));

    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
    const y86 = toY(86);
    const y80 = toY(80);
    const y100 = toY(100);
    const latestPoint = points[points.length - 1];

    return {
      points,
      polylinePoints,
      padLeft,
      plotW,
      y86,
      y80,
      y100,
      latestPoint
    };
  }, [examTrend]);

  const handleOpenSubject = (subjectId: number, filter: SubjectFilterMode = 'all') => {
    setSubjectInitialFilter(filter);
    setSelectedSubjectId(subjectId);
  };

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">I tuoi Progressi</h1>
          <p className="text-xs text-zinc-400 light:text-slate-600">
            Come sta procedendo la tua preparazione per l'esame VDS-VL
          </p>
        </div>

        {/* Main Exam Readiness Card with Chart 1 (3-Pillar Breakdown) */}
        <div className="p-6 rounded-2xl border border-zinc-700 bg-zinc-900 shadow-md light:bg-white light:border-slate-300 light:shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-400 light:text-slate-600 uppercase tracking-wider">
                Preparazione Esame
              </span>
              <div className="text-3xl sm:text-4xl font-black text-amber-400 light:text-amber-800">
                {readinessScore}%
              </div>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Award className="w-9 h-9" />
            </div>
          </div>

          {/* Chart 1: 3-Pillar Proportional Breakdown Bar (35% | 35% | 30%) */}
          <div className="space-y-2">
            <div
              id="readiness-pillars-breakdown"
              role="img"
              aria-label={`Scomposizione prontezza: Copertura ${readinessBreakdown.coverageContribution} su 35%, Precisione ${readinessBreakdown.accuracyContribution} su 35%, Simulazioni ${readinessBreakdown.examFactorContribution} su 30%`}
              className="grid grid-cols-[35fr_35fr_30fr] gap-1.5 h-3 w-full"
            >
              {/* Pillar 1: Coverage (max 35%) */}
              <div className="bg-zinc-950/90 border border-zinc-800 light:bg-slate-200 light:border-slate-300/80 rounded-l-full rounded-r-sm overflow-hidden">
                <div
                  className="h-full bg-amber-500 light:bg-amber-600 transition-all duration-500"
                  style={{ width: `${Math.round(readinessBreakdown.coverageRatio * 100)}%` }}
                />
              </div>

              {/* Pillar 2: Weighted Accuracy (max 35%) */}
              <div className="bg-zinc-950/90 border border-zinc-800 light:bg-slate-200 light:border-slate-300/80 rounded-sm overflow-hidden">
                <div
                  className="h-full bg-emerald-500 light:bg-emerald-600 transition-all duration-500"
                  style={{ width: `${Math.round(readinessBreakdown.weightedAccuracyRatio * 100)}%` }}
                />
              </div>

              {/* Pillar 3: Last 3 Simulations (max 30%) */}
              <div className="bg-zinc-950/90 border border-zinc-800 light:bg-slate-200 light:border-slate-300/80 rounded-r-full rounded-l-sm overflow-hidden">
                <div
                  className="h-full bg-amber-400 light:bg-amber-500 transition-all duration-500"
                  style={{ width: `${Math.round(readinessBreakdown.examFactorRatio * 100)}%` }}
                />
              </div>
            </div>

            {/* 3-Pillar Legend aligned with the proportional segments */}
            <div className="grid grid-cols-[35fr_35fr_30fr] gap-1.5 text-[10px] sm:text-[11px] font-mono">
              <div className="flex items-center justify-between text-zinc-300 light:text-slate-700 truncate">
                <span className="text-amber-400 light:text-amber-800 font-bold">Copertura</span>
                <span>{Math.round(readinessBreakdown.coverageContribution)} / 35%</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300 light:text-slate-700 truncate">
                <span className="text-emerald-400 light:text-emerald-800 font-bold">Precisione</span>
                <span>{Math.round(readinessBreakdown.accuracyContribution)} / 35%</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300 light:text-slate-700 truncate">
                <span className="text-amber-300 light:text-amber-700 font-bold">Esami (3)</span>
                <span>{Math.round(readinessBreakdown.examFactorContribution)} / 30%</span>
              </div>
            </div>

            {/* Priority Lever Callout */}
            <div
              id="readiness-priority-lever"
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 light:bg-amber-50 light:border-amber-300 light:text-amber-900 text-xs flex items-center justify-between gap-2"
            >
              <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400 light:text-amber-800 flex-shrink-0">
                Leva Prioritaria
              </span>
              <span className="font-medium truncate">
                {readinessBreakdown.recommendationIt}
              </span>
            </div>
          </div>

          {/* 3 Summary Metric Boxes */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-zinc-950/60 light:bg-slate-50 border border-zinc-700/80 light:border-slate-300">
              <div className="text-zinc-400 light:text-slate-600 text-[10px]">Quiz Visti</div>
              <div className="font-bold text-zinc-200 light:text-slate-800 mt-0.5">
                {totalSeen}/{totalQuestionsCount}
              </div>
              <div className="text-[10px] text-amber-400 light:text-amber-800">{coveragePercent}%</div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950/60 light:bg-slate-50 border border-zinc-700/80 light:border-slate-300">
              <div className="text-zinc-400 light:text-slate-600 text-[10px]">Errori</div>
              <div className="font-bold text-rose-400 light:text-rose-700 mt-0.5">
                {mistakesCount}
              </div>
              <div className="text-[10px] text-zinc-400 light:text-slate-600">da rivedere</div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950/60 light:bg-slate-50 border border-zinc-700/80 light:border-slate-300">
              <div className="text-zinc-400 light:text-slate-600 text-[10px]">Simulazioni</div>
              <div className="font-bold text-zinc-200 light:text-slate-800 mt-0.5">
                {answeredSessions.length}
              </div>
              <div className="text-[10px] text-emerald-400 light:text-emerald-800 whitespace-nowrap">
                {passedCount} superate{oralCheckCount > 0 ? ` · ${oralCheckCount} orale` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3a: Leitner Error Recovery Funnel Card (0/2 Critical, 1/2 Recovering, 2/2 Mastered) */}
        {leitnerBuckets.totalEverWrong > 0 && (
          <div
            id="leitner-recovery-card"
            className="p-5 rounded-2xl border border-zinc-700 bg-zinc-900 light:bg-white light:border-slate-300 light:shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-zinc-400 light:text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400 light:text-rose-700" />
                <span>Stato Recupero Errori (Regola 2x)</span>
              </h3>
              <span className="text-[10px] font-mono text-zinc-400 light:text-slate-600">
                {leitnerBuckets.activeMistakesTotal} attivi su {leitnerBuckets.totalEverWrong} storici
              </span>
            </div>

            {/* 3-Stage Funnel Bar */}
            <div
              role="img"
              aria-label={`Funnel recupero errori: ${leitnerBuckets.criticalCount} critici 0 su 2, ${leitnerBuckets.recoveringCount} in uscita 1 su 2, ${leitnerBuckets.masteredAfterErrorCount} recuperati 2 su 2`}
              className="w-full h-3 rounded-full bg-zinc-950 border border-zinc-800 light:bg-slate-200 light:border-slate-300 overflow-hidden flex gap-0.5"
            >
              {leitnerBuckets.criticalCount > 0 && (
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{
                    width: `${(leitnerBuckets.criticalCount / leitnerBuckets.totalEverWrong) * 100}%`
                  }}
                />
              )}
              {leitnerBuckets.recoveringCount > 0 && (
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{
                    width: `${(leitnerBuckets.recoveringCount / leitnerBuckets.totalEverWrong) * 100}%`
                  }}
                />
              )}
              {leitnerBuckets.masteredAfterErrorCount > 0 && (
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${(leitnerBuckets.masteredAfterErrorCount / leitnerBuckets.totalEverWrong) * 100}%`
                  }}
                />
              )}
            </div>

            {/* 3 Stage Counters */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-zinc-950/60 light:bg-slate-50 border border-zinc-800 light:border-slate-300">
                <div className="text-[10px] text-zinc-400 light:text-slate-600">Critici (0/2)</div>
                <div className="font-mono font-bold text-rose-400 light:text-rose-700 mt-0.5">
                  {leitnerBuckets.criticalCount}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950/60 light:bg-slate-50 border border-zinc-800 light:border-slate-300">
                <div className="text-[10px] text-zinc-400 light:text-slate-600">In uscita (1/2)</div>
                <div className="font-mono font-bold text-amber-400 light:text-amber-800 mt-0.5">
                  {leitnerBuckets.recoveringCount}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950/60 light:bg-slate-50 border border-zinc-800 light:border-slate-300">
                <div className="text-[10px] text-zinc-400 light:text-slate-600">Guariti (2/2)</div>
                <div className="font-mono font-bold text-emerald-400 light:text-emerald-800 mt-0.5">
                  {leitnerBuckets.masteredAfterErrorCount}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subject Accuracy Breakdown + Chart 3b (Exam Points at Risk per Subject) */}
        <div className="p-5 rounded-2xl border border-zinc-700 bg-zinc-900 light:bg-white light:border-slate-300 light:shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-400 light:text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Risposte Esatte & Punti a Rischio per Materia</span>
            </h3>
            <span className="text-[10px] text-zinc-500 italic hidden sm:inline">
              Tocca una materia per ispezionarla
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {subjectsAnalytics.map(sub => {
              const weight = sub.pointWeight ?? getSubjectPointWeight(sub.id);
              const quota = sub.examQuota ?? OFFICIAL_EXAM_QUOTAS[sub.id] ?? 1;
              const maxExamPts = sub.maxExamPoints ?? quota * weight;
              const computedRisk =
                sub.examPointsAtRisk ??
                (sub.seen > 0
                  ? Math.round(maxExamPts * Math.max(0, 1 - sub.correct / sub.seen) * 10) / 10
                  : 0);
              const activeMistakes =
                sub.activeMistakesCount ??
                questions.filter(
                  q => q.subjectId === sub.id && isMistakeQuestion(statsMap.get(q.id))
                ).length;

              return (
                <div
                  key={sub.id}
                  className="w-full rounded-xl hover:bg-zinc-800/50 light:hover:bg-slate-100 transition-colors group"
                >
                  <button
                    type="button"
                    id={`btn-stat-subject-${sub.id}`}
                    onClick={() => handleOpenSubject(sub.id, 'all')}
                    className="w-full text-left space-y-1 p-2 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-zinc-300 light:text-slate-700 font-medium truncate max-w-[165px] sm:max-w-[235px] group-hover:text-amber-400 light:group-hover:text-amber-600 transition-colors">
                          0{sub.id} {sub.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800/90 text-zinc-300 light:bg-slate-100 light:text-slate-700 border border-zinc-700/70 light:border-slate-300 text-[10px] font-mono whitespace-nowrap flex-shrink-0">
                          {weight} pt
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        {computedRisk >= 0.5 && (
                          <span
                            id={`badge-stat-risk-${sub.id}`}
                            onClick={e => {
                              if (activeMistakes > 0) {
                                e.stopPropagation();
                                handleOpenSubject(sub.id, 'wrong');
                              }
                            }}
                            title="Punti esame a rischio su 100 pt ufficiali AeCI"
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap border ${
                              computedRisk >= 3
                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 light:bg-rose-100 light:text-rose-800 light:border-rose-300'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/30 light:bg-amber-100 light:text-amber-800 light:border-amber-300'
                            }`}
                          >
                            -{computedRisk.toFixed(1)} pt
                          </span>
                        )}
                        <span className="text-zinc-400 light:text-slate-600 text-[11px] whitespace-nowrap">
                          {sub.seen}/{sub.total}
                        </span>
                        <span
                          className={`font-bold w-9 text-right whitespace-nowrap ${
                            sub.accuracy >= 90
                              ? 'text-emerald-400 light:text-emerald-800'
                              : sub.accuracy >= 70
                              ? 'text-amber-400 light:text-amber-800'
                              : 'text-zinc-400 light:text-slate-600'
                          }`}
                        >
                          {sub.seen > 0 ? `${sub.accuracy}%` : '-'}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 light:text-slate-500 group-hover:text-zinc-200 light:group-hover:text-slate-800 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>

                    <div className="w-full bg-zinc-950/80 border border-zinc-800 light:bg-slate-200 light:border-slate-300/60 rounded-full h-1.5 overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-300 ${
                          sub.accuracy >= 90
                            ? 'bg-emerald-500'
                            : sub.accuracy >= 70
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${sub.accuracy}%` }}
                      />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Exam Simulation History + Chart 2 (SVG /100 pt Score Trend) */}
        <div className="p-5 rounded-2xl border border-zinc-700 bg-zinc-900 light:bg-white light:border-slate-300 light:shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-xs font-bold text-zinc-400 light:text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Storico Simulazioni d'Esame</span>
            </h3>
            {trendChartGeometry && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 light:bg-emerald-100 light:text-emerald-800">
                  &gt;=86 Idoneo
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 light:bg-amber-100 light:text-amber-800">
                  80-85 Orale
                </span>
              </div>
            )}
          </div>

          {answeredSessions.length === 0 ? (
            <p className="text-xs text-zinc-400 light:text-slate-600 py-3 text-center">
              Nessuna simulazione completata finora.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Chart 2: Native SVG /100 pt Trend Sparkline with 86 pt and 80 pt AeCI Threshold Bands */}
              {trendChartGeometry && (
                <div className="p-3 rounded-xl bg-zinc-950/70 light:bg-slate-50 border border-zinc-800 light:border-slate-300">
                  <svg
                    id="exam-trend-chart"
                    viewBox="0 0 340 130"
                    role="img"
                    aria-label={`Andamento punteggi ultime ${examTrend.length} simulazioni: ultimo punteggio ${trendChartGeometry.latestPoint.scoreOn100} su 100 punti`}
                    className="w-full h-[130px] overflow-visible"
                  >
                    {/* Passed Target Band (86..100 pt) */}
                    <rect
                      x={trendChartGeometry.padLeft}
                      y={trendChartGeometry.y100}
                      width={trendChartGeometry.plotW}
                      height={Math.max(2, trendChartGeometry.y86 - trendChartGeometry.y100)}
                      rx="4"
                      className="fill-emerald-500/10 light:fill-emerald-500/15"
                    />

                    {/* 86 pt Official Pass Threshold Line */}
                    <line
                      x1={trendChartGeometry.padLeft}
                      x2={trendChartGeometry.padLeft + trendChartGeometry.plotW}
                      y1={trendChartGeometry.y86}
                      y2={trendChartGeometry.y86}
                      strokeDasharray="4 3"
                      strokeWidth="1"
                      className="stroke-emerald-500/70 light:stroke-emerald-600/80"
                    />
                    <text
                      x="4"
                      y={trendChartGeometry.y86 + 3}
                      className="fill-emerald-400 light:fill-emerald-800 text-[9px] font-mono font-bold"
                    >
                      86
                    </text>

                    {/* 80 pt Oral Verification Threshold Line */}
                    <line
                      x1={trendChartGeometry.padLeft}
                      x2={trendChartGeometry.padLeft + trendChartGeometry.plotW}
                      y1={trendChartGeometry.y80}
                      y2={trendChartGeometry.y80}
                      strokeDasharray="2 3"
                      strokeWidth="1"
                      className="stroke-amber-500/60 light:stroke-amber-600/80"
                    />
                    <text
                      x="4"
                      y={trendChartGeometry.y80 + 3}
                      className="fill-amber-400 light:fill-amber-800 text-[9px] font-mono font-bold"
                    >
                      80
                    </text>

                    {/* Trend Polyline */}
                    {trendChartGeometry.points.length > 1 && (
                      <polyline
                        fill="none"
                        points={trendChartGeometry.polylinePoints}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="stroke-amber-400 light:stroke-amber-600"
                      />
                    )}

                    {/* Simulation Score Nodes */}
                    {trendChartGeometry.points.map((pt, i) => {
                      const isFirstOrLast =
                        i === 0 || i === trendChartGeometry.points.length - 1;
                      const dotClass =
                        pt.outcome === 'passed'
                          ? 'fill-emerald-400 light:fill-emerald-600 stroke-zinc-950 light:stroke-white'
                          : pt.outcome === 'oral_check'
                          ? 'fill-amber-400 light:fill-amber-600 stroke-zinc-950 light:stroke-white'
                          : 'fill-rose-400 light:fill-rose-600 stroke-zinc-950 light:stroke-white';

                      return (
                        <g key={pt.sessionId ?? i}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="4.5"
                            strokeWidth="2"
                            className={dotClass}
                          />
                          {isFirstOrLast && (
                            <text
                              x={pt.x}
                              y={Math.max(11, pt.y - 7)}
                              textAnchor="middle"
                              className="fill-zinc-200 light:fill-slate-800 text-[9px] font-mono font-bold"
                            >
                              {Math.round(pt.scoreOn100)}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}

              <div className="space-y-2">
                {answeredSessions.slice(0, 5).map((s, idx) => {
                  const dateStr = new Date(s.date).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const mins = Math.floor(s.durationSeconds / 60);
                  const outcome = resolveSessionOutcome(s);
                  const hasWeightedScore = typeof s.scorePoints === 'number';

                  const badgeClass =
                    outcome === 'passed'
                      ? 'bg-emerald-500/20 text-emerald-400 light:bg-emerald-100 light:text-emerald-800'
                      : outcome === 'oral_check'
                      ? 'bg-amber-500/20 text-amber-400 light:bg-amber-100 light:text-amber-800'
                      : 'bg-rose-500/20 text-rose-400 light:bg-rose-100 light:text-rose-800';

                  const badgeLabel =
                    outcome === 'passed'
                      ? 'IDONEO'
                      : outcome === 'oral_check'
                      ? 'VERIFICA ORALE'
                      : 'NON IDONEO';

                  return (
                    <div
                      key={s.id || idx}
                      className="p-3 rounded-xl border border-zinc-700 bg-zinc-950/60 light:bg-slate-50 light:border-slate-300 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] whitespace-nowrap ${badgeClass}`}>
                            {badgeLabel}
                          </span>
                          {hasWeightedScore && (
                            <span className="font-mono font-black text-amber-300 light:text-amber-800 whitespace-nowrap">
                              {s.scorePoints}/{s.maxPoints ?? 100} pt
                            </span>
                          )}
                          <span className="font-mono font-bold text-zinc-200 light:text-slate-800 whitespace-nowrap">
                            {s.correctAnswers}/{s.totalQuestions} ({s.wrongAnswers} err)
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 light:text-slate-600 flex items-center gap-2">
                          <span>{dateStr}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 whitespace-nowrap">
                            <Clock className="w-3 h-3" /> {mins} min
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Top 10 Most Frequently Missed Questions */}
        {topWrongQuestions.length > 0 && (
          <div className="p-5 rounded-2xl border border-zinc-700 bg-zinc-900 light:bg-white light:border-slate-300 light:shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Top 10 Domande con Più Errori</span>
              </h3>
              <span className="text-[10px] text-zinc-400 light:text-slate-600 italic hidden sm:inline">
                Tocca una domanda per la scheda completa
              </span>
            </div>

            <div className="space-y-2">
              {topWrongQuestions.map(item => (
                <button
                  type="button"
                  key={item.question.id}
                  id={`btn-stat-wrong-q-${item.question.id}`}
                  onClick={() => setSelectedQuestion(item.question)}
                  className="w-full text-left p-2.5 rounded-lg border border-zinc-700/80 bg-zinc-950/40 hover:bg-zinc-800/50 hover:border-zinc-600 light:bg-slate-50 light:border-slate-300 light:hover:bg-slate-100 text-xs flex items-center justify-between gap-3 transition-colors group cursor-pointer"
                >
                  <div className="space-y-0.5 truncate flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400">
                        #{item.question.id}
                      </span>
                      <span className="text-[10px] text-zinc-400 light:text-slate-600">
                        {item.question.subjectName}
                      </span>
                    </div>
                    <p className="text-zinc-300 light:text-slate-700 truncate group-hover:text-zinc-100 light:group-hover:text-slate-900">
                      {item.question.question}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 light:bg-rose-100 light:text-rose-700 font-bold text-[10px] whitespace-nowrap">
                      {item.timesWrong} {item.timesWrong === 1 ? 'errore' : 'errori'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 light:text-slate-500 group-hover:text-zinc-200 light:group-hover:text-slate-800 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Subject Detail Drilldown Modal */}
      <SubjectDetailModal
        subjectId={selectedSubjectId}
        isOpen={selectedSubjectId !== null}
        initialFilterMode={subjectInitialFilter}
        onClose={() => setSelectedSubjectId(null)}
        onSelectQuestion={(q) => setSelectedQuestion(q)}
        onTrainSubject={onTrainSubject}
      />

      {/* Question Detail Modal */}
      <QuestionDetailModal
        question={selectedQuestion}
        isOpen={selectedQuestion !== null}
        onClose={() => setSelectedQuestion(null)}
      />
    </>
  );
};
