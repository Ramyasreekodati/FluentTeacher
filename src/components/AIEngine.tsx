import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileUp, 
  Sparkles, 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  Mic, 
  PenTool, 
  Brain, 
  AlertCircle, 
  Loader2,
  FileText,
  Image as ImageIcon,
  ChevronRight,
  PlayCircle
} from 'lucide-react';
import { generateResponse } from '../services/gemini';
import { LearningModule, LanguageLevel } from '../types';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AIEngineProps {
  onBack: () => void;
  userLevel: LanguageLevel;
}

const AI_ENGINE_INSTRUCTIONS = `
You are an advanced AI English learning engine.
Your goal is to transform raw learning resources (PDFs, books, notes, documents) into high-quality, structured, and interactive English learning modules.

STRICT REQUIREMENTS:
1. CONTENT EXTRACTION: Deeply analyze uploaded resources. Extract only meaningful, high-value educational content.
2. STRUCTURED LEARNING DESIGN: For every topic, generate content in this format:
   - Concept Explanation (clear, beginner → advanced progression)
   - Key Rules / Patterns
   - Vocabulary (with meaning + usage)
   - Examples (real-world, IELTS-focused)
   - Common Mistakes
   - Practice Exercises (MCQs, fill in blanks, rewriting)
   - Speaking Prompts
   - Writing Tasks (IELTS style)
   - Mini Quiz (with answers)
3. ADAPTIVE LEARNING: Adjust difficulty based on user level.
4. NO GENERIC CONTENT: Avoid textbook-like boring explanations.
5. OUTPUT FORMAT: Return a JSON object matching the LearningModule interface.

JSON Structure:
{
  "title": "Module Title",
  "level": "Level",
  "sections": [
    { "type": "explanation", "content": "Markdown text" },
    { "type": "rules", "content": "Markdown text" },
    { "type": "vocabulary", "items": [{ "word": "", "meaning": "", "usage": "" }] },
    { "type": "examples", "items": [{ "sentence": "", "context": "" }] },
    { "type": "mistakes", "items": [{ "wrong": "", "correct": "", "explanation": "" }] },
    { "type": "exercise", "questions": [{ "type": "mcq", "question": "", "options": [], "answer": "" }] },
    { "type": "speaking", "content": "Prompt text" },
    { "type": "writing", "content": "Task text" },
    { "type": "quiz", "questions": [{ "type": "fill", "question": "", "answer": "" }] }
  ]
}
`;

const AIEngine: React.FC<AIEngineProps> = ({ onBack, userLevel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [module, setModule] = useState<LearningModule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const processResource = async () => {
    if (!inputText.trim() && !file) {
      setError('Please provide some content or upload a file.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let fileBase64 = '';
      let mimeType = '';

      if (file) {
        const reader = new FileReader();
        const filePromise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
        });
        reader.readAsDataURL(file);
        fileBase64 = await filePromise;
        mimeType = file.type;
      }

      const prompt = `
        User Level: ${userLevel}
        Input Content: ${inputText}
        Please analyze the provided resource and generate a structured learning module in JSON format.
      `;

      const response = await generateResponse(
        prompt,
        AI_ENGINE_INSTRUCTIONS,
        undefined,
        undefined,
        fileBase64,
        mimeType,
        "application/json"
      );

      // Clean response text from markdown blocks if any
      const jsonStr = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsedModule = JSON.parse(jsonStr) as LearningModule;
      setModule(parsedModule);
    } catch (err) {
      console.error('AI Engine Error:', err);
      setError('Failed to process the resource. Please try again with different content.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderSection = (section: any, index: number) => {
    switch (section.type) {
      case 'explanation':
      case 'rules':
      case 'speaking':
      case 'writing':
        return (
          <div key={index} className="bg-white p-8 rounded-[32px] border border-zinc-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                section.type === 'explanation' ? "bg-blue-50 text-blue-600" :
                section.type === 'rules' ? "bg-purple-50 text-purple-600" :
                section.type === 'speaking' ? "bg-orange-50 text-orange-600" :
                "bg-rose-50 text-rose-600"
              )}>
                {section.type === 'explanation' && <BookOpen className="w-5 h-5" />}
                {section.type === 'rules' && <Brain className="w-5 h-5" />}
                {section.type === 'speaking' && <Mic className="w-5 h-5" />}
                {section.type === 'writing' && <PenTool className="w-5 h-5" />}
              </div>
              <h3 className="text-xl font-bold text-zinc-900 capitalize">{section.type}</h3>
            </div>
            <div className="markdown-body prose prose-zinc max-w-none">
              <ReactMarkdown>{section.content}</ReactMarkdown>
            </div>
          </div>
        );

      case 'vocabulary':
        return (
          <div key={index} className="bg-emerald-50 p-8 rounded-[32px] border border-emerald-100 space-y-6">
            <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Key Vocabulary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.items?.map((item: any, i: number) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
                  <div className="font-bold text-emerald-700 text-lg mb-1">{item.word}</div>
                  <div className="text-zinc-600 text-sm mb-3 italic">{item.meaning}</div>
                  <div className="text-zinc-500 text-sm bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <span className="font-semibold text-zinc-700">Usage: </span>
                    {item.usage}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'examples':
        return (
          <div key={index} className="bg-zinc-900 p-8 rounded-[32px] text-white space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-emerald-400" />
              Real-world Examples
            </h3>
            <div className="space-y-4">
              {section.items?.map((item: any, i: number) => (
                <div key={i} className="bg-zinc-800 p-6 rounded-2xl border border-zinc-700">
                  <div className="text-lg font-medium mb-2">"{item.sentence}"</div>
                  <div className="text-zinc-400 text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {item.context}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'mistakes':
        return (
          <div key={index} className="bg-rose-50 p-8 rounded-[32px] border border-rose-100 space-y-6">
            <h3 className="text-xl font-bold text-rose-900 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Common Mistakes
            </h3>
            <div className="space-y-4">
              {section.items?.map((item: any, i: number) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">Incorrect</div>
                    <div className="text-rose-600 line-through">{item.wrong}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Correct</div>
                    <div className="text-emerald-700 font-medium">{item.correct}</div>
                  </div>
                  <div className="md:col-span-2 pt-4 border-t border-zinc-100 text-zinc-600 text-sm">
                    <span className="font-bold text-zinc-900">Why? </span>
                    {item.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'exercise':
      case 'quiz':
        return (
          <div key={index} className="bg-white p-8 rounded-[32px] border border-zinc-200 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2 capitalize">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              {section.type}
            </h3>
            <div className="space-y-8">
              {section.questions?.map((q: any, i: number) => (
                <div key={i} className="space-y-4">
                  <div className="font-medium text-zinc-800">{i + 1}. {q.question}</div>
                  {q.type === 'mcq' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options?.map((opt: string, j: number) => (
                        <button key={j} className="p-4 rounded-xl border border-zinc-100 bg-zinc-50 text-left hover:border-emerald-500 hover:bg-emerald-50 transition-all text-sm">
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.type === 'fill' && (
                    <div className="flex gap-2">
                      <input type="text" placeholder="Your answer..." className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors font-bold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold">
          <Sparkles className="w-4 h-4" />
          AI Engine Active
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!module ? (
          <motion.div 
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-display font-bold text-zinc-900 tracking-tight">AI Learning Engine</h1>
              <p className="text-zinc-500 text-xl max-w-2xl mx-auto leading-relaxed">
                Transform any raw resource into a structured, interactive English module.
              </p>
            </div>

            <div className="bg-white p-10 rounded-[48px] border border-zinc-100 shadow-2xl shadow-zinc-200 space-y-8">
              <div className="space-y-4">
                <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest ml-2">Paste Content or Notes</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste text from a book, your own notes, or a transcript here..."
                  className="w-full h-48 p-8 rounded-[32px] bg-zinc-50 border-none focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-medium placeholder:text-zinc-300 resize-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest ml-2">Upload Resource (PDF/Image)</label>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "w-full p-8 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all",
                      file ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 hover:border-emerald-400 hover:bg-zinc-50"
                    )}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept=".pdf,image/*"
                    />
                    {file ? (
                      <>
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                          {file.type === 'application/pdf' ? <FileText /> : <ImageIcon />}
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-emerald-900">{file.name}</div>
                          <div className="text-xs text-emerald-600">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400">
                          <FileUp className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-zinc-900">Choose a file</div>
                          <div className="text-xs text-zinc-400">PDF or Image up to 10MB</div>
                        </div>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-col justify-end">
                  <button 
                    onClick={processResource}
                    disabled={isProcessing}
                    className="w-full py-8 bg-zinc-900 text-white rounded-[32px] font-bold text-xl shadow-xl shadow-zinc-200 hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6 text-emerald-400" />
                        Generate Module
                      </>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-medium"
                >
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="module"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="flex items-end justify-between border-b border-zinc-100 pb-8">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                  {module.level} Level
                </div>
                <h1 className="text-4xl font-display font-bold text-zinc-900">{module.title}</h1>
              </div>
              <button 
                onClick={() => setModule(null)}
                className="px-6 py-3 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-colors"
              >
                New Module
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {module.sections.map((section, index) => renderSection(section, index))}
            </div>

            <div className="pt-12 border-t border-zinc-100 flex justify-center">
              <button 
                onClick={onBack}
                className="px-12 py-5 bg-emerald-600 text-white rounded-[24px] font-bold text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-3"
              >
                Complete Module
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIEngine;
