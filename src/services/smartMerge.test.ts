import { describe, it, expect } from 'vitest';
import {
  mergeQuestionStats,
  mergeExamSessions,
  mergeSettings,
  mergeActiveSession,
  smartMergeBackups
} from './smartMerge';
import type {
  QuestionStat,
  ExamSession,
  InProgressSession,
  BackupDataPayload
} from '../types/database';

describe('smartMerge service', () => {
  describe('mergeQuestionStats', () => {
    it('should retain non-overlapping questions from both sources', () => {
      const local: QuestionStat[] = [
        {
          questionId: 1,
          timesSeen: 2,
          timesCorrect: 2,
          timesWrong: 0,
          consecutiveCorrect: 2,
          isBookmarked: false,
          lastAnsweredAt: 1000
        }
      ];

      const incoming: QuestionStat[] = [
        {
          questionId: 2,
          timesSeen: 1,
          timesCorrect: 0,
          timesWrong: 1,
          consecutiveCorrect: 0,
          isBookmarked: true,
          lastAnsweredAt: 2000
        }
      ];

      const merged = mergeQuestionStats(local, incoming);
      expect(merged).toHaveLength(2);
      expect(merged.find(q => q.questionId === 1)?.timesSeen).toBe(2);
      expect(merged.find(q => q.questionId === 2)?.isBookmarked).toBe(true);
    });

    it('should adopt the learning state of the newer attempt for overlapping questions', () => {
      const local: QuestionStat[] = [
        {
          questionId: 10,
          timesSeen: 1,
          timesCorrect: 0,
          timesWrong: 1,
          lastResult: 'wrong',
          consecutiveCorrect: 0,
          isBookmarked: false,
          lastAnsweredAt: 1000
        }
      ];

      const incoming: QuestionStat[] = [
        {
          questionId: 10,
          timesSeen: 2,
          timesCorrect: 1,
          timesWrong: 1,
          lastResult: 'correct',
          consecutiveCorrect: 1,
          isBookmarked: true,
          lastAnsweredAt: 2000
        }
      ];

      const merged = mergeQuestionStats(local, incoming);
      expect(merged).toHaveLength(1);
      const stat = merged[0];
      expect(stat.lastResult).toBe('correct');
      expect(stat.consecutiveCorrect).toBe(1);
      expect(stat.lastAnsweredAt).toBe(2000);
      expect(stat.isBookmarked).toBe(true);
      expect(stat.timesSeen).toBe(2);
      expect(stat.timesCorrect).toBe(1);
      expect(stat.timesWrong).toBe(1);
    });

    it('should preserve local learning state when local is newer than incoming', () => {
      const local: QuestionStat[] = [
        {
          questionId: 15,
          timesSeen: 3,
          timesCorrect: 3,
          timesWrong: 0,
          lastResult: 'correct',
          consecutiveCorrect: 3,
          isBookmarked: true,
          lastAnsweredAt: 5000
        }
      ];

      const incoming: QuestionStat[] = [
        {
          questionId: 15,
          timesSeen: 2,
          timesCorrect: 1,
          timesWrong: 1,
          lastResult: 'wrong',
          consecutiveCorrect: 0,
          isBookmarked: false,
          lastAnsweredAt: 3000
        }
      ];

      const merged = mergeQuestionStats(local, incoming);
      const stat = merged[0];
      expect(stat.lastResult).toBe('correct');
      expect(stat.consecutiveCorrect).toBe(3);
      expect(stat.lastAnsweredAt).toBe(5000);
      expect(stat.isBookmarked).toBe(true);
      expect(stat.timesCorrect).toBe(3);
      expect(stat.timesWrong).toBe(1);
      expect(stat.timesSeen).toBe(4);
    });

    it('should enforce monotonic bounds for timesSeen >= timesCorrect + timesWrong', () => {
      const local: QuestionStat[] = [
        {
          questionId: 20,
          timesSeen: 2,
          timesCorrect: 2,
          timesWrong: 0,
          consecutiveCorrect: 2,
          isBookmarked: false,
          lastAnsweredAt: 1000
        }
      ];

      const incoming: QuestionStat[] = [
        {
          questionId: 20,
          timesSeen: 1,
          timesCorrect: 0,
          timesWrong: 1,
          consecutiveCorrect: 0,
          isBookmarked: false,
          lastAnsweredAt: 2000
        }
      ];

      const merged = mergeQuestionStats(local, incoming);
      const stat = merged[0];
      expect(stat.timesCorrect).toBe(2);
      expect(stat.timesWrong).toBe(1);
      expect(stat.timesSeen).toBe(3); // Math.max(2, 1, 2 + 1)
    });

    it('should correctly merge user notes across devices', () => {
      const local: QuestionStat[] = [
        {
          questionId: 30,
          timesSeen: 1,
          timesCorrect: 1,
          timesWrong: 0,
          consecutiveCorrect: 1,
          isBookmarked: false,
          userNote: 'Attenzione alla pressione standard',
          lastAnsweredAt: 1000
        }
      ];

      const incomingWithoutNote: QuestionStat[] = [
        {
          questionId: 30,
          timesSeen: 2,
          timesCorrect: 2,
          timesWrong: 0,
          consecutiveCorrect: 2,
          isBookmarked: false,
          lastAnsweredAt: 2000
        }
      ];

      const merged = mergeQuestionStats(local, incomingWithoutNote);
      expect(merged[0].userNote).toBe('Attenzione alla pressione standard');
    });
  });

  describe('mergeExamSessions', () => {
    const baseSession: ExamSession = {
      id: 1,
      date: 1727500000000,
      durationSeconds: 1200,
      totalQuestions: 30,
      correctAnswers: 28,
      wrongAnswers: 2,
      isPassed: true,
      isMarathon: false,
      subjectBreakdown: {},
      snapshots: []
    };

    it('should unite non-duplicate sessions from both devices', () => {
      const localSessions: ExamSession[] = [baseSession];
      const incomingSessions: ExamSession[] = [
        {
          ...baseSession,
          id: 5,
          date: 1727600000000,
          correctAnswers: 29,
          wrongAnswers: 1
        }
      ];

      const { sessions, addedCount } = mergeExamSessions(localSessions, incomingSessions);
      expect(sessions).toHaveLength(2);
      expect(addedCount).toBe(1);
      // Incoming session id is stripped to allow auto-increment in Dexie
      expect(sessions[1].id).toBeUndefined();
    });

    it('should deduplicate identical sessions taken at the exact same timestamp', () => {
      const localSessions: ExamSession[] = [baseSession];
      const incomingSessions: ExamSession[] = [{ ...baseSession, id: 99 }];

      const { sessions, addedCount } = mergeExamSessions(localSessions, incomingSessions);
      expect(sessions).toHaveLength(1);
      expect(addedCount).toBe(0);
      expect(sessions[0].id).toBe(1);
    });
  });

  describe('mergeSettings', () => {
    it('should merge settings and take the latest lastDriveSyncAt timestamp', () => {
      const local = [
        { key: 'theme', value: 'dark' },
        { key: 'lastDriveSyncAt', value: 1000 }
      ];

      const incoming = [
        { key: 'theme', value: 'light' },
        { key: 'lastDriveSyncAt', value: 2500 },
        { key: 'autoSyncDrive', value: true }
      ];

      const merged = mergeSettings(local, incoming);
      const map = new Map(merged.map(item => [item.key, item.value]));

      expect(map.get('lastDriveSyncAt')).toBe(2500);
      expect(map.get('autoSyncDrive')).toBe(true);
      expect(map.get('theme')).toBe('light');
    });
  });

  describe('mergeActiveSession', () => {
    const now = 1727540000000;

    const sessionA: InProgressSession = {
      type: 'topic',
      subjectId: 2,
      subjectName: 'Meteorologia',
      questionIds: [10, 11, 12, 13, 14],
      currentIndex: 3,
      answers: { 10: 1, 11: 2, 12: 3 },
      updatedAt: now - 1000 * 60 * 10 // 10 minutes ago
    };

    const sessionB: InProgressSession = {
      type: 'exam',
      questionIds: [1, 2, 3],
      currentIndex: 1,
      answers: { 1: 1 },
      updatedAt: now - 1000 * 60 * 2 // 2 minutes ago
    };

    it('should choose the newer active session', () => {
      const result = mergeActiveSession(sessionA, sessionB, undefined, now);
      expect(result?.type).toBe('exam');
      expect(result?.currentIndex).toBe(1);
    });

    it('should discard expired active sessions (> 48 hours)', () => {
      const expiredSession: InProgressSession = {
        ...sessionA,
        updatedAt: now - 1000 * 60 * 60 * 50 // 50 hours ago
      };

      const result = mergeActiveSession(expiredSession, null, undefined, now);
      expect(result).toBeNull();
    });
  });

  describe('smartMergeBackups', () => {
    it('should coordinate complete backup merging and produce accurate summary', () => {
      const local: BackupDataPayload = {
        version: 1,
        exportedAt: 1000,
        stats: [
          {
            questionId: 1,
            timesSeen: 1,
            timesCorrect: 1,
            timesWrong: 0,
            consecutiveCorrect: 1,
            isBookmarked: false,
            lastAnsweredAt: 1000
          }
        ],
        sessions: [],
        settings: [{ key: 'autoSyncDrive', value: true }]
      };

      const incoming: BackupDataPayload = {
        version: 2,
        exportedAt: 2000,
        stats: [
          {
            questionId: 2,
            timesSeen: 1,
            timesCorrect: 0,
            timesWrong: 1,
            consecutiveCorrect: 0,
            isBookmarked: true,
            lastAnsweredAt: 2000
          }
        ],
        sessions: [
          {
            date: 1727500000000,
            durationSeconds: 900,
            totalQuestions: 30,
            correctAnswers: 30,
            wrongAnswers: 0,
            isPassed: true,
            isMarathon: false,
            subjectBreakdown: {},
            snapshots: []
          }
        ],
        settings: [],
        activeSession: {
          type: 'topic',
          subjectId: 1,
          questionIds: [1, 2],
          currentIndex: 0,
          answers: {},
          updatedAt: Date.now()
        }
      };

      const result = smartMergeBackups(local, incoming);
      expect(result.stats).toHaveLength(2);
      expect(result.sessions).toHaveLength(1);
      expect(result.summary.addedSessionsCount).toBe(1);
      expect(result.summary.hasActiveSession).toBe(true);
      expect(result.activeSession?.subjectId).toBe(1);
    });

    it('should throw an error on malformed incoming data', () => {
      const local: BackupDataPayload = {
        version: 1,
        exportedAt: 1000,
        stats: [],
        sessions: [],
        settings: []
      };

      expect(() => smartMergeBackups(local, null as any)).toThrow();
      expect(() => smartMergeBackups(local, {} as any)).toThrow();
    });
  });
});
