import { motion } from 'motion/react';
import { 
  Lock, 
  Play, 
  CheckCircle2, 
  ChevronRight,
  BookOpen,
  Star,
  Trophy
} from 'lucide-react';
import { LanguageLevel, Topic, UserProgress } from '../types';
import { CURRICULUM } from '../data/curriculum';

interface CurriculumProps {
  progress: UserProgress;
  onSelectTopic: (topic: Topic) => void;
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default function Curriculum({ progress, onSelectTopic }: CurriculumProps) {
  return (
    <div className="space-y-12 pb-20">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-zinc-900">Learning Path</h1>
        <p className="text-zinc-500 mt-3 text-lg">Master English with our expanded, high-performance curriculum.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CURRICULUM.map((topic) => {
          const isCompleted = progress.completedTopics.includes(topic.id);
          const isUnlocked = !topic.isLocked || isCompleted;

          return (
            <motion.div
              key={topic.id}
              whileHover={isUnlocked ? { y: -5 } : {}}
              className={cn(
                "relative group rounded-[32px] border p-8 transition-all",
                isUnlocked 
                  ? "bg-white border-zinc-200 shadow-sm hover:shadow-xl hover:border-emerald-300 cursor-pointer" 
                  : "bg-zinc-100 border-zinc-200 opacity-60 cursor-not-allowed",
                topic.isMonthly && "border-2 border-amber-200 bg-amber-50/30",
                topic.isTest && !topic.isMonthly && "border-2 border-blue-200 bg-blue-50/30"
              )}
              onClick={() => isUnlocked && onSelectTopic(topic)}
            >
              <div className="flex items-start justify-between mb-6">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner",
                  isUnlocked ? (topic.isTest ? "bg-blue-100 text-blue-600" : "bg-emerald-50 text-emerald-600") : "bg-zinc-200 text-zinc-400"
                )}>
                  {isCompleted ? <CheckCircle2 className="w-7 h-7" /> : (
                    topic.isMonthly ? <Trophy className="w-7 h-7" /> : 
                    topic.isTest ? <Star className="w-7 h-7" /> : 
                    <BookOpen className="w-7 h-7" />
                  )}
                </div>
                {!isUnlocked && <Lock className="w-5 h-5 text-zinc-400" />}
                {isCompleted && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {topic.isMonthly && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-widest">Monthly</span>}
                  {topic.isTest && !topic.isMonthly && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-widest">Weekly</span>}
                </div>
                <h3 className="font-bold text-xl text-zinc-900">{topic.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{topic.description}</p>
              </div>

              {isUnlocked && (
                <div className={cn(
                  "mt-8 flex items-center font-bold text-sm group-hover:gap-2 transition-all",
                  topic.isTest ? "text-blue-600" : "text-emerald-600"
                )}>
                  {isCompleted ? "Review" : (topic.isTest ? "Start Test" : "Start Lesson")}
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
