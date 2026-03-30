import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book, 
  ChevronRight, 
  HelpCircle, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  Zap, 
  Mic, 
  Volume2, 
  Play, 
  Pause, 
  RotateCcw,
  AlertCircle,
  XCircle,
  Info
} from 'lucide-react';
import Markdown from 'react-markdown';
import { generateResponse } from '../services/gemini';
import { EXERCISES } from '../data/exercises';
import { Exercise, Question } from '../types';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

interface ExerciseViewProps {
  onBack: () => void;
  exerciseIndex: number;
  onComplete: () => void;
}

const ExerciseView: React.FC<ExerciseViewProps> = ({ onBack, exerciseIndex, onComplete }) => {
  const [exercise, setExercise] = useState<Exercise>(EXERCISES[exerciseIndex] || EXERCISES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tutorFeedback, setTutorFeedback] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const currentExercise = EXERCISES[exerciseIndex] || EXERCISES[0];
    setExercise(currentExercise);
    setAnswers({});
    setShowFeedback(false);
    setResults({});
    setScore(0);
    setIsPlaying(false);
    setTutorFeedback(null);
    setAudioProgress(0);
  }, [exerciseIndex]);

  const handleInputChange = (questionId: string, value: string) => {
    if (showFeedback) return;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const normalizeAnswer = (str: string) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") // Remove punctuation
      .replace(/\s{2,}/g, " "); // Remove extra spaces
  };

  const validateAnswers = async () => {
    const newResults: Record<string, boolean> = {};
    let correctCount = 0;

    exercise.questions.forEach(q => {
      const userAnswer = normalizeAnswer(answers[q.id] || '');
      const correctAnswer = normalizeAnswer(q.correctAnswer);
      
      const isCorrect = userAnswer === correctAnswer;
      newResults[q.id] = isCorrect;
      if (isCorrect) correctCount++;
    });

    setResults(newResults);
    setScore(correctCount);
    setShowFeedback(true);
    
    // Generate AI Tutor Feedback
    setIsEvaluating(true);
    try {
      const prompt = `
        You are an IELTS Tutor. The student just finished an exercise.
        Exercise: ${exercise.title}
        Skill: ${exercise.skill}
        Score: ${correctCount} / ${exercise.questions.length}
        
        Questions and Answers:
        ${exercise.questions.map(q => `
          Q: ${q.text}
          Student Answer: ${answers[q.id] || '(No answer)'}
          Correct Answer: ${q.correctAnswer}
          Result: ${newResults[q.id] ? 'Correct' : 'Incorrect'}
        `).join('\n')}
        
        Task: Provide a short (2-3 sentences), encouraging, and constructive feedback summary. 
        Highlight what they did well or what they should focus on next.
      `;
      const feedback = await generateResponse(prompt, "You are a supportive IELTS tutor.");
      setTutorFeedback(feedback);
    } catch (err) {
      console.error("Failed to generate tutor feedback", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handlePlayAudio = () => {
    if (exercise.audioUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      // Fallback to TTS
      const utterance = new SpeechSynthesisUtterance(exercise.content || exercise.title);
      utterance.rate = 0.9;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
    }
  };

  const getSkillColor = (skill: string) => {
    switch (skill) {
      case 'Listening': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Reading': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Writing': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Grammar': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Vocabulary': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-zinc-50 text-zinc-700 border-zinc-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-zinc-500" />
        </button>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border", getSkillColor(exercise.skill))}>
              {exercise.skill}
            </span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Exercise {exerciseIndex + 1} / {EXERCISES.length}
            </span>
          </div>
          <h2 className="font-bold text-zinc-900">{exercise.title}</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-50 text-zinc-600 rounded-full text-xs font-bold border border-zinc-200">
          <Zap className="w-3 h-3 text-amber-500" />
          {exercise.subSkill}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-[40px] border border-zinc-200 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-10 flex-1 space-y-10">
          {/* Exercise Content / Audio */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-800">Instructions</h3>
              {(exercise.skill === 'Listening' || !exercise.audioUrl) && (
                <div className="flex items-center gap-4">
                  {exercise.audioUrl && (
                    <div className="hidden sm:flex items-center gap-3 bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-100 min-w-[200px]">
                      <div className="flex-1 h-1 bg-zinc-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300" 
                          style={{ width: `${audioProgress}%` }}
                        />
                      </div>
                      <Volume2 className="w-4 h-4 text-zinc-400" />
                    </div>
                  )}
                  <button 
                    onClick={handlePlayAudio}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-sm",
                      isPlaying ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100"
                    )}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? "Stop" : (exercise.audioUrl ? "Play Audio" : "Read Aloud")}
                  </button>
                </div>
              )}
            </div>
            
            {exercise.audioUrl && (
              <audio 
                ref={audioRef} 
                src={exercise.audioUrl} 
                onEnded={() => {
                  setIsPlaying(false);
                  setAudioProgress(0);
                }}
                onTimeUpdate={handleTimeUpdate}
                className="hidden"
              />
            )}

            <div className="p-8 bg-zinc-50 rounded-[32px] border border-zinc-100 italic text-zinc-600 leading-relaxed text-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20" />
              <Markdown>{exercise.content}</Markdown>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-zinc-800">Questions</h3>
                <div className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-md text-[10px] font-bold uppercase">
                  {Object.keys(answers).length} / {exercise.questions.length} Answered
                </div>
              </div>
              {showFeedback && (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 text-white rounded-full text-sm font-bold shadow-lg">
                  Score: {score} / {exercise.questions.length}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(Object.keys(answers).length / exercise.questions.length) * 100}%` }}
                className="h-full bg-blue-500"
              />
            </div>

            <div className="space-y-6">
              {exercise.questions.map((q, idx) => (
                <div key={q.id} className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <p className="text-zinc-700 font-medium">{q.text}</p>
                      <div className="relative">
                        <input
                          type="text"
                          value={answers[q.id] || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                          disabled={showFeedback}
                          placeholder="Your answer..."
                          className={cn(
                            "w-full px-6 py-4 rounded-2xl border transition-all outline-none font-medium",
                            showFeedback 
                              ? (results[q.id] 
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                                  : "bg-rose-50 border-rose-200 text-rose-700")
                              : "bg-white border-zinc-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                          )}
                        />
                        {showFeedback && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            {results[q.id] ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            ) : (
                              <XCircle className="w-6 h-6 text-rose-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {showFeedback && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={cn(
                        "p-4 rounded-2xl text-sm space-y-2",
                        results[q.id] ? "bg-emerald-50/50" : "bg-rose-50/50"
                      )}
                    >
                      {!results[q.id] && (
                        <p className="font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Correct: <span className="text-emerald-700">{q.correctAnswer}</span>
                        </p>
                      )}
                      {q.explanation && (
                        <p className="text-zinc-600 flex items-start gap-2">
                          <Info className="w-4 h-4 mt-0.5 text-zinc-400" />
                          {q.explanation}
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-10 border-t border-zinc-100 space-y-8">
            {showFeedback && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50/50 border border-blue-100 rounded-[32px] p-8 space-y-4"
              >
                <div className="flex items-center gap-3 text-blue-700 font-bold">
                  <Sparkles className="w-5 h-5" />
                  AI Tutor's Summary
                </div>
                {isEvaluating ? (
                  <div className="flex items-center gap-3 text-zinc-400 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing your performance...
                  </div>
                ) : (
                  <p className="text-zinc-700 leading-relaxed">
                    {tutorFeedback || "Great effort! Review the correct answers above to understand any mistakes."}
                  </p>
                )}
              </motion.div>
            )}

            <div className="flex justify-center">
              {!showFeedback ? (
                <button
                  onClick={validateAnswers}
                  disabled={Object.keys(answers).length < exercise.questions.length}
                  className="px-12 py-5 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 disabled:opacity-50 transition-all flex items-center gap-3 shadow-xl"
                >
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  Check My Answers
                </button>
              ) : (
                <button
                  onClick={onComplete}
                  className="px-12 py-5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all flex items-center gap-3 shadow-xl shadow-blue-100"
                >
                  Next Exercise
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseView;
