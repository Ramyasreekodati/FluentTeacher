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

export type AssessmentType = 'grammar' | 'vocabulary' | 'speaking' | 'reading' | 'writing' | 'fluency' | 'grand' | 'weekly' | 'monthly' | null;

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
  currentLessonIndex?: number;
  currentLessonStepIndex?: number;
  currentExerciseIndex?: number;
  lastAssessmentSkill?: string;
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

export interface DailyPlan {
  userId: string;
  day: number;
  learning: {
    lesson_id: string;
    title: string;
  };
  topic: {
    title: string;
    focus: string;
    level: string;
    content_blocks: string[];
  };
  exercise: {
    exercise_id: string;
    type: string;
    source: string;
  };
  assessment: {
    type: string;
    goal: string;
  };
  completed: {
    learning: boolean;
    topic: boolean;
    exercise: boolean;
    assessment: boolean;
  };
}

export type View = 'dashboard' | 'curriculum' | 'lesson' | 'practice' | 'assessment' | 'progress' | 'topic_of_the_day' | 'exercise' | 'learning_plan' | 'ai_engine' | 'daily_practice';

export type LessonStep = 
  | 'warmup' 
  | 'micro_learning' 
  | 'memory_reinforcement' 
  | 'active_recall' 
  | 'quick_challenge' 
  | 'speak_think';

export interface Question {
  id: string;
  text: string;
  correctAnswer: string;
  explanation?: string;
  type: 'text' | 'mcq' | 'boolean';
  options?: string[];
}

export interface Exercise {
  id: string;
  title: string;
  type: string;
  skill: 'Listening' | 'Reading' | 'Writing' | 'Grammar' | 'Vocabulary';
  subSkill: string;
  source: string;
  description: string;
  content?: string;
  audioUrl?: string;
  questions: Question[];
}

export interface Topic {
  id: string;
  title: string;
  level: LanguageLevel;
  description: string;
  isLocked: boolean;
  isTest?: boolean;
  isMonthly?: boolean;
}

export interface LearningModule {
  title: string;
  level: string;
  sections: Array<{
    type: 'explanation' | 'rules' | 'vocabulary' | 'examples' | 'mistakes' | 'exercise' | 'speaking' | 'writing' | 'quiz';
    content?: string;
    items?: any[];
    questions?: any[];
  }>;
}
