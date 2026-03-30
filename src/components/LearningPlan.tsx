import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ExternalLink, 
  Calendar,
  ChevronRight,
  Sparkles,
  BookOpen,
  Mic,
  PenTool,
  Headphones,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { UserProgress } from '../types';

interface LearningPlanProps {
  progress: UserProgress;
  onBack: () => void;
}

interface Task {
  id: string;
  title: string;
  resource: string;
  url: string;
  duration: string;
  category: 'warm-up' | 'listening/speaking' | 'grammar/writing' | 'practice' | 'review';
  completed: boolean;
}

const DEFAULT_TASKS: Task[] = [
  {
    id: '1',
    title: 'Daily Vocabulary Warm-up',
    resource: 'Duolingo',
    url: 'https://www.duolingo.com',
    duration: '15 min',
    category: 'warm-up',
    completed: false
  },
  {
    id: '2',
    title: 'IELTS Listening Practice',
    resource: 'ESLPod / Elllo',
    url: 'https://www.elllo.org',
    duration: '30 min',
    category: 'listening/speaking',
    completed: false
  },
  {
    id: '3',
    title: 'Grammar & Structure Review',
    resource: 'British Council / Grammarly',
    url: 'https://learnenglish.britishcouncil.org',
    duration: '20 min',
    category: 'grammar/writing',
    completed: false
  },
  {
    id: '4',
    title: 'Speaking Fluency Drill',
    resource: 'HiNative / BBC Learning English',
    url: 'https://www.bbc.co.uk/learningenglish',
    duration: '25 min',
    category: 'listening/speaking',
    completed: false
  },
  {
    id: '5',
    title: 'Standardized Proficiency Test',
    resource: 'EF SET',
    url: 'https://www.efset.org',
    duration: '50 min',
    category: 'practice',
    completed: false
  },
  {
    id: '6',
    title: 'Daily Mistake Review',
    resource: 'FluentTeacher AI',
    url: '#',
    duration: '15 min',
    category: 'review',
    completed: false
  }
];

export default function LearningPlan({ progress, onBack }: LearningPlanProps) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('fluent_teacher_daily_plan');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if it's a new day
      const lastUpdate = localStorage.getItem('fluent_teacher_plan_date');
      const today = new Date().toDateString();
      if (lastUpdate !== today) {
        return DEFAULT_TASKS;
      }
      return parsed;
    }
    return DEFAULT_TASKS;
  });

  useEffect(() => {
    localStorage.setItem('fluent_teacher_daily_plan', JSON.stringify(tasks));
    localStorage.setItem('fluent_teacher_plan_date', new Date().toDateString());
  }, [tasks]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'warm-up': return <Zap className="w-4 h-4" />;
      case 'listening/speaking': return <Mic className="w-4 h-4" />;
      case 'grammar/writing': return <PenTool className="w-4 h-4" />;
      case 'practice': return <BookOpen className="w-4 h-4" />;
      case 'review': return <Sparkles className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'warm-up': return 'bg-amber-100 text-amber-600';
      case 'listening/speaking': return 'bg-blue-100 text-blue-600';
      case 'grammar/writing': return 'bg-rose-100 text-rose-600';
      case 'practice': return 'bg-emerald-100 text-emerald-600';
      case 'review': return 'bg-purple-100 text-purple-600';
      default: return 'bg-zinc-100 text-zinc-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <header className="mb-12">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors mb-8 font-bold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="font-display text-4xl font-bold tracking-tight">Daily IELTS Learning Plan</h1>
            </div>
            <p className="text-zinc-500 text-lg max-w-xl">
              Your personalized roadmap to IELTS proficiency. Complete these tasks daily to maintain your streak and accelerate your progress.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm min-w-[200px]">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Daily Progress</span>
              <span className="text-2xl font-bold text-emerald-600">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-2 font-bold uppercase">
              {completedCount} of {tasks.length} tasks completed
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`group relative overflow-hidden bg-white p-6 rounded-[32px] border transition-all duration-300 ${
              task.completed 
                ? 'border-emerald-200 bg-emerald-50/30' 
                : 'border-zinc-200 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-900/5'
            }`}
          >
            <div className="flex items-center gap-6">
              <button 
                onClick={() => toggleTask(task.id)}
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  task.completed 
                    ? 'bg-emerald-500 text-white scale-110' 
                    : 'bg-zinc-100 text-zinc-300 hover:bg-emerald-100 hover:text-emerald-500'
                }`}
              >
                {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
              </button>
              
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h3 className={`font-bold text-lg transition-all ${task.completed ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>
                    {task.title}
                  </h3>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${getCategoryColor(task.category)}`}>
                    {getCategoryIcon(task.category)}
                    {task.category}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {task.duration}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    {task.resource}
                  </div>
                </div>
              </div>

              {task.url !== '#' && (
                <a 
                  href={task.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-zinc-50 text-zinc-400 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all"
                  title={`Open ${task.resource}`}
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 p-8 bg-zinc-900 rounded-[40px] text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              Pro Tip for IELTS
            </h3>
            <p className="text-zinc-400 max-w-xl">
              Consistency is more important than intensity. Spending 20 minutes every single day is more effective than a 4-hour session once a week.
            </p>
          </div>
          <button 
            onClick={onBack}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold transition-all whitespace-nowrap"
          >
            Got it, let's learn!
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-3xl rounded-full -mr-20 -mt-20"></div>
      </div>
    </div>
  );
}
