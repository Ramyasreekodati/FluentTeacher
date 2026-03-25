import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, ChevronRight, HelpCircle, CheckCircle2, ArrowLeft, Loader2, Sparkles, Zap, Mic } from 'lucide-react';
import Markdown from 'react-markdown';
import { generateResponse } from '../services/gemini';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

const IELTS_SYSTEM_PROMPT = `
You are an IELTS trainer using the book: "202 Useful Exercises for IELTS".
Your goal is NOT to explain everything.
Your goal is to train the user to answer correctly by thinking first.

### 🔴 STRICT RULE: DO NOT SKIP ANY CONTENT
* Use the book exactly.
* Do not remove or simplify questions.
* Keep original structure (fill blanks, MCQs, True/False, etc.).

### 🧠 LEARNING METHOD
Follow this sequence strictly:

1. SHOW ORIGINAL EXERCISE
* Present questions exactly like in the book.
* End with: "Try to answer. Tell me when you are ready."

2. FORCE THINKING (ACTIVE RECALL)
* Ask the user to answer first.
* Do NOT show answers immediately.

3. HINT MODE (IF NEEDED)
* If user asks for help, give small hints only.
* Do NOT reveal answers.

4. SHOW CORRECT ANSWERS
* After user attempts.
* Provide correct answers clearly.

5. EXPLAIN WHY
* Explain why correct and why wrong.

6. MEMORY REINFORCEMENT
* Repeat key points.
* Give 1–2 similar examples.

7. MICRO REVISION
* Ask 2–3 quick questions again.

### 🔁 CONTINUITY RULE (IMPORTANT)
* Maintain current progress in the book.
* When the user says "next", move to the next exercise/topic in order (1.1 -> 1.2 -> 1.3 ... -> Part 2 -> etc.).
* Do NOT repeat previous content.
* Do NOT ask what to do next.
* Continue sequentially exactly as in the book.
`;

interface ExerciseViewProps {
  onBack: () => void;
}

const ExerciseView: React.FC<ExerciseViewProps> = ({ onBack }) => {
  const [currentExercise, setCurrentExercise] = useState('1.1');
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userResponse, setUserResponse] = useState('');
  const [phase, setPhase] = useState<'exercise' | 'evaluation'>('exercise');

  useEffect(() => {
    fetchExercise();
  }, [currentExercise]);

  const fetchExercise = async () => {
    setIsLoading(true);
    setPhase('exercise');
    setUserResponse('');
    
    const prompt = `
      Book: "202 Useful Exercises for IELTS"
      Current Exercise: ${currentExercise}
      
      Task: Provide the full text and questions for this exercise exactly as it appears in the book.
      Follow the "SHOW ORIGINAL EXERCISE" and "FORCE THINKING" rules.
      End with: "Try to answer. Tell me when you are ready."
    `;

    const response = await generateResponse(prompt, IELTS_SYSTEM_PROMPT);
    setContent(response || "Failed to load exercise.");
    setIsLoading(false);
  };

  const handleEvaluate = async () => {
    if (!userResponse.trim()) return;
    setIsLoading(true);
    
    const prompt = `
      Exercise: ${currentExercise}
      User's Answer: "${userResponse}"
      
      Task: 
      1. Provide the correct answers.
      2. Explain why they are correct/wrong.
      3. Provide Memory Reinforcement (key points + examples).
      4. Provide Micro Revision (2-3 quick questions).
    `;

    const response = await generateResponse(prompt, IELTS_SYSTEM_PROMPT);
    setContent(response || "Evaluation failed.");
    setPhase('evaluation');
    setIsLoading(false);
  };

  const handleNext = () => {
    const parts = currentExercise.split('.');
    const major = parseInt(parts[0]);
    const minor = parseInt(parts[1]);
    const nextMinor = minor + 1;
    setCurrentExercise(`${major}.${nextMinor}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-zinc-500" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Exercise</p>
          <h2 className="font-bold text-zinc-900">IELTS {currentExercise}</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-widest">
          <Book className="w-3 h-3" />
          202 Exercises
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-[40px] border border-zinc-200 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-10 flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-6">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
              <p className="text-zinc-500 font-bold text-xl animate-pulse">Loading Exercise {currentExercise}...</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="markdown-body prose prose-zinc max-w-none">
                <Markdown>{content}</Markdown>
              </div>

              {phase === 'exercise' && (
                <div className="mt-12 space-y-6 pt-10 border-t border-zinc-100">
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Your Answers</p>
                    <textarea
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      placeholder="Type your answers here (e.g., a. Edinburgh, b. Scotland...)"
                      className="w-full h-40 p-6 bg-zinc-50 border border-zinc-200 rounded-[24px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-lg shadow-inner"
                    />
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={handleEvaluate}
                      disabled={!userResponse.trim()}
                      className="px-12 py-5 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 disabled:opacity-50 transition-all flex items-center gap-3 shadow-xl"
                    >
                      <Sparkles className="w-5 h-5 text-blue-400" />
                      Check My Answers
                    </button>
                  </div>
                </div>
              )}

              {phase === 'evaluation' && (
                <div className="mt-12 flex justify-center pt-10 border-t border-zinc-100">
                  <button
                    onClick={handleNext}
                    className="px-12 py-5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 transition-all flex items-center gap-3 shadow-xl shadow-blue-100"
                  >
                    Next Exercise
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseView;
