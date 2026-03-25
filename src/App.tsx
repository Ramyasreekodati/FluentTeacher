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
  Book
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UserProgress, View, Topic, ComponentScore } from './types';
import { generateResponse, SYSTEM_INSTRUCTIONS } from './services/gemini';

// Components
import Dashboard from './components/Dashboard';
import Curriculum from './components/Curriculum';
import LessonView from './components/LessonView';
import Assessment from './components/Assessment';
import Progress from './components/Progress';
import ChatWidget from './components/ChatWidget';
import TopicOfTheDay from './components/TopicOfTheDay';
import ExerciseView from './components/ExerciseView';
import { CURRICULUM } from './data/curriculum';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [assessmentType, setAssessmentType] = useState<'grammar' | 'vocabulary' | 'speaking' | 'reading' | 'writing' | 'grand' | 'weekly' | 'monthly' | null>(null);
  
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('fluent_teacher_progress_v2');
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
      }
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      } catch (e) {
        console.error("Failed to parse progress", e);
        return defaults;
      }
    }
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem('fluent_teacher_progress_v2', JSON.stringify(progress));
  }, [progress]);

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
        testPerformance: newTestPerformance
      };
    });

    setActiveView('dashboard');
    setSelectedTopic(null);
  };

  const handleAssessmentComplete = (scores: ComponentScore) => {
    setProgress(prev => {
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
        testPerformance: [...prev.testPerformance, overall]
      };
    });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'curriculum', label: 'Learning Path', icon: BookOpen },
    { id: 'assessment', label: 'Assessment', icon: GraduationCap },
    { id: 'topic_of_the_day', label: 'Topic of the Day', icon: Sparkles },
    { id: 'exercise', label: 'Exercise', icon: Book },
    { id: 'progress', label: 'Performance', icon: BarChart3 },
  ];

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
                  onComplete={handleTopicComplete}
                  onBack={() => setActiveView('curriculum')}
                />
              )}
              {activeView === 'assessment' && (
                <Assessment 
                  progress={progress} 
                  type={assessmentType}
                  onComplete={(scores) => {
                    handleAssessmentComplete(scores);
                  }} 
                  onExit={() => {
                    setAssessmentType(null);
                    setActiveView('dashboard');
                    setIsLocked(false);
                  }}
                  onLockChange={setIsLocked}
                />
              )}
              {activeView === 'progress' && (
                <Progress progress={progress} setProgress={setProgress} />
              )}
              {activeView === 'topic_of_the_day' && (
                <TopicOfTheDay />
              )}
              {activeView === 'exercise' && (
                <ExerciseView onBack={() => setActiveView('dashboard')} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <ChatWidget />
      </main>
    </div>
  );
}
