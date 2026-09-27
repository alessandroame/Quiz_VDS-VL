// Tipi per il catalogo quiz VDS-VL
export interface QuizExplanation {
  rule: string;
  trap: string;
}

export interface Question {
  id: number;
  subjectId: number;
  subjectName: string;
  question: string;
  options: [string, string, string];
  correctAnswer: 1 | 2 | 3;
  explanation: QuizExplanation;
}

export interface SubjectMeta {
  id: number;
  name: string;
  questionCount: number;
  examQuota: number;
}
