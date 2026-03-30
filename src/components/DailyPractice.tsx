import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Book, 
  GraduationCap, 
  CheckCircle2, 
  Circle,
  ArrowRight,
  Loader2,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DailyPlan, UserProgress } from '../types';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { generateDailyPlan } from '../services/plannerService';
import { CURRICULUM } from '../data/curriculum';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DailyPracticeProps {
  progress: UserProgress;
  onBack: () => void;
  onStartTask: (taskType: keyof DailyPlan['completed'], id: string) => void;
  onCompleteTask: (taskType: keyof DailyPlan['completed']) => void;
}

export default function DailyPractice({ 
  progress, 
  onBack, 
  onStartTask,
  onCompleteTask
}: DailyPracticeProps) {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDailyTask, setSelectedDailyTask] = useState<any | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const planId = `${auth.currentUser?.uid}_${today}`;

  useEffect(() => {
    async function fetchOrGeneratePlan() {
      if (!auth.currentUser) return;
      
      try {
        setLoading(true);
        const planDoc = await getDoc(doc(db, 'dailyPlans', planId));
        
        if (planDoc.exists()) {
          setPlan(planDoc.data() as DailyPlan);
        } else {
          // Generate new plan
          const newPlan = await generateDailyPlan(
            auth.currentUser.uid,
            progress.level,
            progress.currentLessonIndex || 0,
            progress.currentExerciseIndex || 0,
            progress.lastAssessmentSkill || 'Writing'
          );
          
          await setDoc(doc(db, 'dailyPlans', planId), newPlan);
          setPlan(newPlan);
        }
      } catch (err) {
        console.error("Error fetching daily plan:", err);
        handleFirestoreError(err, OperationType.GET, `dailyPlans/${planId}`);
        setError("Failed to load your daily plan. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrGeneratePlan();
  }, [auth.currentUser, progress.level]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-zinc-500 font-medium">Generating your personalized daily plan...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error || "Something went wrong."}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  const tasks = [
    {
      id: 'learning',
      title: 'Learning Lesson',
      subtitle: plan.learning.title,
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-600',
      completed: plan.completed.learning,
      action: () => onStartTask('learning', plan.learning.lesson_id)
    },
    {
      id: 'topic',
      title: 'AI Topic Module',
      subtitle: plan.topic.title,
      icon: Sparkles,
      color: 'bg-purple-50 text-purple-600',
      completed: plan.completed.topic,
      action: () => onStartTask('topic', plan.topic.title)
    },
    {
      id: 'exercise',
      title: 'Daily Exercise',
      subtitle: plan.exercise.type,
      icon: Book,
      color: 'bg-orange-50 text-orange-600',
      completed: plan.completed.exercise,
      action: () => onStartTask('exercise', plan.exercise.exercise_id)
    },
    {
      id: 'assessment',
      title: 'Skill Assessment',
      subtitle: `${plan.assessment.type}: ${plan.assessment.goal}`,
      icon: GraduationCap,
      color: 'bg-emerald-50 text-emerald-600',
      completed: plan.completed.assessment,
      action: () => onStartTask('assessment', plan.assessment.type.toLowerCase())
    }
  ];

  const completedCount = Object.values(plan.completed).filter(Boolean).length;
  const progressPercent = (completedCount / 4) * 100;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-zinc-900">Daily Practice</h1>
          <p className="text-zinc-500 mt-1">Your structured path to English fluency.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl shadow-sm">
          <Calendar className="w-5 h-5 text-zinc-400" />
          <span className="font-medium text-zinc-700">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-zinc-800">Daily Progress</h3>
          <span className="text-sm font-bold text-emerald-600">{completedCount}/4 Tasks Completed</span>
        </div>
        <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="grid gap-4">
        {tasks.map((task, idx) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "group p-5 rounded-2xl border transition-all flex items-center gap-5 cursor-pointer",
              task.completed 
                ? "bg-zinc-50 border-zinc-200 opacity-75" 
                : "bg-white border-zinc-200 hover:border-emerald-300 hover:shadow-md"
            )}
            onClick={() => !task.completed && task.action()}
          >
            <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0", task.color)}>
              <task.icon className="w-7 h-7" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-zinc-900">{task.title}</h4>
                {task.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </div>
              <p className="text-zinc-500 text-sm truncate">{task.subtitle}</p>
            </div>

            <div className="shrink-0">
              {task.completed ? (
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-50 group-hover:border-emerald-200 group-hover:text-emerald-600 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {completedCount === 4 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 bg-emerald-600 rounded-2xl text-center text-white"
        >
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Daily Goal Achieved!</h3>
          <p className="text-emerald-50 opacity-90 mb-6">You've completed all your tasks for today. Your English is getting better every day!</p>
          <button 
            onClick={onBack}
            className="px-8 py-3 bg-white text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition-colors"
          >
            Back to Dashboard
          </button>
        </motion.div>
      )}

      {/* Topic Modal */}
      <AnimatePresence>
        {selectedDailyTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900">{selectedDailyTask.title}</h3>
                    <p className="text-sm text-zinc-500">{selectedDailyTask.subtitle}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDailyTask(null)}
                  className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>

              <div className="p-10 overflow-y-auto flex-1 space-y-8">
                <div className="space-y-6">
                  {plan.topic.content_blocks.map((block, i) => (
                    <div key={i} className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 text-zinc-700 leading-relaxed">
                      {block}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 border-t border-zinc-100 bg-zinc-50 flex justify-end">
                <button
                  onClick={() => {
                    onCompleteTask('topic');
                    setSelectedDailyTask(null);
                  }}
                  className="px-10 py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-500 transition-all shadow-xl shadow-purple-100 flex items-center gap-3"
                >
                  Mark as Completed
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
