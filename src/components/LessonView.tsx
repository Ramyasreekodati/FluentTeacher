import { useState, useEffect, useRef } from 'react';
import { 
  Loader2, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2,
  ChevronRight,
  Mic2,
  Square,
  Volume2,
  PenTool,
  BookOpen,
  Zap,
  Trophy,
  AlertCircle,
  Play,
  Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { UserProgress, Topic, LessonStep, ComponentScore } from '../types';
import { generateResponse, generateSpeech, SYSTEM_INSTRUCTIONS } from '../services/gemini';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

interface LessonViewProps {
  topic: Topic;
  progress: UserProgress;
  stepIndex: number;
  onStepComplete: (index: number) => void;
  onComplete: (scores: ComponentScore, accuracy: number) => void;
  onBack: () => void;
}

const STEPS: LessonStep[] = [
  'warmup', 'micro_learning', 'memory_reinforcement', 
  'active_recall', 'quick_challenge', 'speak_think'
];

interface Exercise {
  type: 'mcq' | 'fill' | 'reorder';
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

export default function LessonView({ topic, progress, stepIndex, onStepComplete, onComplete, onBack }: LessonViewProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(stepIndex);
  const [stepContent, setStepContent] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userResponse, setUserResponse] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionAccuracy, setSessionAccuracy] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isRecording, startRecording, stopRecording, audioBlob, setAudioBlob } = useVoiceRecorder();

  const currentStep = STEPS[currentStepIndex];

  useEffect(() => {
    setCurrentStepIndex(stepIndex);
  }, [stepIndex]);

  useEffect(() => {
    fetchStepContent();
  }, [currentStepIndex]);

  const fetchStepContent = async () => {
    setIsLoading(true);
    setFeedback(null);
    setUserResponse('');
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setExercises([]);
    setUserAnswers({});
    setShowResults(false);

    const prompt = `
      Topic: "${topic.title}"
      Level: ${topic.level}
      Current Step: ${currentStep.replace('_', ' ')}
      
      Instructions:
      Generate the content for this specific step of the lesson following the MANDATORY LESSON STRUCTURE and TEACHING PRINCIPLES.
      
      - If it's "micro_learning", teach 5 vocabulary words, 2 idioms, and 1 pattern.
      - If it's "active_recall", ask 3 questions WITHOUT showing answers initially. Include the JSON exercises block.
      - If it's "quick_challenge", include 3 fill-in-the-blanks and 1 real-life question. Include the JSON exercises block.
      - If it's "speak_think", provide a prompt for the user to say 2 sentences about their life.
      
      CRITICAL: 
      - Use VERY simple English.
      - DO NOT overload. 
      - DO NOT give long explanations.
      - DO NOT include any "Step X" headers.
    `;

    const response = await generateResponse(prompt, SYSTEM_INSTRUCTIONS);
    
    if (response) {
      // Extract JSON if present
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          if (data.exercises) setExercises(data.exercises);
        } catch (e) {
          console.error("Failed to parse exercises JSON", e);
        }
      }
      
      // Remove JSON block from display content
      const cleanContent = response.replace(/```json\s*[\s\S]*?\s*```/, '').trim();
      setStepContent(cleanContent);

      // If it's micro_learning, we could generate audio for the vocab, but let's keep it simple for now
    } else {
      setStepContent("Failed to load content.");
    }
    
    setIsLoading(false);
  };

  const handleAnswer = (index: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [index]: answer }));
  };

  const checkExercises = () => {
    setShowResults(true);
    const correctCount = exercises.filter((ex, i) => {
      const userAns = (userAnswers[i] || "").trim().toLowerCase();
      const correctAns = ex.answer.trim().toLowerCase();
      return userAns === correctAns;
    }).length;
    
    const score = Math.round((correctCount / exercises.length) * 100);
    setSessionAccuracy(prev => [...prev, score]);
    setFeedback(`### Exercise Results\nYou got **${correctCount} out of ${exercises.length}** correct! (${score}%)\n\nReview the explanations below to understand your mistakes.`);
  };

  const renderExercises = () => {
    if (exercises.length === 0) return null;

    return (
      <div className="space-y-10 mt-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900">Interactive Practice</h3>
        </div>
        {exercises.map((ex, i) => (
          <div key={i} className="p-8 bg-zinc-50 rounded-[32px] border border-zinc-200 space-y-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                {i + 1}
              </span>
              <p className="text-lg font-medium text-zinc-800 pt-0.5">{ex.question}</p>
            </div>

            {ex.type === 'mcq' && ex.options && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-12">
                {ex.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(i, opt)}
                    disabled={showResults}
                    className={cn(
                      "p-5 rounded-2xl border-2 text-left transition-all font-medium",
                      userAnswers[i] === opt 
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-md" 
                        : "bg-white border-zinc-100 hover:border-zinc-300 text-zinc-600",
                      showResults && opt === ex.answer && "bg-emerald-50 border-emerald-500 text-emerald-700",
                      showResults && userAnswers[i] === opt && opt !== ex.answer && "bg-rose-50 border-rose-500 text-rose-700"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {ex.type === 'fill' && (
              <div className="ml-12">
                <input
                  type="text"
                  value={userAnswers[i] || ''}
                  onChange={(e) => handleAnswer(i, e.target.value)}
                  disabled={showResults}
                  placeholder="Type your answer..."
                  className={cn(
                    "w-full p-5 bg-white border-2 rounded-2xl outline-none transition-all text-lg font-medium",
                    showResults 
                      ? (userAnswers[i]?.toLowerCase() === ex.answer.toLowerCase() ? "border-emerald-500 bg-emerald-50" : "border-rose-500 bg-rose-50")
                      : "border-zinc-100 focus:border-emerald-500"
                  )}
                />
              </div>
            )}

            {showResults && (
              <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="ml-12 p-5 bg-white rounded-2xl border border-zinc-100 text-sm"
            >
              <p className="font-bold text-zinc-900 mb-1">
                {userAnswers[i]?.toLowerCase() === ex.answer.toLowerCase() ? "✅ Correct!" : `❌ Incorrect. The answer is: ${ex.answer}`}
              </p>
              <p className="text-zinc-500 leading-relaxed">{ex.explanation}</p>
            </motion.div>
          )}
        </div>
      ))}
      {!showResults && (
        <button
          onClick={checkExercises}
          className="w-full py-5 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all shadow-xl"
        >
          Check Answers
        </button>
      )}
    </div>
  );
};

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      onStepComplete(currentStepIndex + 1);
    } else {
    // Final Assessment Complete
    const avgAccuracy = sessionAccuracy.length > 0 
      ? sessionAccuracy.reduce((a, b) => a + b, 0) / sessionAccuracy.length 
      : 85; // Default if no exercises

    onComplete({
      grammar: 85,
      vocabulary: 90,
      speaking: 75,
      writing: 80,
      reading: 95
    }, avgAccuracy);
  }
};

  const handleEvaluate = async () => {
    if (!userResponse.trim() && !audioBlob && Object.keys(userAnswers).length === 0) return;
    setIsEvaluating(true);

    const interactiveResults = exercises.length > 0 ? exercises.map((ex, i) => ({
      question: ex.question,
      userAnswer: userAnswers[i] || "Not answered",
      correctAnswer: ex.answer,
      isCorrect: (userAnswers[i] || "").trim().toLowerCase() === ex.answer.trim().toLowerCase()
    })) : null;

    const prompt = `
      Topic: "${topic.title}"
      Level: ${topic.level}
      Step: ${currentStep.replace('_', ' ')}
      
      User Response (Text): "${userResponse}"
      ${audioBlob ? "[User provided a voice recording]" : ""}
      
      ${interactiveResults ? `Interactive Practice Results: ${JSON.stringify(interactiveResults, null, 2)}` : ""}
      
      Task:
      1. Evaluate the user's overall performance in this step following the TEACHING PRINCIPLES.
      2. Analyze their English usage (simple, correct, natural).
      3. If it's "speak_think", provide a detailed analysis of their pronunciation and fluency.
      4. Provide specific corrections for any mistakes.
      5. Give a score out of 100.
      
      Format your response with:
      - A clear breakdown of strengths and areas for improvement.
      - Specific corrections.
      - A final score at the end: SCORE_SUMMARY: [score]
    `;

    const response = await generateResponse(prompt, SYSTEM_INSTRUCTIONS);
    setFeedback(response || "Evaluation failed.");
    if (exercises.length > 0) setShowResults(true);
    setIsEvaluating(false);
  };

  const toggleAudio = async () => {
    if (!audioRef.current) return;
    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.warn("Audio playback failed:", error);
      setIsPlaying(false);
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
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Topic</p>
          <h2 className="font-bold text-zinc-900">{topic.title}</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
          Step {currentStepIndex + 1}/{STEPS.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
          className="h-full bg-emerald-500"
        />
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-[40px] border border-zinc-200 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-10 flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-emerald-400 animate-pulse" />
              </div>
              <p className="text-zinc-500 font-bold text-xl animate-pulse">Crafting your {currentStep.replace('_', ' ')}...</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="markdown-body prose prose-zinc max-w-none">
                <Markdown>{stepContent}</Markdown>
              </div>

              {renderExercises()}
            </motion.div>
          )}

          {/* Interaction Section */}
          {!isLoading && (
            <div className="mt-12 space-y-8 pt-10 border-t border-zinc-100">
              {currentStep === 'speak_think' ? (
                <div className="flex flex-col items-center space-y-6">
                  <div className="text-center">
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Voice Assessment</p>
                    <p className="text-zinc-600">Record your response to the prompt above.</p>
                  </div>
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    className={cn(
                      "w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl",
                      isRecording ? "bg-red-500 animate-pulse scale-110" : "bg-emerald-600 hover:bg-emerald-500"
                    )}
                  >
                    {isRecording ? <Square className="w-10 h-10 text-white" /> : <Mic2 className="w-10 h-10 text-white" />}
                  </button>
                  {audioBlob && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-full font-bold flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Recording Ready for Evaluation
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Your Response</p>
                    <span className="text-[10px] text-zinc-400 font-medium">AI will evaluate your coherence and grammar</span>
                  </div>
                  <textarea
                    value={userResponse}
                    onChange={(e) => setUserResponse(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full h-40 p-6 bg-zinc-50 border border-zinc-200 rounded-[24px] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-lg shadow-inner"
                  />
                </div>
              )}

              <div className="flex justify-between items-center gap-4">
                <button
                  onClick={handleEvaluate}
                  disabled={isEvaluating || (!userResponse.trim() && !audioBlob)}
                  className="px-8 py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 disabled:opacity-50 transition-all flex items-center gap-3 shadow-xl"
                >
                  {isEvaluating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-emerald-400" />}
                  Analyze & Score
                </button>
                <button
                  onClick={handleNext}
                  className="px-10 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all flex items-center gap-3 shadow-xl shadow-emerald-100"
                >
                  {currentStepIndex === STEPS.length - 1 ? "Complete Topic" : "Next Step"}
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Panel */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-zinc-900 text-white p-10 border-t border-white/10"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3 text-emerald-400">
                  <Zap className="w-6 h-6" />
                  <h3 className="font-display text-2xl font-bold">AI Performance Analysis</h3>
                </div>
                <button 
                  onClick={() => setFeedback(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 rotate-90" />
                </button>
              </div>
              <div className="markdown-body text-zinc-300 prose-invert max-w-none">
                <Markdown>{feedback}</Markdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
