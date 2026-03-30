import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BookOpen, Music, Headphones, Star, Send, ChevronRight, CheckCircle2, Layout, ListChecks, Type, Mic, Eye, Image as ImageIcon, AlertCircle, Trophy, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiInstance;
}

interface TopicOfTheDayProps {
  onBack?: () => void;
  onStartLesson?: (topic: any) => void;
  onComplete?: () => void;
  initialTopic?: string;
}

const TopicOfTheDay: React.FC<TopicOfTheDayProps> = ({ onBack, onStartLesson, onComplete, initialTopic }) => {
  const [topic, setTopic] = useState(initialTopic || '');
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sampleQuestions, setSampleQuestions] = useState<string | null>(null);
  const [mode, setMode] = useState<'generation' | 'learning'>('generation');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (userId) {
      fetchDailyTopic();
    }
  }, [userId]);

  const fetchDailyTopic = async () => {
    if (!userId) return;
    setIsInitialLoading(true);
    const docId = `${userId}_${today}`;
    const path = `dailyTopics/${docId}`;
    
    try {
      const docSnap = await getDoc(doc(db, 'dailyTopics', docId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTopic(data.topic);
        setSampleQuestions(data.content);
        setShowExplanation(true);
      } else if (initialTopic) {
        setTopic(initialTopic);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleGenerate = async () => {
    const ai = getAI();
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setSampleQuestions("Please provide a valid topic.");
      setShowExplanation(true);
      return;
    }
    
    setLoading(true);
    setShowExplanation(true);
    setSampleQuestions(null);
    setMode('generation');
    setCurrentCardIndex(0);
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are FluentTeacher AI.
        Your task is to generate clean, structured, UI-ready learning content for the topic: "${trimmedTopic}".
        
        IMPORTANT RULES:
        - Output must be CLEAN and CARD-BASED
        - Each card must contain ONLY its own content
        - DO NOT mix multiple cards in one block
        - DO NOT write long paragraphs
        - Use bullet points ONLY
        - Keep each line short (max 12 words)
        - Separate every card clearly using "---"
        - NO headings like "1. INSIDE A UNIT (TOPIC)" inside cards
        - NEVER return empty response
        - NEVER stop halfway
        - ALWAYS complete all sections

        -------------------------------------

        SECTION 1: UNIT CARDS

        --- CARD: ONE THEME ---
        - Title:
        - Context:

        --- CARD: LEVEL 1 (BEGINNER) ---
        - Vocabulary:
        - Grammar:
        - Examples:

        --- CARD: LEVEL 2 (INTERMEDIATE) ---
        - Vocabulary:
        - Grammar:
        - Examples:

        --- CARD: LEVEL 3 (ADVANCED) ---
        - Vocabulary:
        - Grammar:
        - Examples:

        --- CARD: GUIDEBOOK ---
        - Grammar:
        - Vocabulary:
        - Examples:

        --- CARD: STORY ---
        - Story:
        - Question 1:
        - Question 2:

        --- CARD: DUORADIO ---
        - Dialogue:

        --- CARD: PRACTICE ---
        - Question 1:
        - Question 2:
        - Question 3:
        - Question 4:
        - Question 5:

        -------------------------------------

        SECTION 2: LEVEL EXPLANATION

        - Beginner:
        - Intermediate:
        - Advanced:

        -------------------------------------

        SECTION 3: LESSON EXERCISES

        --- CARD: REARRANGE ---
        - Question:
        - Answer:

        --- CARD: MCQ ---
        - Question:
        - Options:
        - Answer:

        --- CARD: FILL BLANK ---
        - Question:
        - Answer:

        --- CARD: TRANSLATION ---
        - Question:
        - Answer:

        --- CARD: LISTENING ---
        - Question:
        - Answer:

        --- CARD: HEAR ---
        - Options:
        - Answer:

        --- CARD: MATCH ---
        - Words:

        --- CARD: PICTURE ---
        - Question:
        - Answer:

        --- CARD: READING ---
        - Passage:
        - Question:
        - Answer:

        --- CARD: SPEAK ---
        - Prompt:

        -------------------------------------

        FINAL RULE:
        Return everything in ONE response.
        No explanation. No extra text.`,
      });
      
      const content = response.text || "";
      if (content) {
        setSampleQuestions(content);
        
        // Persist to Firestore
        if (userId) {
          const docId = `${userId}_${today}`;
          await setDoc(doc(db, 'dailyTopics', docId), {
            userId,
            topic: trimmedTopic,
            content,
            date: today,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        throw new Error("Empty response");
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setSampleQuestions(`
        SECTION 1: UNIT CARDS
        --- CARD: ONE THEME ---
        - Title: ${trimmedTopic}
        - Context: Essential communication for ${trimmedTopic}.
        --- CARD: LEVEL 1 (BEGINNER) ---
        - Vocabulary: Basic terms.
        - Grammar: Present simple.
        - Examples: Simple sentences.
        --- CARD: LEVEL 2 (INTERMEDIATE) ---
        - Vocabulary: Contextual terms.
        - Grammar: Past tenses.
        - Examples: Compound sentences.
        --- CARD: LEVEL 3 (ADVANCED) ---
        - Vocabulary: Nuanced terms.
        - Grammar: Conditional structures.
        - Examples: Complex sentences.
        --- CARD: GUIDEBOOK ---
        - Grammar: Key rules.
        - Vocabulary: Core list.
        - Examples: Usage cases.
        --- CARD: STORY ---
        - Story: A short narrative.
        - Question 1: What happened?
        - Question 2: Who was involved?
        --- CARD: DUORADIO ---
        - Dialogue: A conversation.
        --- CARD: PRACTICE ---
        - Question 1: Practice 1.
        - Question 2: Practice 2.
        - Question 3: Practice 3.
        - Question 4: Practice 4.
        - Question 5: Practice 5.
        -------------------------------------
        SECTION 2: LEVEL EXPLANATION
        - Beginner: Simple words.
        - Intermediate: Longer sentences.
        - Advanced: Fluency focus.
        -------------------------------------
        SECTION 3: LESSON EXERCISES
        --- CARD: REARRANGE ---
        - Question: Rearrange this.
        - Answer: Correct order.
        --- CARD: MCQ ---
        - Question: Choose one.
        - Options: A, B, C.
        - Answer: B.
        --- CARD: FILL BLANK ---
        - Question: Fill this __.
        - Answer: blank.
        --- CARD: TRANSLATION ---
        - Question: Translate this.
        - Answer: Translation.
        --- CARD: LISTENING ---
        - Question: What was said?
        - Answer: The answer.
        --- CARD: HEAR ---
        - Options: Option 1, 2.
        - Answer: Option 1.
        --- CARD: MATCH ---
        - Words: Word A - Def A.
        --- CARD: PICTURE ---
        - Question: Describe picture.
        - Answer: Description.
        --- CARD: READING ---
        - Passage: Short text.
        - Question: Reading question.
        - Answer: Reading answer.
        --- CARD: SPEAK ---
        - Prompt: Speak about topic.
      `);
    } finally {
      setLoading(false);
    }
  };

  const parseResponse = (text: string) => {
    if (!text) return null;
    
    const sections = text.split(/-------------------------------------/);
    
    const parseCards = (sectionText: string) => {
      const cards: { title: string; content: string }[] = [];
      const cardRegex = /--- CARD: (.*?) ---([\s\S]*?)(?=--- CARD:|$)/g;
      let match;
      while ((match = cardRegex.exec(sectionText)) !== null) {
        cards.push({
          title: match[1].trim(),
          content: match[2].trim()
        });
      }
      return cards;
    };

    return {
      unitCards: parseCards(sections[0] || sections.find(s => s.includes('SECTION 1')) || ''),
      levelExplanation: sections[1] || sections.find(s => s.includes('SECTION 2')) || '',
      lessonExercises: parseCards(sections[2] || sections.find(s => s.includes('SECTION 3')) || '')
    };
  };

  const parsedContent = parseResponse(sampleQuestions || '');

  const handleStartUnit = () => {
    if (!topic.trim()) {
      alert("No topic selected. Please generate a unit first.");
      return;
    }
    setMode('learning');
  };

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-6">
        <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
        <p className="text-zinc-500 font-bold text-xl animate-pulse text-center">
          Checking your daily topic...
        </p>
      </div>
    );
  }

  if (mode === 'learning' && parsedContent) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-12 pb-32">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onBack ? onBack() : setMode('generation')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900">Learning Unit: {topic}</h1>
              <p className="text-slate-500">Mastering your selected topic through structured practice.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
            <Trophy className="w-5 h-5" />
            <span className="font-bold">Unit Learning Screen</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-12">
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  Unit Content
                </h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentCardIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentCardIndex === 0}
                    className="p-2 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                  <span className="text-xs font-bold text-slate-400">
                    {currentCardIndex + 1} / {parsedContent.unitCards.length}
                  </span>
                  <button 
                    onClick={() => setCurrentCardIndex(prev => Math.min(parsedContent.unitCards.length - 1, prev + 1))}
                    disabled={currentCardIndex === parsedContent.unitCards.length - 1}
                    className="p-2 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="relative min-h-[300px]">
                <AnimatePresence mode="wait">
                  {parsedContent.unitCards.map((card, i) => {
                    if (i !== currentCardIndex) return null;
                    return (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm"
                      >
                        <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-4">{card.title}</h3>
                        <div className="markdown-body prose prose-slate prose-sm max-w-none prose-ul:pl-4">
                          <ReactMarkdown>{card.content}</ReactMarkdown>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                
                <div className="flex justify-center gap-1.5 mt-6">
                  {parsedContent.unitCards.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentCardIndex(i)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        i === currentCardIndex ? "bg-emerald-600 w-6" : "bg-slate-200 hover:bg-slate-300"
                      )}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Layout className="w-5 h-5 text-emerald-600" />
                Lesson Exercises
              </h2>
              <div className="space-y-4">
                {parsedContent.lessonExercises.map((card, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <h3 className="font-bold text-slate-900">{card.title}</h3>
                    </div>
                    <div className="markdown-body prose prose-slate prose-sm max-w-none prose-ul:pl-4">
                      <ReactMarkdown>{card.content}</ReactMarkdown>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <div className="bg-emerald-600 text-white p-8 rounded-[40px] shadow-xl shadow-emerald-100">
              <h3 className="text-xl font-bold mb-4">Level Guide</h3>
              <div className="markdown-body prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{parsedContent.levelExplanation}</ReactMarkdown>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <h3 className="font-bold text-slate-900">Your Progress</h3>
              <div className="space-y-4">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-1/3" />
                </div>
                <p className="text-sm text-slate-500 font-medium">Keep going! You're 33% through this unit.</p>
              </div>
              <button 
                onClick={onComplete}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
              >
                Complete Daily Goal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12 pb-32">
      {onBack && (
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors mb-8 font-bold"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
          Back to Dashboard
        </button>
      )}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-[28px] text-white shadow-xl shadow-emerald-100 mb-2">
          <Sparkles className="w-10 h-10" />
        </div>
        <h1 className="text-5xl font-display font-bold text-slate-900 tracking-tight">Topic of the Day</h1>
        <p className="text-slate-500 text-xl max-w-2xl mx-auto leading-relaxed">
          Enter an English topic to generate a structured learning unit.
        </p>
      </motion.div>

      <div className="flex gap-4 max-w-3xl mx-auto bg-white p-2 rounded-[32px] shadow-2xl shadow-slate-200 border border-slate-100">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Express gratitude, Talk about your home..."
          className="flex-1 px-8 py-5 rounded-[24px] bg-slate-50 border-none focus:ring-0 outline-none text-xl font-medium placeholder:text-slate-400"
          onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="px-10 py-5 bg-emerald-600 text-white rounded-[24px] font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200 flex items-center gap-3 active:scale-95"
        >
          {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <ChevronRight className="w-6 h-6" />}
          {loading ? 'Building...' : 'Build Unit'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="space-y-16"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                <p className="text-slate-500 font-bold animate-pulse">FluentTeacher AI is structuring your unit...</p>
              </div>
            ) : parsedContent ? (
              <div className="space-y-24">
                <section className="space-y-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-emerald-600">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <Layout className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl font-display font-bold uppercase tracking-widest">UNIT CARDS</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCurrentCardIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentCardIndex === 0}
                        className="p-3 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight className="w-6 h-6 rotate-180" />
                      </button>
                      <span className="text-sm font-bold text-slate-400 px-4">
                        {currentCardIndex + 1} / {parsedContent.unitCards.length}
                      </span>
                      <button 
                        onClick={() => setCurrentCardIndex(prev => Math.min(parsedContent.unitCards.length - 1, prev + 1))}
                        disabled={currentCardIndex === parsedContent.unitCards.length - 1}
                        className="p-3 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative min-h-[400px]">
                    <AnimatePresence mode="wait">
                      {parsedContent.unitCards.map((card, i) => {
                        if (i !== currentCardIndex) return null;

                        const icons = {
                          "ONE THEME": Sparkles,
                          "LEVEL 1 (BEGINNER)": Layout,
                          "LEVEL 2 (INTERMEDIATE)": Layout,
                          "LEVEL 3 (ADVANCED)": Layout,
                          "GUIDEBOOK": BookOpen,
                          "STORY": ImageIcon,
                          "DUORADIO": Headphones,
                          "PRACTICE": Star
                        };
                        const Icon = icons[card.title as keyof typeof icons] || Layout;
                        
                        return (
                          <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-2xl transition-all group max-w-3xl mx-auto"
                          >
                            <div className="flex items-center gap-6 mb-8">
                              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                <Icon className="w-8 h-8" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] mb-1">Unit Card {i + 1}</p>
                                <h3 className="text-3xl font-display font-bold text-slate-900">{card.title}</h3>
                              </div>
                            </div>
                            <div className="markdown-body prose prose-slate prose-lg max-w-none prose-ul:pl-6 prose-li:text-slate-600 prose-li:text-lg leading-relaxed">
                              <ReactMarkdown>{card.content}</ReactMarkdown>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Progress Dots */}
                    <div className="flex justify-center gap-2 mt-8">
                      {parsedContent.unitCards.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentCardIndex(i)}
                          className={cn(
                            "w-2.5 h-2.5 rounded-full transition-all duration-300",
                            i === currentCardIndex ? "bg-emerald-600 w-8" : "bg-slate-200 hover:bg-slate-300"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </section>

                <section className="space-y-10">
                  <div className="flex items-center gap-4 text-emerald-600">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <ListChecks className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-display font-bold uppercase tracking-widest">LEVEL EXPLANATION</h2>
                  </div>
                  
                  <div className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100">
                    <div className="markdown-body prose prose-emerald max-w-none prose-li:font-medium">
                      <ReactMarkdown>{parsedContent.levelExplanation}</ReactMarkdown>
                    </div>
                  </div>
                </section>

                <section className="space-y-10">
                  <div className="flex items-center gap-4 text-emerald-600">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <Type className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-display font-bold uppercase tracking-widest">LESSON EXERCISES</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {parsedContent.lessonExercises.map((card, i) => (
                      <motion.div 
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white p-6 rounded-[32px] border border-emerald-100 shadow-sm flex flex-col gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm">
                            {i + 1}
                          </div>
                          <h4 className="font-bold text-slate-900">{card.title}</h4>
                        </div>
                        <div className="markdown-body prose prose-slate prose-sm max-w-none prose-p:my-1 prose-li:my-0">
                          <ReactMarkdown>{card.content}</ReactMarkdown>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>

                <div className="flex justify-center pt-12">
                  <button
                    onClick={handleStartUnit}
                    className="px-16 py-8 bg-emerald-600 text-white rounded-[40px] font-bold text-2xl shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all hover:-translate-y-2 active:scale-95 flex items-center gap-6"
                  >
                    Start This Unit Now
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TopicOfTheDay;
