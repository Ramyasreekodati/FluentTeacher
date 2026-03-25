import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Mic,
  PenTool,
  Brain,
  MessageSquare,
  Trophy,
  ArrowLeft,
  Zap,
  Square,
  History as HistoryIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { UserProgress, ComponentScore } from '../types';
import { generateResponse, SYSTEM_INSTRUCTIONS } from '../services/gemini';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

interface AssessmentProps {
  progress: UserProgress;
  type?: AssessmentType;
  onComplete: (scores: ComponentScore) => void;
  onExit?: () => void;
  onLockChange?: (isLocked: boolean) => void;
}

type AssessmentType = 'grammar' | 'vocabulary' | 'speaking' | 'reading' | 'writing' | 'grand' | 'weekly' | 'monthly' | null;

const GRAMMAR_SUBTOPICS = [
  "Determiners", "Articles", "Parts of Speech", "Nouns", "Pronouns", "Adjectives", 
  "Degrees of Comparison", "Verbs", "Tenses", "Auxiliaries", "Same word as a Noun and a Verb", 
  "Adverbs", "Prepositions", "Conjunctions", "Punctuation", "Subject and Predicate", 
  "Subject Verb Agreement", "Complements", "Clauses", "Simple, Complex and Compound Sentences", 
  "Kinds of Sentences", "Question Formation", "Question Tags", "Direct and Indirect Speech", 
  "Active and Passive Voice", "Rhyme, Rhythm and Rhyme Scheme", "Figures of Speech"
];

const VOCABULARY_SUBTOPICS = [
  "Synonyms and Antonyms", "Homographs and Homophones", "Prefixes and Suffixes", 
  "Word Chain", "Word Register", "Hidden Words", "Alphabetical Order", 
  "Word Formation", "Word Building", "Compound Words", "Collocations", "Phrases"
];

const READING_SUBTOPICS = [
  "Reading Comprehension", "Reading Fluency Evaluation"
];

interface Exercise {
  type: 'mcq' | 'fill' | 'reorder';
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default function Assessment({ progress, type, onComplete, onExit, onLockChange }: AssessmentProps) {
  const [activeCategory, setActiveCategory] = useState<AssessmentType>(null);
  const [selectedSubTopic, setSelectedSubTopic] = useState<string | null>(null);
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(type || null);
  const [isLoading, setIsLoading] = useState(false);
  const [testContent, setTestContent] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [userResponse, setUserResponse] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { isRecording, startRecording, stopRecording, audioBlob, setAudioBlob } = useVoiceRecorder();

  const [isQuickPractice, setIsQuickPractice] = useState(false);

  useEffect(() => {
    if (type) {
      startAssessment(type);
    }
  }, [type]);

  const startAssessment = async (type: AssessmentType, subTopic: string | null = null, quick: boolean = false) => {
    setAssessmentType(type);
    setSelectedSubTopic(subTopic);
    setIsQuickPractice(quick);
    setIsLoading(true);
    setFeedback(null);
    setUserResponse('');
    setAudioBlob(null);
    setExercises([]);
    setUserAnswers({});
    setShowResults(false);
    onLockChange?.(true);
    setIsSubmitted(false);

    let prompt = '';
    
    if (quick && type === 'grammar') {
      prompt = `
        Level: ${progress.level}
        Focus: Grammar Quick Practice
        ${subTopic ? `Topic: ${subTopic}` : ''}
        
        Instructions:
        Use the "High School English Grammar & Composition" (Wren & Martin) as a reference.
        Generate 2-3 quick practice questions (fill blanks, sentence formation, parts of speech, error correction, or rearranging).
        Focus on sentence structure, tenses, or word forms.
        Keep it simple, clear, and relevant to IELTS patterns.
        Include a JSON block with these exercises at the end.
        
        CRITICAL: 
        - Ask the user to answer first. 
        - DO NOT give long explanations.
        - DO NOT teach like a textbook.
        - Focus on Practice -> Attempt -> Correction.
      `;
    } else if (type === 'weekly') {
      prompt = `
        Level: ${progress.level}
        Test Type: Weekly Test
        
        Instructions:
        Generate a mixed test covering topics from the last 5-7 lessons.
        Include:
        - Vocabulary (3 questions)
        - Grammar (fill in blanks, sentence correction) (5 questions)
        - Speaking prompt (1 question)
        
        Keep it short (10-15 questions total).
        Include a JSON block with 10 interactive exercises (mcq or fill) at the end.
      `;
    } else if (type === 'monthly') {
      prompt = `
        Level: ${progress.level}
        Test Type: Monthly Test
        
        Instructions:
        Generate a full test covering:
        - Reading (1 passage + 5 questions)
        - Writing (1 prompt)
        - Grammar (10 questions)
        - Speaking (1 prompt)
        
        Include a JSON block with 15 interactive exercises (mcq or fill) at the end.
      `;
    } else if (type === 'writing') {
      prompt = `
        Level: C1 (Advanced)
        Goal: IELTS Writing Coach - Task Generation
        
        ---
        ### 🎯 TASK
        Your goal is to provide a high-quality IELTS Writing task (either Task 1 or Task 2).
        
        ---
        ### 📚 CONTENT GENERATION
        * Generate a clear writing prompt (e.g., an essay topic for Task 2 or a data description for Task 1).
        * Provide specific instructions (e.g., "Write at least 250 words").
        * Explain that the user's response will be evaluated based on Task Response, Coherence, Vocabulary, and Grammar.
        
        ---
        ### ⚠️ RULES
        * Focus on C1-level complexity.
        * Do NOT provide any interactive exercises (JSON).
        * Keep instructions concise.
      `;
    } else if (type === 'speaking') {
      prompt = `
        Level: C1 (Advanced)
        Goal: Speaking Fluency Assessment
        
        Instructions:
        1. Give the user a real-life, complex topic to talk about (e.g., global economy, ethical implications of AI, sustainable architecture, the future of education).
        2. Ask the user to speak for 1-2 minutes.
        3. Explain that you will analyze their grammar, vocabulary, sentence structure, and fluency.
        4. Encourage them to express ideas clearly and confidently.
        5. Train thinking speed by asking them to start as soon as they are ready.
        
        CRITICAL: 
        - DO NOT provide any interactive exercises.
        - Just provide the topic and the instruction to speak.
      `;
    } else if (type === 'reading') {
      if (subTopic === 'Reading Fluency Evaluation') {
        prompt = `
          Level: ${progress.level}
          Goal: Reading Fluency Evaluation System
          
          ---
          ### 🎯 TASK
          Your goal is to evaluate the user's spoken reading ability.

          ---
          ### 📚 CONTENT GENERATION
          * Generate a long reading passage (1000–1500 words)
          * Use real-world topics (news, education, technology, society)
          * Keep language appropriate to the user's level (${progress.level})
          * Ensure natural paragraph structure

          ---
          ### ⏱️ READING MODE
          * The user will read the passage aloud
          * You must remain SILENT during reading
          * Do NOT interrupt or correct

          ---
          ### 🎙️ LISTENING MODE
          While the user reads, internally track:
          * Pronunciation issues (if detectable)
          * Missing or skipped words
          * Incorrect reading
          * Hesitations and pauses
          * Fluency breaks

          ---
          ### ⏳ TIMER
          * Allow reading duration up to 15 minutes
          * Start timer when reading begins
          * Stop analysis when time ends or user submits

          ---
          ### 📊 FINAL EVALUATION (AFTER READING)
          Provide detailed scoring:
          1. Fluency (0–25)
          2. Accuracy (0–25)
          3. Pronunciation (0–25)
          4. Pace (0–25)
          Total score out of 100

          ---
          ### 📝 FEEDBACK
          Provide:
          1. Specific mistakes (categorized)
          2. Corrected version of misread parts
          3. Better C1-level version of the passage (summary)
          
          CRITICAL: 
          - DO NOT provide any interactive exercises (JSON).
          - The passage MUST be long and detailed.
        `;
      } else {
        prompt = `
          Level: ${progress.level}
          Goal: Reading + Speaking Evaluation
          
          Instructions:
          1. Generate a reading passage based on recent real-world topics (like news, technology, or science).
          2. Keep the language clear and suitable for the user's level (${progress.level}).
          3. After the passage, ask the user to:
             - Summarize the passage in their own words OR
             - Answer 2-3 specific questions about the passage by speaking.
          4. Instruct the user to use the voice recorder to provide their response.
          
          CRITICAL: 
          - DO NOT provide any interactive exercises (JSON).
          - Focus on the Reading + Speaking flow.
        `;
      }
    } else if (type === 'vocabulary') {
      prompt = `
        Level: ${progress.level}
        Focus Area: Vocabulary
        ${subTopic ? `Sub-topic: ${subTopic}` : ''}
        
        ---
        ### 🎯 CORE RULE: INFINITE CONTENT GENERATION
        * Every time the user opens or retries a section (e.g., ${subTopic || 'Vocabulary'}), you MUST generate NEW content.
        * NEVER repeat previous questions, words, or examples.
        * Treat each session as a completely new test.
        
        ### 🧠 CONTENT SOURCE LOGIC
        * English vocabulary is vast → content must feel unlimited.
        * Continuously vary:
          - Words
          - Difficulty
          - Sentence examples
          - Question patterns
        
        ### 📚 SECTION-SPECIFIC RULE
        * Generate ONLY relevant content for "${subTopic || 'Vocabulary'}".
        * If sub-topic is "Synonyms and Antonyms", generate ONLY synonyms/antonyms questions.
        
        ### 🔁 QUESTION GENERATION RULES
        * Generate a fresh set of 5–10 vocabulary questions.
        * Include:
          - Synonym identification
          - Antonym identification
          - Fill in the blanks
          - Sentence-based meaning
        * Use different words every time.
        * Avoid repeating recently used words.
        
        ### 🧪 AFTER TEST COMPLETION
        * When user finishes, they should be able to start a NEW test set immediately.
        * Do NOT show same content again.
        * Allow unlimited attempts.
        
        ### 🧠 DIFFICULTY PROGRESSION
        * Current Overall Score: ${progress.overallScore}
        * If user performs well (Score > 70) → slightly increase difficulty.
        * If user struggles → keep it simple.
        
        ### 🚫 STRICT RESTRICTIONS
        * Do NOT reuse: Same words, Same sentences, Same question patterns.
        * Do NOT cache or repeat previous outputs.
        
        ### 🎯 FINAL GOAL
        * Content never ends.
        * Each attempt feels new.
        * User continuously learns new vocabulary.
        
        Include a JSON block with these exercises at the end.
      `;
    } else {
      prompt = `
        Level: ${progress.level}
        Test Type: ${type}
        ${subTopic ? `Focus Topic: ${subTopic}` : ''}
        
        Instructions:
        Generate a comprehensive assessment for this component.
        ${subTopic ? `The test MUST focus primarily on the topic: "${subTopic}".` : ''}
        Include a mix of theory and practical questions.
        Include a JSON block with 5 interactive exercises (mcq or fill) at the end.
        
        CRITICAL: DO NOT include any "Step 11" or "Final Assessment" headers in your response. Just provide the content.
      `;
    }

    const response = await generateResponse(prompt, SYSTEM_INSTRUCTIONS);
    if (response) {
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[1]);
          if (data.exercises) setExercises(data.exercises);
        } catch (e) {
          console.error("Failed to parse exercises JSON", e);
        }
      }
      const cleanContent = response.replace(/```json\s*[\s\S]*?\s*```/, '').trim();
      setTestContent(cleanContent);
    }
    setIsLoading(false);
  };

  const handleAnswer = (index: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [index]: answer }));
  };

  const handleEvaluate = async () => {
    if (!userResponse.trim() && !audioBlob && Object.keys(userAnswers).length === 0) return;
    setIsEvaluating(true);

    // Calculate interactive score for the prompt
    const interactiveResults = exercises.map((ex, i) => ({
      question: ex.question,
      userAnswer: userAnswers[i] || "Not answered",
      correctAnswer: ex.answer,
      isCorrect: (userAnswers[i] || "").trim().toLowerCase() === ex.answer.trim().toLowerCase()
    }));

    let prompt = '';
    
    if (isQuickPractice && assessmentType === 'grammar') {
      prompt = `
        Level: ${progress.level}
        Mode: Grammar Quick Practice Evaluation
        
        User Answers:
        ${JSON.stringify(interactiveResults, null, 2)}
        
        Open Response: "${userResponse}"
        
        Task:
        1. Check the answers against the "High School English Grammar & Composition" (Wren & Martin) standards.
        2. Provide immediate, simple corrections.
        3. Explain briefly why correct/wrong.
        4. Give a score out of 100.
        
        Format:
        - Brief feedback.
        - Specific corrections.
        - SCORE_SUMMARY: [score]
      `;
    } else if (assessmentType === 'writing') {
      prompt = `
        Level: C1 (Advanced)
        Mode: IELTS Writing Coach - Deep Analysis
        
        User Writing Response: "${userResponse}"
        
        ---
        ### 🧠 ANALYSIS CRITERIA
        Evaluate the writing deeply based on:
        1. **Task Response (Relevance):** Did the user address all parts of the task?
        2. **Coherence and Structure:** Is the writing logically organized with clear progression?
        3. **Vocabulary Usage:** Range, precision, and appropriateness of word choice.
        4. **Grammar Accuracy:** Complexity and correctness of sentence structures.
        
        ---
        ### 📊 SCORING (Total 100)
        * Task Response: /25
        * Coherence: /25
        * Vocabulary: /25
        * Grammar: /25
        
        ---
        ### 📝 FEEDBACK STRUCTURE
        Provide:
        1. **Mistakes:** Simple, structured explanation of errors.
        2. **Corrections:** Clear "Wrong → Correct" mapping.
        3. **Improved C1-Level Version:** A high-quality rewrite of the user's response.
        
        ---
        ### 🔁 REWRITE PROMPT
        * Ask the user to rewrite their response incorporating the feedback.
        
        ---
        ### ⚠️ RULES
        * Keep feedback short and structured.
        * Focus on improvement, not theory.
        * Provide a final score in the format: SCORE_SUMMARY: [total_score]
        
        Format:
        - ### 📊 Performance Scorecard
        - ### 🛠 Mistakes & Corrections
        - ### 🌟 Improved C1-Level Version
        - ### 🔁 Rewrite Challenge
        - SCORE_SUMMARY: [total_score]
      `;
    } else if (assessmentType === 'speaking') {
      prompt = `
        Level: C1 (Advanced)
        Mode: Speaking Fluency Deep Analysis
        
        User Response: "${userResponse}"
        ${audioBlob ? "[User provided a voice recording for speaking evaluation]" : ""}
        
        Task:
        1. Analyze the speech deeply for:
           - Grammar mistakes
           - Vocabulary issues (word choice, range)
           - Sentence structure problems (complexity, variety)
           - Fluency (hesitation, unnatural phrasing)
        
        2. Correction Style:
           - For each major mistake:
             - **Original:** [Original sentence]
             - **Improved:** [Improved version]
             - **Why:** [Brief explanation, 1–2 lines only]
        
        3. Improvement:
           - Provide a better C1-level version of the entire response.
           - Highlight natural phrasing and advanced vocabulary.
        
        4. Retry System:
           - End with an encouraging instruction to say it again using the improvements.
        
        5. Scoring:
           - Give a score out of 100 based on C1 criteria.
        
        Format:
        - ### 📊 Deep Analysis
        - ### 🛠 Specific Corrections
        - ### 🌟 C1-Level Version
        - ### 💡 Natural Phrasing Tips
        - ### 🔁 Retry Instruction
        - SCORE_SUMMARY: [score]
      `;
    } else if (assessmentType === 'reading') {
      if (selectedSubTopic === 'Reading Fluency Evaluation') {
        prompt = `
          Level: ${progress.level}
          Mode: Reading Fluency Evaluation Analysis
          
          User Response: "${userResponse}"
          ${audioBlob ? "[User provided a voice recording of them reading the passage aloud]" : ""}
          
          Task:
          1. Evaluate the spoken reading ability based on:
             - Fluency (0–25): Flow, smoothness, lack of unnatural breaks.
             - Accuracy (0–25): Correctness of words read, no skipped words.
             - Pronunciation (0–25): Clarity and correctness of sounds.
             - Pace (0–25): Speed and rhythm (not too fast, not too slow).
          
          2. Final Evaluation:
             - Provide detailed scoring for each category.
             - Total score out of 100.
          
          3. Feedback:
             - List specific mistakes made during reading.
             - Identify words or sentences misread.
             - Provide suggestions for improvement.
             - Suggest better reading techniques.
          
          4. Improvement:
             - Ask the user to try again.
             - Optionally suggest a shorter passage for practice if they struggled.
          
          Format:
          - ### 📊 Reading Fluency Scorecard
          - ### 🎙️ Detailed Analysis
          - ### 🛠 Mistakes & Corrections
          - ### 💡 Improvement Tips
          - ### 🔁 Next Steps
          - SCORE_SUMMARY: [total_score]
        `;
      } else {
        prompt = `
          Level: ${progress.level}
          Mode: Reading + Speaking Evaluation Analysis
          
          User Response: "${userResponse}"
          ${audioBlob ? "[User provided a voice recording for evaluation]" : ""}
          
          Task:
          1. Analyze the response in these areas:
             - Comprehension: Did the user understand the passage correctly?
             - Grammar accuracy: Correctness of sentence structures.
             - Fluency: Pauses, hesitation, and flow.
             - Vocabulary usage: Range and appropriateness of words.
             - Coherence: Logical structure of ideas.
          
          2. Scoring (Total 100):
             - Comprehension: /30
             - Accuracy: /20
             - Fluency: /20
             - Vocabulary: /15
             - Coherence: /15
          
          3. Feedback:
             - List mistakes clearly and categorize them (Grammar, Vocab, etc.).
             - Provide a corrected version of the user's response.
             - Provide a better C1-level version of the response.
          
          4. Improvement Loop:
             - Ask the user to try again (improved) and encourage better performance.
          
          Format:
          - ### 📊 Performance Analysis
          - ### 🛠 Categorized Mistakes
          - ### 📝 Corrected Version
          - ### 🌟 C1-Level Version
          - ### 🔁 Improvement Loop
          - SCORE_SUMMARY: [total_score]
        `;
      }
    } else if (assessmentType === 'weekly' || assessmentType === 'monthly') {
      prompt = `
        Test Type: ${assessmentType} Test
        Level: ${progress.level}
        
        User Open Response (Text): "${userResponse}"
        ${audioBlob ? "[User provided a voice recording for speaking evaluation]" : ""}
        
        Interactive Exercises Results:
        ${JSON.stringify(interactiveResults, null, 2)}
        
        Task:
        1. Evaluate the performance across all components (Grammar, Vocabulary, Speaking, Reading, Writing).
        2. Provide a detailed breakdown of strengths and weaknesses.
        3. Give a final score out of 100.
        
        Format your response with:
        - A detailed breakdown.
        - Specific corrections.
        - A clear final score at the end in this format: SCORE_SUMMARY: [score]
      `;
    } else {
      prompt = `
        Test Type: ${assessmentType}
        Level: ${progress.level}
        
        User Open Response (Text): "${userResponse}"
        ${audioBlob ? "[User provided a voice recording for speaking evaluation]" : ""}
        
        Interactive Exercises Results:
        ${JSON.stringify(interactiveResults, null, 2)}
        
        Task:
        1. Grade the interactive exercises (already checked for string equality, but consider semantic correctness for fill-in-the-blanks).
        2. Evaluate the open response (text/speaking) based on IELTS/Oxford criteria.
        3. Provide a holistic performance analysis.
        4. Give a final score out of 100.
        
        Format your response with:
        - A detailed breakdown of strengths and weaknesses.
        - Specific corrections for any mistakes.
        - A clear final score at the end in this format: SCORE_SUMMARY: [score]
      `;
    }

    const response = await generateResponse(prompt, SYSTEM_INSTRUCTIONS);
    setFeedback(response || "Evaluation failed.");
    setShowResults(true); 
    setIsEvaluating(false);
    setIsSubmitted(true);
    
    // Extract score and update progress
    const scoreMatch = response?.match(/SCORE_SUMMARY:?\s*(\d+)/i);
    if (scoreMatch && assessmentType) {
      const score = parseInt(scoreMatch[1]);
      const newScores: Partial<ComponentScore> = {};
      
      if (assessmentType === 'grand' || assessmentType === 'weekly' || assessmentType === 'monthly') {
        // For comprehensive tests, the score applies to all components
        newScores.grammar = score;
        newScores.vocabulary = score;
        newScores.speaking = score;
        newScores.writing = score;
        newScores.reading = score;
      } else {
        // For specific skill tests, only update that skill
        newScores[assessmentType as keyof ComponentScore] = score;
      }
      onComplete(newScores as ComponentScore);
    }
  };

  const renderExercises = () => {
    if (exercises.length === 0) return null;

    return (
      <div className="space-y-10 mt-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900">Interactive Section</h3>
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
            onClick={() => setShowResults(true)}
            className="w-full py-5 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all shadow-xl"
          >
            Check Answers
          </button>
        )}
      </div>
    );
  };

  if (!assessmentType) {
    if (activeCategory === 'grammar' || activeCategory === 'vocabulary' || activeCategory === 'reading') {
      const subTopics = activeCategory === 'grammar' ? GRAMMAR_SUBTOPICS : (activeCategory === 'vocabulary' ? VOCABULARY_SUBTOPICS : READING_SUBTOPICS);
      return (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveCategory(null)}
              className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-500" />
            </button>
            <h1 className="font-display text-3xl font-bold text-zinc-900 capitalize">
              {activeCategory} Focus Areas
            </h1>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => startAssessment(activeCategory)}
              className="p-6 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all text-left flex items-center justify-between group"
            >
              <div className="flex flex-col">
                <span>General Comprehensive Test</span>
                <span className="text-[10px] opacity-50 font-medium uppercase tracking-wider mt-1">Full Assessment</span>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            {activeCategory === 'grammar' && (
              <button
                onClick={() => startAssessment('grammar', null, true)}
                className="p-6 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all text-left flex items-center justify-between group shadow-lg shadow-emerald-900/20"
              >
                <div className="flex flex-col">
                  <span>Quick Grammar Practice</span>
                  <span className="text-[10px] opacity-70 font-medium uppercase tracking-wider mt-1">2-3 Quick Questions</span>
                </div>
                <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            )}
            {subTopics.map((topic) => (
              <div key={topic} className="flex flex-col gap-2">
                <button
                  onClick={() => startAssessment(activeCategory, topic)}
                  className="p-6 bg-white border border-zinc-200 rounded-2xl font-medium text-zinc-700 hover:border-emerald-500 hover:text-emerald-700 transition-all text-left flex items-center justify-between group"
                >
                  <span>{topic}</span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
                {activeCategory === 'grammar' && (
                  <button 
                    onClick={() => startAssessment('grammar', topic, true)}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center gap-1 px-4"
                  >
                    <Zap className="w-3 h-3" />
                    Quick Practice
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onExit?.()}
            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-500" />
          </button>
          <div className="text-left">
            <h1 className="font-display text-4xl font-bold text-zinc-900 mb-2">Assessment Center</h1>
            <p className="text-zinc-500">
              Challenge yourself with specialized tests or take the Grand Test to evaluate your overall proficiency.
            </p>
          </div>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: 'grammar', label: 'Grammar Mastery', icon: Brain, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Tenses, structures, and complex grammar.' },
              { id: 'vocabulary', label: 'Vocabulary Bank', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Oxford-level words and academic idioms.' },
              { id: 'speaking', label: 'Speaking Fluency', icon: Mic, color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Pronunciation, clarity, and natural flow.' },
              { id: 'reading', label: 'Reading Comp.', icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Contextual understanding and inference.' },
              { id: 'writing', label: 'IELTS Writing Coach', icon: PenTool, color: 'text-rose-600', bg: 'bg-rose-50', desc: 'IELTS Task 1 & 2 practice with deep AI feedback.' },
              { id: 'grand', label: 'Grand Test', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Comprehensive evaluation of all skills.' },
            ].map((test) => (
              <motion.button
                key={test.id}
                whileHover={{ y: -5 }}
                onClick={() => {
                  if (test.id === 'grammar' || test.id === 'vocabulary' || test.id === 'reading') {
                    setActiveCategory(test.id as AssessmentType);
                  } else {
                    startAssessment(test.id as AssessmentType);
                  }
                }}
                className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm hover:shadow-xl transition-all text-left group"
              >
              <div className={`w-14 h-14 ${test.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <test.icon className={`w-7 h-7 ${test.color}`} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-2">{test.label}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">{test.desc}</p>
              <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                {test.id === 'grammar' || test.id === 'vocabulary' ? 'Explore Topics' : 'Start Test'}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <button 
          disabled={!isSubmitted}
          onClick={() => {
            if (!isSubmitted) return;
            setAssessmentType(null);
            setSelectedSubTopic(null);
            onLockChange?.(false);
          }} 
          className={cn(
            "p-2 rounded-xl transition-colors",
            !isSubmitted ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-100"
          )}
        >
          <ArrowLeft className="w-5 h-5 text-zinc-500" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Assessment</p>
          <h2 className="font-bold text-zinc-900 capitalize">
            {selectedSubTopic || `${assessmentType} Test`}
          </h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-3 h-3" />
          Live
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-zinc-200 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-10 flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-6">
              <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
              <p className="text-zinc-500 font-bold text-xl animate-pulse">Generating your test...</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {isQuickPractice && (
                <div className="flex justify-center">
                  <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-widest flex items-center gap-2 border border-emerald-200">
                    <Zap className="w-3 h-3 fill-emerald-500" />
                    Quick Practice: Wren & Martin Reference
                  </span>
                </div>
              )}
              <div className="markdown-body prose prose-zinc max-w-none">
                <Markdown>{testContent}</Markdown>
              </div>

              {renderExercises()}

              <div className="mt-12 space-y-8 pt-10 border-t border-zinc-100">
                {assessmentType === 'speaking' || assessmentType === 'reading' ? (
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
                      {isRecording ? <Square className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-white" />}
                    </button>
                    {audioBlob && (
                      <div className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-full font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Recording Ready
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Your Open Response</p>
                      {assessmentType === 'writing' && (
                        <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
                          {userResponse.trim().split(/\s+/).filter(Boolean).length} Words
                        </span>
                      )}
                    </div>
                    <textarea
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      disabled={isSubmitted && assessmentType !== 'writing'}
                      placeholder="Type your answer here..."
                      className="w-full h-40 p-6 bg-zinc-50 border border-zinc-200 rounded-[24px] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-lg shadow-inner disabled:opacity-50"
                    />
                  </div>
                )}

                <div className="flex flex-col items-center gap-4">
                  {!isSubmitted ? (
                    <button
                      onClick={handleEvaluate}
                      disabled={isEvaluating || (!userResponse.trim() && !audioBlob && Object.keys(userAnswers).length === 0)}
                      className="px-12 py-5 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 disabled:opacity-50 transition-all flex items-center gap-3 shadow-xl"
                    >
                      {isEvaluating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Evaluating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-emerald-400" />
                          Submit Assessment
                        </>
                      )}
                    </button>
                  ) : assessmentType === 'writing' ? (
                    <button
                      onClick={() => {
                        setIsSubmitted(false);
                        setFeedback(null);
                      }}
                      className="px-12 py-5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all flex items-center gap-3 shadow-xl shadow-emerald-100"
                    >
                      <HistoryIcon className="w-5 h-5" />
                      Try Rewrite
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          )}
        </div>

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
                  <h3 className="font-display text-2xl font-bold">Assessment Results</h3>
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

              <div className="mt-10 flex flex-wrap gap-4 pt-10 border-t border-white/10">
                <button
                  onClick={() => {
                    setFeedback(null);
                    setIsSubmitted(false);
                    startAssessment(assessmentType, selectedSubTopic, isQuickPractice);
                  }}
                  className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 transition-all flex items-center gap-2 shadow-lg"
                >
                  <Sparkles className="w-5 h-5" />
                  Next Test
                </button>
                <button
                  onClick={() => {
                    setFeedback(null);
                    setIsSubmitted(false);
                    setUserResponse('');
                    setAudioBlob(null);
                    setUserAnswers({});
                    setShowResults(false);
                  }}
                  className="px-8 py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-all flex items-center gap-2 border border-white/10"
                >
                  <HistoryIcon className="w-5 h-5" />
                  Retry
                </button>
                <button
                  onClick={() => {
                    setFeedback(null);
                    setIsSubmitted(false);
                    onLockChange?.(false);
                    onExit?.();
                  }}
                  className="px-8 py-4 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Finish & Exit
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
