import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  GraduationCap, 
  BarChart3, 
  Menu, 
  X, 
  Flame,
  Trophy,
  Sparkles,
  Zap,
  Book,
  Calendar,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UserProgress, View, Topic, ComponentScore, AssessmentType, DailyPlan } from './types';
import { generateResponse, SYSTEM_INSTRUCTIONS } from './services/gemini';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';

// Components
import Dashboard from './components/Dashboard';
import Curriculum from './components/Curriculum';
import LessonView from './components/LessonView';
import Assessment from './components/Assessment';
import Progress from './components/Progress';
import ChatWidget from './components/ChatWidget';
import TopicOfTheDay from './components/TopicOfTheDay';
import LearningPlan from './components/LearningPlan';
import AIEngine from './components/AIEngine';
import ExerciseView from './components/ExerciseView';
import DailyPractice from './components/DailyPractice';
import { CURRICULUM } from './data/curriculum';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [activeDailyTask, setActiveDailyTask] = useState<keyof DailyPlan['completed'] | null>(null);
  const [currentDailyPlan, setCurrentDailyPlan] = useState<DailyPlan | null>(null);
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [progress, setProgress] = useState<UserProgress>(() => {
    const defaults: UserProgress = {
      level: 'Beginner',
      overallScore: 0,
      componentScores: {
        grammar: 0,
        vocabulary: 0,
        speaking: 0,
        writing: 0,
        reading: 0
      },
      streak: 0,
      completedSessions: 0,
      completedTopics: [],
      mistakes: [],
      lastActive: new Date().toISOString(),
      accuracy: 0,
      completion: 0,
      league: 'Bronze',
      testPerformance: [],
      skillHistory: {
        grammar: [],
        vocabulary: [],
        speaking: [],
        writing: [],
        reading: []
      },
      currentLessonIndex: 0,
      currentExerciseIndex: 0,
      lastAssessmentSkill: 'Writing'
    };
    return defaults;
  });

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch or create user progress in Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setProgress(userDoc.data() as UserProgress);
        } else {
          const initialProgress: UserProgress = {
            ...progress,
            lastActive: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), initialProgress);
          setProgress(initialProgress);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Sync progress to Firestore
  useEffect(() => {
    if (user) {
      const syncProgress = async () => {
        try {
          await setDoc(doc(db, 'users', user.uid), { ...progress }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      };
      syncProgress();
    }
  }, [progress, user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  // League Promotion Logic
  useEffect(() => {
    const leagues: UserProgress['league'][] = [
      'Bronze', 'Silver', 'Gold', 'Sapphire', 'Ruby', 'Emerald', 'Amethyst', 'Pearl', 'Obsidian', 'Diamond'
    ];
    
    const currentIdx = leagues.indexOf(progress.league);
    
    // Promotion rules: 
    // - Accuracy > 80% and Completion > 50% for next tier
    // - Test performance average > 75
    const avgTestScore = progress.testPerformance.length > 0 
      ? progress.testPerformance.reduce((a, b) => a + b, 0) / progress.testPerformance.length 
      : 0;

    if (progress.accuracy > 80 && progress.completion > 50 && avgTestScore > 75 && currentIdx < leagues.length - 1) {
      setProgress(p => ({ ...p, league: leagues[currentIdx + 1] }));
    } else if (progress.accuracy < 40 && currentIdx > 0) {
      setProgress(p => ({ ...p, league: leagues[currentIdx - 1] }));
    }
  }, [progress.accuracy, progress.completion, progress.testPerformance]);

  // Daily Streak Logic
  useEffect(() => {
    const today = new Date().toDateString();
    const lastActive = new Date(progress.lastActive).toDateString();
    
    if (today !== lastActive) {
      const diff = Math.abs(new Date(today).getTime() - new Date(lastActive).getTime());
      const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
      
      if (diffDays === 1) {
        setProgress(p => ({ ...p, streak: p.streak + 1, lastActive: new Date().toISOString() }));
      } else if (diffDays > 1) {
        setProgress(p => ({ ...p, streak: 1, lastActive: new Date().toISOString() }));
      }
    }
  }, []);

  const handleDailyTaskComplete = async (taskType: keyof DailyPlan['completed']) => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const planId = `${user.uid}_${today}`;
    const planRef = doc(db, 'dailyPlans', planId);

    try {
      const planSnap = await getDoc(planRef);
      if (planSnap.exists()) {
        const currentPlan = planSnap.data() as DailyPlan;
        const newCompleted = { ...currentPlan.completed, [taskType]: true };
        await setDoc(planRef, { completed: newCompleted }, { merge: true });
        
        // Update user progress with specific daily task metadata if needed
        if (taskType === 'assessment') {
          setProgress(p => ({ ...p, lastAssessmentSkill: currentPlan.assessment.type }));
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `dailyPlans/${planId}`);
    }
  };

  const handleTopicComplete = (scores: ComponentScore, sessionAccuracy: number) => {
    if (!selectedTopic) return;

    setProgress(prev => {
      const newCompletedTopics = [...prev.completedTopics];
      if (!newCompletedTopics.includes(selectedTopic.id)) {
        newCompletedTopics.push(selectedTopic.id);
      }

      // Update Accuracy & Completion
      const totalUnits = CURRICULUM.length;
      const newCompletion = Math.round((newCompletedTopics.length / totalUnits) * 100);
      
      const newAccuracy = prev.accuracy === 0 
        ? sessionAccuracy 
        : Math.round((prev.accuracy + sessionAccuracy) / 2);

      // Update Skill History
      const newSkillHistory = { ...prev.skillHistory };
      Object.entries(scores).forEach(([key, value]) => {
        const k = key as keyof ComponentScore;
        if (value > 0) {
          newSkillHistory[k] = [...newSkillHistory[k], value];
        }
      });

      // Calculate Component Scores (Average of History)
      const newComponentScores = { ...prev.componentScores };
      const activeSkills: number[] = [];
      Object.keys(newSkillHistory).forEach(key => {
        const k = key as keyof ComponentScore;
        const history = newSkillHistory[k];
        if (history.length > 0) {
          const avg = Math.round(history.reduce((a, b) => a + b, 0) / history.length);
          newComponentScores[k] = avg;
          activeSkills.push(avg);
        }
      });

      const overall = activeSkills.length > 0
        ? Math.round(activeSkills.reduce((a, b) => a + b, 0) / activeSkills.length)
        : 0;

      const newTestPerformance = [...prev.testPerformance];
      if (selectedTopic.isTest) {
        newTestPerformance.push(overall);
      }

      return {
        ...prev,
        completedTopics: newCompletedTopics,
        skillHistory: newSkillHistory,
        componentScores: newComponentScores,
        overallScore: overall,
        completedSessions: prev.completedSessions + 1,
        accuracy: newAccuracy,
        completion: newCompletion,
        testPerformance: newTestPerformance,
        currentLessonIndex: (prev.currentLessonIndex || 0) + 1,
        currentLessonStepIndex: 0,
        lastActive: new Date().toISOString()
      };
    });

    setActiveView('dashboard');
    setSelectedTopic(null);
  };

  const handleAssessmentComplete = (scores: ComponentScore, mistakes?: any[]) => {
    setProgress(prev => {
      // Update Skill History
      const newSkillHistory = { ...prev.skillHistory };
      Object.entries(scores).forEach(([key, value]) => {
        const k = key as keyof ComponentScore;
        if (value > 0) {
          newSkillHistory[k] = [...newSkillHistory[k], value];
        }
      });

      // Update Mistakes
      const newMistakes = [...prev.mistakes];
      if (mistakes && mistakes.length > 0) {
        mistakes.forEach(m => {
          newMistakes.push({
            id: Math.random().toString(36).substr(2, 9),
            original: m.original,
            corrected: m.corrected,
            explanation: m.explanation,
            rule: m.rule,
            examples: m.examples,
            status: 'active'
          });
        });
      }

      // Calculate Component Scores (Average of History)
      const newComponentScores = { ...prev.componentScores };
      const activeSkillsAssessment: number[] = [];
      Object.keys(newSkillHistory).forEach(key => {
        const k = key as keyof ComponentScore;
        const history = newSkillHistory[k];
        if (history.length > 0) {
          const avg = Math.round(history.reduce((a, b) => a + b, 0) / history.length);
          newComponentScores[k] = avg;
          activeSkillsAssessment.push(avg);
        }
      });

      const overall = activeSkillsAssessment.length > 0
        ? Math.round(activeSkillsAssessment.reduce((a, b) => a + b, 0) / activeSkillsAssessment.length)
        : 0;

      return {
        ...prev,
        skillHistory: newSkillHistory,
        componentScores: newComponentScores,
        overallScore: overall,
        mistakes: newMistakes,
        testPerformance: [...prev.testPerformance, overall],
        lastActive: new Date().toISOString()
      };
    });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'daily_practice', label: 'Daily Practice', icon: CheckCircle2 },
    { id: 'curriculum', label: 'Learning Path', icon: BookOpen },
    { id: 'assessment', label: 'Assessment', icon: GraduationCap },
    { id: 'topic_of_the_day', label: 'Topic of the Day', icon: Sparkles },
    { id: 'ai_engine', label: 'AI Engine', icon: Zap },
    { id: 'learning_plan', label: 'Learning Plan', icon: Calendar },
    { id: 'exercise', label: 'Exercise', icon: Book },
    { id: 'progress', label: 'Performance', icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-2xl text-center border border-zinc-200">
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white font-bold text-4xl mx-auto mb-8 shadow-xl shadow-emerald-900/20">F</div>
          <h1 className="text-4xl font-display font-bold text-zinc-900 mb-4 tracking-tight">FluentTeacher AI</h1>
          <p className="text-zinc-500 mb-10 text-lg leading-relaxed">Your advanced English fluency coach. Sign in to start your personalized learning journey.</p>
          <button 
            onClick={handleLogin}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-3"
          >
            Sign in with Google
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r border-zinc-200 transition-all duration-300 flex flex-col z-50",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">F</div>
              <span className="font-display font-bold text-xl tracking-tight">FluentTeacher</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold mx-auto">F</div>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                disabled={isLocked}
                onClick={() => {
                  if (isLocked) return;
                  setActiveView(item.id as View);
                  setSelectedTopic(null);
                  setAssessmentType(null);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                  activeView === item.id 
                    ? "bg-emerald-50 text-emerald-700 font-medium" 
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
                  isLocked && "opacity-50 cursor-not-allowed"
                )}
              >
                <item.icon className={cn("w-5 h-5", activeView === item.id ? "text-emerald-600" : "text-zinc-400 group-hover:text-zinc-600")} />
                {isSidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-all"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 mx-auto" />}
            {isSidebarOpen && <span className="text-sm">Collapse Menu</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-bottom border-zinc-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-display font-bold text-lg text-zinc-800">
              {activeView === 'lesson' ? 'Topic Lesson' : navItems.find(i => i.id === activeView)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-100">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span className="text-sm font-bold">{progress.streak} Day Streak</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Current Level</p>
                <p className="text-sm font-bold text-zinc-900">{progress.level}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-zinc-600 uppercase">
                {progress.level[0]}
              </div>
            </div>
          </div>
        </header>

        {/* View Container */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView === 'lesson' ? `lesson-${selectedTopic?.id}` : activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-6xl mx-auto h-full"
            >
              {activeView === 'dashboard' && (
                <Dashboard 
                  progress={progress} 
                  setView={setActiveView} 
                  onStartAssessment={(type) => {
                    setAssessmentType(type);
                    setActiveView('assessment');
                  }}
                />
              )}
              {activeView === 'curriculum' && (
                <Curriculum 
                  progress={progress} 
                  onSelectTopic={(topic) => {
                    if (topic.isTest) {
                      setAssessmentType(topic.isMonthly ? 'monthly' : 'weekly');
                      setActiveView('assessment');
                    } else {
                      const topicIndex = CURRICULUM.findIndex(t => t.id === topic.id);
                      if (topicIndex !== progress.currentLessonIndex) {
                        setProgress(prev => ({ ...prev, currentLessonStepIndex: 0 }));
                      }
                      setSelectedTopic(topic);
                      setActiveView('lesson');
                    }
                  }} 
                />
              )}
              {activeView === 'lesson' && selectedTopic && (
                <LessonView 
                  topic={selectedTopic} 
                  progress={progress} 
                  stepIndex={progress.currentLessonStepIndex || 0}
                  onStepComplete={(stepIndex) => {
                    setProgress(prev => ({
                      ...prev,
                      currentLessonStepIndex: stepIndex
                    }));
                  }}
                  onComplete={async (scores, accuracy) => {
                    handleTopicComplete(scores, accuracy);
                    if (activeDailyTask === 'learning' || activeDailyTask === 'topic') {
                      await handleDailyTaskComplete(activeDailyTask);
                      setActiveDailyTask(null);
                      setActiveView('daily_practice');
                    }
                  }}
                  onBack={() => {
                    if (activeDailyTask) {
                      setActiveDailyTask(null);
                      setActiveView('daily_practice');
                    } else {
                      setActiveView('curriculum');
                    }
                  }}
                />
              )}
              {activeView === 'assessment' && (
                <Assessment 
                  progress={progress} 
                  type={assessmentType}
                  onComplete={async (scores, mistakes) => {
                    handleAssessmentComplete(scores, mistakes);
                    if (activeDailyTask === 'assessment') {
                      await handleDailyTaskComplete('assessment');
                      setActiveDailyTask(null);
                      setActiveView('daily_practice');
                    }
                  }} 
                  onExit={() => {
                    if (activeDailyTask) {
                      setActiveDailyTask(null);
                      setActiveView('daily_practice');
                    } else {
                      setAssessmentType(null);
                      setActiveView('dashboard');
                    }
                    setIsLocked(false);
                  }}
                  onLockChange={setIsLocked}
                />
              )}
              {activeView === 'exercise' && (
                <ExerciseView 
                  exerciseIndex={progress.currentExerciseIndex || 0}
                  onBack={() => {
                    if (activeDailyTask) {
                      setActiveDailyTask(null);
                      setActiveView('daily_practice');
                    } else {
                      setActiveView('dashboard');
                    }
                  }}
                  onComplete={async () => {
                    // Always increment exercise index on completion
                    setProgress(p => ({ ...p, currentExerciseIndex: (p.currentExerciseIndex || 0) + 1 }));
                    
                    if (activeDailyTask === 'exercise') {
                      await handleDailyTaskComplete('exercise');
                      setActiveDailyTask(null);
                      setActiveView('daily_practice');
                    } else {
                      setActiveView('dashboard');
                    }
                  }}
                />
              )}
              {activeView === 'topic_of_the_day' && (
                <TopicOfTheDay 
                  onBack={() => {
                    if (activeDailyTask) {
                      setActiveDailyTask(null);
                      setActiveView('daily_practice');
                    } else {
                      setActiveView('dashboard');
                    }
                  }}
                  initialTopic={activeDailyTask === 'topic' ? currentDailyPlan?.topic.title : undefined}
                  onComplete={async () => {
                    if (activeDailyTask === 'topic') {
                      await handleDailyTaskComplete('topic');
                      setActiveDailyTask(null);
                      setActiveView('daily_practice');
                    } else {
                      setActiveView('dashboard');
                    }
                  }}
                />
              )}
              {activeView === 'daily_practice' && (
                <DailyPractice 
                  progress={progress}
                  onBack={() => setActiveView('dashboard')}
                  onStartTask={(taskType, id) => {
                    if (taskType === 'learning') {
                      const topic = CURRICULUM.find(t => t.id === id);
                      if (topic) {
                        setSelectedTopic(topic);
                        setActiveDailyTask('learning');
                        setActiveView('lesson');
                      }
                    } else if (taskType === 'exercise') {
                      setActiveDailyTask('exercise');
                      setActiveView('exercise');
                    } else if (taskType === 'topic') {
                      setActiveDailyTask('topic');
                      setActiveView('topic_of_the_day');
                    } else if (taskType === 'assessment') {
                      setAssessmentType(id as AssessmentType);
                      setActiveDailyTask('assessment');
                      setActiveView('assessment');
                    }
                  }}
                  onCompleteTask={handleDailyTaskComplete}
                />
              )}
              {activeView === 'ai_engine' && (
                <AIEngine 
                  onBack={() => setActiveView('dashboard')}
                  userLevel={progress.level}
                />
              )}
              {activeView === 'learning_plan' && (
                <LearningPlan 
                  progress={progress}
                  onBack={() => setActiveView('dashboard')}
                />
              )}
              {activeView === 'progress' && (
                <Progress 
                  progress={progress}
                  setProgress={setProgress}
                  onBack={() => setActiveView('dashboard')}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <ChatWidget />
      </main>
    </div>
  );
}
