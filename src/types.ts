export type LanguageLevel = 'Beginner' | 'Elementary' | 'Intermediate' | 'Upper-Intermediate' | 'Advanced' | 'Proficiency';

export interface ComponentScore {
  grammar: number;
  vocabulary: number;
  speaking: number;
  writing: number;
  reading: number;
}

export type League = 
  | 'Bronze' 
  | 'Silver' 
  | 'Gold' 
  | 'Sapphire' 
  | 'Ruby' 
  | 'Emerald' 
  | 'Amethyst' 
  | 'Pearl' 
  | 'Obsidian' 
  | 'Diamond';

export interface UserProgress {
  level: LanguageLevel;
  overallScore: number;
  componentScores: ComponentScore;
  streak: number;
  completedSessions: number;
  completedTopics: string[];
  mistakes: Array<{
    id: string;
    original: string;
    corrected: string;
    explanation: string;
    rule: string;
    examples: string[];
    status?: 'active' | 'learned';
  }>;
  lastActive: string;
  currentTopic?: string;
  weeklyEvaluation?: string;
  monthlyReport?: string;
  accuracy: number; // correct answers / attempted
  completion: number; // attempted / total
  league: League;
  testPerformance: number[]; // Scores of recent tests
  skillHistory: {
    grammar: number[];
    vocabulary: number[];
    speaking: number[];
    writing: number[];
    reading: number[];
  };
}

export type View = 'dashboard' | 'curriculum' | 'lesson' | 'practice' | 'assessment' | 'progress' | 'topic_of_the_day' | 'exercise';

export type LessonStep = 
  | 'warmup' 
  | 'micro_learning' 
  | 'memory_reinforcement' 
  | 'active_recall' 
  | 'quick_challenge' 
  | 'speak_think';

export interface Topic {
  id: string;
  title: string;
  level: LanguageLevel;
  description: string;
  isLocked: boolean;
  isTest?: boolean;
  isMonthly?: boolean;
}
