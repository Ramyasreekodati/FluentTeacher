import { motion } from 'motion/react';
import { 
  Flame, 
  Trophy, 
  Target, 
  Zap, 
  ArrowRight,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Brain,
  Mic,
  PenTool,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { UserProgress, View, ComponentScore, AssessmentType } from '../types';

interface DashboardProps {
  progress: UserProgress;
  setView: (view: View) => void;
  onStartAssessment?: (type: AssessmentType) => void;
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default function Dashboard({ progress, setView, onStartAssessment }: DashboardProps) {
  const stats = [
    { label: 'Streak', value: `${progress.streak} Days`, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Accuracy', value: `${progress.accuracy}%`, icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Completion', value: `${progress.completion}%`, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'League', value: progress.league, icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const getLowestSkill = () => {
    const scores = Object.entries(progress.componentScores);
    if (scores.length === 0) return null;
    return scores.reduce((min, curr) => curr[1] < min[1] ? curr : min);
  };

  const lowestSkill = getLowestSkill();

  const recommendations = {
    grammar: { label: 'Grammar Mastery', icon: Brain, color: 'text-blue-600', bg: 'bg-blue-50' },
    vocabulary: { label: 'Vocabulary Bank', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    speaking: { label: 'Speaking Fluency', icon: Mic, color: 'text-orange-600', bg: 'bg-orange-50' },
    reading: { label: 'Reading Comp.', icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
    writing: { label: 'Writing Skills', icon: PenTool, color: 'text-rose-600', bg: 'bg-rose-50' },
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Welcome Section */}
      <section className="relative overflow-hidden rounded-[40px] bg-zinc-900 p-12 text-white shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-8">
            <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full uppercase tracking-widest flex items-center gap-2 border border-emerald-500/30">
              <Sparkles className="w-3 h-3" />
              English Mastery
            </span>
          </div>
          <h1 className="font-display text-6xl font-bold mb-8 tracking-tight leading-[1.1]">
            Master English with <br />
            <span className="text-emerald-400 italic">Structured Precision</span>
          </h1>
          <p className="text-zinc-400 text-xl mb-12 leading-relaxed font-medium">
            Follow our 11-step curriculum designed to take you to IELTS Band 8.0+ with AI-powered feedback.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setView('curriculum')}
              className="px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all flex items-center gap-3 group shadow-xl shadow-emerald-900/40"
            >
              Resume Learning Path
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => setView('assessment')}
              className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/10 backdrop-blur-sm"
            >
              Full Assessment
            </button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/20 blur-[120px] rounded-full -mr-40 -mt-40 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -ml-20 -mb-20"></div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm hover:shadow-xl transition-all"
          >
            <div className={`w-16 h-16 ${stat.bg} rounded-2xl flex items-center justify-center mb-6 shadow-inner`}>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
            <p className="text-4xl font-bold text-zinc-900 mt-2 tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Practice Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 bg-gradient-to-br from-emerald-600 to-emerald-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group cursor-pointer"
          onClick={() => setView('daily_practice')}
        >
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                <CheckCircle2 className="w-8 h-8 text-emerald-300" />
              </div>
              <h3 className="font-display text-3xl font-bold mb-4 tracking-tight">Daily Practice</h3>
              <p className="text-emerald-50 text-lg leading-relaxed mb-8 font-medium">
                Complete your 4 daily tasks: Lesson, AI Topic, Exercise, and Assessment.
              </p>
            </div>
            <div className="flex items-center gap-3 font-bold text-white group-hover:gap-5 transition-all">
              Start Practice
              <ArrowRight className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -mr-20 -mt-20 group-hover:bg-white/10 transition-colors"></div>
        </motion.div>

        {/* AI Engine Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 bg-gradient-to-br from-indigo-800 to-indigo-950 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group cursor-pointer"
          onClick={() => setView('ai_engine')}
        >
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                <Zap className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="font-display text-3xl font-bold mb-4 tracking-tight">AI Learning Engine</h3>
              <p className="text-zinc-400 text-lg leading-relaxed mb-8 font-medium">
                Transform any raw resource or notes into a structured learning module.
              </p>
            </div>
            <div className="flex items-center gap-3 font-bold text-white group-hover:gap-5 transition-all">
              Launch Engine
              <ArrowRight className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full -mr-20 -mt-20 group-hover:bg-indigo-500/10 transition-colors"></div>
        </motion.div>

        {/* Topic of the Day Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 bg-gradient-to-br from-zinc-800 to-zinc-950 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group cursor-pointer"
          onClick={() => setView('topic_of_the_day')}
        >
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                <Sparkles className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="font-display text-3xl font-bold mb-4 tracking-tight">Topic of the Day</h3>
              <p className="text-zinc-400 text-lg leading-relaxed mb-8 font-medium">
                Custom English learning unit based on any theme you choose.
              </p>
            </div>
            <div className="flex items-center gap-3 font-bold text-white group-hover:gap-5 transition-all">
              Try it now
              <ArrowRight className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -mr-20 -mt-20 group-hover:bg-emerald-500/10 transition-colors"></div>
        </motion.div>

        {/* Fluency Assessment Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 bg-gradient-to-br from-amber-500 to-orange-600 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group cursor-pointer"
          onClick={() => onStartAssessment?.('fluency')}
        >
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display text-3xl font-bold mb-4 tracking-tight">Fluency Test</h3>
              <p className="text-amber-50 text-lg leading-relaxed mb-8 font-medium">
                Get a detailed 1-10 score on your grammar, speaking, and vocabulary.
              </p>
            </div>
            <div className="flex items-center gap-3 font-bold text-white group-hover:gap-5 transition-all">
              Start Assessment
              <ArrowRight className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20 group-hover:bg-white/20 transition-colors"></div>
        </motion.div>

        {/* Performance Overview */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-display text-2xl font-bold flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-emerald-600" />
              Skill Proficiency
            </h3>
            <button 
              onClick={() => setView('progress')}
              className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View Detailed Report
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {Object.entries(progress.componentScores).map(([skill, score]) => {
              const historyCount = progress.skillHistory[skill as keyof ComponentScore]?.length || 0;
              const isInitial = historyCount < 3;
              
              return (
                <div key={skill} className="space-y-3">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-zinc-400">{skill}</span>
                    <span className={cn("text-zinc-900", isInitial && "text-zinc-400 italic")}>
                      {isInitial ? "Initial stage" : `${score}%`}
                    </span>
                  </div>
                  <div className="h-3 bg-zinc-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: isInitial ? 0 : `${score}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        score > 80 ? "bg-emerald-500" : score > 50 ? "bg-blue-500" : "bg-orange-500",
                        isInitial && "bg-zinc-200"
                      )}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    {historyCount} / 3 attempts for proficiency
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommended Practice */}
        <div className="space-y-6">
          <div className="bg-zinc-900 p-10 rounded-[40px] text-white flex flex-col justify-between h-full shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-display text-2xl font-bold mb-4">Weekly Evaluation</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                {progress.weeklyEvaluation ? 
                  progress.weeklyEvaluation.substring(0, 150) + "..." : 
                  "Complete more topics to unlock your personalized AI performance analysis."
                }
              </p>
              <button 
                onClick={() => setView('progress')}
                className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border border-white/5"
              >
                Full Report
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-colors"></div>
          </div>

          {lowestSkill && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-[40px] border border-zinc-200 shadow-sm"
            >
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Recommended Practice</h4>
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 ${recommendations[lowestSkill[0] as keyof typeof recommendations].bg} rounded-2xl flex items-center justify-center`}>
                  {(() => {
                    const Icon = recommendations[lowestSkill[0] as keyof typeof recommendations].icon;
                    return <Icon className={`w-7 h-7 ${recommendations[lowestSkill[0] as keyof typeof recommendations].color}`} />;
                  })()}
                </div>
                <div>
                  <p className="font-bold text-zinc-900">{recommendations[lowestSkill[0] as keyof typeof recommendations].label}</p>
                  <p className="text-xs text-zinc-500">Focus on your weakest area</p>
                </div>
              </div>
              <button 
                onClick={() => setView('assessment')}
                className="w-full py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                Start Practice
                <Zap className="w-4 h-4 text-amber-500" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
