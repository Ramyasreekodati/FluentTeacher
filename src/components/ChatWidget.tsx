import { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Maximize2, 
  Minimize2, 
  Scan, 
  Volume2, 
  VolumeX,
  Loader2,
  Bot,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { domToCanvas } from 'modern-screenshot';
import { generateResponse, generateSpeech } from '../services/gemini';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your learning assistant. How can I help you today? You can ask me to scan the screen if you need help with a specific topic!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (imageBase64?: string) => {
    if (!input.trim() && !imageBase64) return;

    const userMessage: Message = { 
      role: 'user', 
      content: input || (imageBase64 ? "I've scanned the screen. Can you explain what's here?" : ""),
      image: imageBase64
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const systemPrompt = `You are "FluentTeacher AI", an advanced English fluency coach and learning assistant. 
      The user has provided a screenshot of their current learning screen in the FluentTeacher app.
      
      Your task:
      1. Analyze the screenshot to understand the current context (e.g., a specific lesson on "Tenses", a "Grammar Mastery" assessment, or the "Learning Path").
      2. Provide helpful, concise, and encouraging assistance based on what you see.
      3. If the user is stuck on a question, don't just give the answer; explain the reasoning or provide a hint to help them learn.
      4. Use a professional yet friendly tone.
      5. If no image is provided, assist based on the text query alone.`;
      
      const response = await generateResponse(userMessage.content, systemPrompt, imageBase64);
      
      const assistantMessage: Message = { role: 'assistant', content: response || "I'm sorry, I couldn't process that." };
      setMessages(prev => [...prev, assistantMessage]);

      if (isSpeaking && response) {
        const audioUrl = await generateSpeech(response);
        if (audioUrl) {
          try {
            if (audioRef.current) {
              audioRef.current.src = audioUrl;
              await audioRef.current.play();
            } else {
              const audio = new Audio(audioUrl);
              audioRef.current = audio;
              await audio.play();
            }
          } catch (audioError) {
            console.warn("Audio playback failed:", audioError);
          }
        }
      }
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      // Small delay to allow UI to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await domToCanvas(document.body, {
        filter: (element) => (element as HTMLElement).id !== 'chat-widget-container',
        scale: 0.5,
        features: {
          // Disable some features if they cause issues, but defaults are usually fine
        }
      });
      
      const imageBase64 = canvas.toDataURL('image/png');
      handleSend(imageBase64);
    } catch (error) {
      console.error("Scan Error:", error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div id="chat-widget-container" className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '64px' : '600px',
              width: '400px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col mb-4"
          >
            {/* Header */}
            <div className="bg-zinc-900 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Learning Agent</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsSpeaking(!isSpeaking)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title={isSpeaking ? "Mute" : "Unmute"}
                >
                  {isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
                </button>
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
                  {messages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          msg.role === 'user' ? 'bg-zinc-900' : 'bg-emerald-100'
                        }`}>
                          {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <div className={`space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          {msg.image && (
                            <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-sm mb-2">
                              <img src={msg.image} alt="Screen Scan" className="max-w-full h-auto" />
                            </div>
                          )}
                          <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                              ? 'bg-zinc-900 text-white rounded-tr-none' 
                              : 'bg-white text-zinc-800 border border-zinc-200 rounded-tl-none'
                          }`}>
                            <div className="markdown-body prose prose-sm max-w-none prose-zinc dark:prose-invert">
                              <Markdown>{msg.content}</Markdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex gap-2 items-center bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm">
                        <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                        <span className="text-xs text-zinc-500 font-medium">Agent is thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-zinc-100 space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={handleScan}
                      disabled={isScanning || isLoading}
                      className="p-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl transition-all flex items-center gap-2 text-xs font-bold disabled:opacity-50"
                    >
                      {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                      Scan Screen
                    </button>
                  </div>
                  <div className="relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Ask me anything..."
                      className="w-full p-4 pr-12 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none min-h-[80px]"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={isLoading || !input.trim()}
                      className="absolute bottom-3 right-3 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:bg-zinc-300 shadow-lg shadow-emerald-500/20"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${
          isOpen ? 'bg-zinc-900' : 'bg-emerald-600 hover:bg-emerald-500'
        }`}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
      </motion.button>
    </div>
  );
}
