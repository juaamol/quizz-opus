export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string;
  theme?: string;
}

export type AppState = 'HOME' | 'QUIZ' | 'RESULTS';
