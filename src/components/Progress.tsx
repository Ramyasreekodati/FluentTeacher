import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  History,
  Target,
  Award,
  Calendar,
  FileText,
  Sparkles,
  Loader2,
  ChevronRight,
  Trash2,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import Markdown from 'react-markdown';
import { UserProgress } from '../types';
import { generateResponse, SYSTEM_INSTRUCTIONS } from '../services/gemini';

interface ProgressProps {
  progress: UserProgress;
  setProgress: React.Dispatch<React.SetStateAction<UserProgress>>;
  onBack?: () => void;
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default function Progress({ progress, setProgress, onBack }: ProgressProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const stats = [
    { label: 'Completed Sessions', value: progress.completedSessions, icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'Accuracy', value: `${progress.accuracy}%`, icon: Target, color: 'text-blue-600' },
    { label: 'Completion', value: `${progress.completion}%`, icon: TrendingUp, color: 'text-orange-600' },
    { label: 'Current League', value: progress.league, icon: Award, color: 'text-amber-600' },
  ];

  const undoMistake = (id: string) => {
    setProgress(prev => ({
      ...prev,
      mistakes: prev.mistakes.filter(m => m.id !== id)
    }));
  };

  const markAsLearned = (id: string) => {
    setProgress(prev => ({
      ...prev,
      mistakes: prev.mistakes.map(m => 
        m.id === id ? { ...m, status: 'learned' as const } : m
      )
    }));
  };

  const activeMistakes = progress.mistakes.filter(m => m.status !== 'learned');

  const generateReport = async (type: 'weekly' | 'monthly') => {
    setIsGenerating(true);
    const prompt = `
      Generate a ${type} progress report for an English learner.
      
      User Data:
      - Level: ${progress.level}
      - Overall Score: ${progress.overallScore}
      - Component Scores: ${JSON.stringify(progress.componentScores)}
      - Completed Topics: ${progress.completedTopics.length}
      - Recent Mistakes: ${JSON.stringify(progress.mistakes.slice(0, 5))}
      
      The report should include:
      1. Performance Analysis (Strengths and Weaknesses)
      2. Specific areas for improvement.
      3. Recommended focus for the next ${type === 'weekly' ? 'week' : 'month'}.
      4. A motivational closing.
      
      Format: Use clear Markdown with headings.
    `;

    const response = await generateResponse(prompt, SYSTEM_INSTRUCTIONS);
    if (response) {
      setProgress(prev => ({
        ...prev,
        [type === 'weekly' ? 'weeklyEvaluation' : 'monthlyReport']: response
      }));
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-3 hover:bg-zinc-100 rounded-2xl transition-colors"
            >
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>
          )}
          <div>
            <h1 className="font-display text-4xl font-bold text-zinc-900 tracking-tight">Performance Analytics</h1>
            <p className="text-zinc-500 mt-2 text-lg">Track your journey to IELTS excellence</p>
          </div>
        </div>
        <div className="px-8 py-4 bg-zinc-900 text-white rounded-[24px] font-bold flex items-center gap-3 shadow-xl">
          <Award className="w-6 h-6 text-emerald-400" />
          {progress.level} Level
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-6">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-bold text-zinc-900 mt-2">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Skill Proficiency Breakdown */}
      <section className="bg-white p-10 rounded-[40px] border border-zinc-200 shadow-sm">
        <h3 className="font-display text-2xl font-bold mb-10 flex items-center gap-3">
          <Target className="w-7 h-7 text-emerald-600" />
          Skill Proficiency Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {Object.entries(progress.componentScores).map(([skill, score]) => {
            const historyCount = progress.skillHistory[skill as keyof typeof progress.componentScores]?.length || 0;
            const isInitial = historyCount < 3;
            
            return (
              <div key={skill} className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">{skill}</p>
                    <p className={cn("text-2xl font-bold", isInitial ? "text-zinc-300 italic text-lg" : "text-zinc-900")}>
                      {isInitial ? "Initial stage" : `${score}%`}
                    </p>
                  </div>
                  <p className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">
                    {historyCount} / 3 Attempts
                  </p>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isInitial ? 0 : `${score}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      score > 80 ? "bg-emerald-500" : score > 50 ? "bg-blue-500" : "bg-orange-500",
                      isInitial && "bg-zinc-200"
                    )}
                  />
                </div>
                {historyCount > 0 && (
                  <div className="flex gap-1">
                    {progress.skillHistory[skill as keyof typeof progress.componentScores].slice(-5).map((s, idx) => (
                      <div key={idx} className="h-1 flex-1 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-300" style={{ width: `${s}%` }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Evaluation */}
        <section className="bg-white rounded-[40px] border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-display text-xl font-bold">Weekly Evaluation</h3>
            </div>
            {!progress.weeklyEvaluation && (
              <button 
                onClick={() => generateReport('weekly')}
                disabled={isGenerating}
                className="text-xs font-bold text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors flex items-center gap-1"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Generate Now
              </button>
            )}
          </div>
          <div className="p-8 flex-1">
            {progress.weeklyEvaluation ? (
              <div className="markdown-body prose prose-zinc max-w-none">
                <Markdown>{progress.weeklyEvaluation}</Markdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-zinc-300" />
                </div>
                <p className="text-zinc-500 max-w-xs">
                  Your weekly AI evaluation is ready to be generated based on your recent performance.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Monthly Report */}
        <section className="bg-zinc-900 rounded-[40px] text-white overflow-hidden flex flex-col">
          <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-display text-xl font-bold">Monthly Progress Report</h3>
            </div>
            {!progress.monthlyReport && (
              <button 
                onClick={() => generateReport('monthly')}
                disabled={isGenerating}
                className="text-xs font-bold text-emerald-400 uppercase tracking-widest hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                Analyze Month
              </button>
            )}
          </div>
          <div className="p-8 flex-1">
            {progress.monthlyReport ? (
              <div className="markdown-body prose prose-invert max-w-none">
                <Markdown>{progress.monthlyReport}</Markdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                  <Target className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-zinc-400 max-w-xs">
                  Complete a full month of learning to unlock your comprehensive progress analysis.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Mistakes Log */}
      <section className="bg-white rounded-[40px] border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="font-display text-2xl font-bold flex items-center gap-3">
            <History className="w-6 h-6 text-zinc-400" />
            Mistake History
          </h3>
          <span className="px-4 py-1 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-full uppercase tracking-widest">
            {activeMistakes.length} Active
          </span>
        </div>
        
        <div className="divide-y divide-zinc-100">
          {activeMistakes.length > 0 ? (
            activeMistakes.map((mistake, i) => (
              <div key={mistake.id || i} className="p-8 hover:bg-zinc-50 transition-colors group">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-bold">
                      {mistake.rule}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => markAsLearned(mistake.id)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Mark as Learned"
                    >
                      <Check className="w-4 h-4" />
                      Learned
                    </button>
                    <button 
                      onClick={() => undoMistake(mistake.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                      title="Undo Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                      Undo
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2">Original</p>
                      <p className="text-zinc-700 italic text-lg">"{mistake.original}"</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Corrected</p>
                      <p className="text-zinc-900 font-bold text-lg">"{mistake.corrected}"</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Explanation</p>
                      <p className="text-zinc-600 leading-relaxed">{mistake.explanation}</p>
                    </div>
                    {mistake.examples && mistake.examples.length > 0 && (
                      <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Illustrative Examples</p>
                        <ul className="list-disc list-inside space-y-2">
                          {mistake.examples.map((ex, idx) => (
                            <li key={idx} className="text-zinc-600 text-sm italic">"{ex}"</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center text-zinc-400">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-zinc-200" />
              </div>
              <p className="text-lg font-medium">No mistakes recorded yet.</p>
              <p className="text-sm">Keep practicing to build your history!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
