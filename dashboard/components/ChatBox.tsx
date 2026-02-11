
import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Loader2, Send, Zap, Cpu, Layers, Image as ImageIcon, X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Question } from '../../types';

interface ChatBoxProps {
  messages: any[];
  input: string;
  setInput: (s: string) => void;
  isGenerating: boolean;
  handleSend: (extraData?: string) => void;
  mobileTab: 'chat' | 'preview';
  selectedImage: { data: string; mimeType: string; preview: string } | null;
  setSelectedImage: (img: any) => void;
  handleImageSelect: (file: File) => void;
}

const Questionnaire: React.FC<{ 
  questions: Question[], 
  onComplete: (answers: string) => void,
  onSkip: () => void 
}> = ({ questions, onComplete, onSkip }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [otherText, setOtherText] = useState('');

  const q = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  const toggleOption = (optId: string) => {
    setAnswers(prev => {
      const current = prev[q.id] || (q.type === 'multiple' ? [] : null);
      if (q.type === 'single') {
        return { ...prev, [q.id]: optId };
      } else {
        const next = current.includes(optId) 
          ? current.filter((id: string) => id !== optId) 
          : [...current, optId];
        return { ...prev, [q.id]: next };
      }
    });
  };

  const handleNext = () => {
    if (isLast) {
      const formattedAnswers = questions.map(question => {
        const ans = answers[question.id];
        let text = "";
        if (question.type === 'single') {
          const opt = question.options.find(o => o.id === ans);
          text = opt ? opt.label : (ans === 'other' ? `Other: ${otherText}` : 'N/A');
        } else {
          text = (ans || []).map((id: string) => question.options.find(o => id === id)?.label).join(', ');
        }
        return `${question.text.replace('?', '')}: ${text}`;
      }).join('\n');
      onComplete(formattedAnswers);
    } else {
      setCurrentIdx(prev => prev + 1);
      setOtherText('');
    }
  };

  return (
    <div className="w-full bg-[#0a0a0c] border border-pink-500/20 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300 my-4 ring-1 ring-white/5">
      <div className="p-4 border-b border-pink-500/10 bg-pink-500/5 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-400">System Clarification</span>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-bold text-white uppercase tracking-widest">
            {q.type === 'single' ? 'Pick one option' : 'Multiple choices allowed'}
          </span>
          <h4 className="text-sm font-black text-white leading-snug tracking-tight">{q.text}</h4>
        </div>

        <div className="space-y-2.5">
          {q.options.map(opt => {
            const isSelected = q.type === 'single' 
              ? answers[q.id] === opt.id 
              : (answers[q.id] || []).includes(opt.id);

            return (
              <button 
                key={opt.id}
                onClick={() => toggleOption(opt.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 group ${
                  isSelected 
                  ? 'bg-pink-500/10 border-pink-500/50 ring-1 ring-pink-500/20' 
                  : 'bg-white/5 border-white/5 hover:border-white/10'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                  isSelected ? 'border-pink-500 bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'border-zinc-700'
                }`}>
                  {isSelected && <Check size={12} className="text-white" />}
                </div>
                <div className="flex-1">
                  <div className={`text-xs font-black uppercase tracking-wide ${isSelected ? 'text-pink-400' : 'text-zinc-300'}`}>
                    {opt.label}
                  </div>
                  {opt.subLabel && <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{opt.subLabel}</p>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-black/40 border-t border-pink-500/10 flex items-center justify-between px-6">
        <div className="flex gap-1.5">
          <button 
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(prev => prev - 1)}
            className="p-2 text-zinc-500 hover:text-white disabled:opacity-20 transition-colors bg-white/5 rounded-xl"
          >
            <ChevronLeft size={18}/>
          </button>
          <button 
            disabled={isLast}
            onClick={() => setCurrentIdx(prev => prev + 1)}
            className="p-2 text-zinc-500 hover:text-white disabled:opacity-20 transition-colors bg-white/5 rounded-xl"
          >
            <ChevronRight size={18}/>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={onSkip}
            className="text-[9px] font-black uppercase text-zinc-500 hover:text-white tracking-[0.2em]"
          >
            Skip
          </button>
          <button 
            onClick={handleNext}
            className="px-8 py-3 bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-pink-500/20 transition-all flex items-center gap-2"
          >
            {isLast ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ChatBox: React.FC<ChatBoxProps> = ({ 
  messages, input, setInput, isGenerating, handleSend, mobileTab,
  selectedImage, setSelectedImage, handleImageSelect
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isGenerating]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <section className={`w-full lg:w-[520px] border-r border-white/5 flex flex-col bg-black/40 h-full relative ${mobileTab === 'preview' ? 'hidden lg:flex' : 'flex'}`}>
      <div 
        ref={scrollRef}
        className="flex-1 p-6 overflow-y-auto space-y-10 pt-24 md:pt-6 pb-40 scroll-smooth custom-scrollbar"
      >
        {messages.length > 0 ? messages.map((m, idx) => (
          <div 
            key={m.id} 
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both`}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex flex-col items-start w-full">
              {m.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-3 ml-2">
                  <div className="w-6 h-6 bg-pink-500/10 rounded-lg border border-pink-500/30 flex items-center justify-center">
                    <Sparkles size={12} className="text-pink-500"/>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500">Neural Engine</span>
                </div>
              )}
              
              <div className={`
                max-w-[90%] p-5 rounded-3xl text-[13px] leading-relaxed transition-all relative
                ${m.role === 'user' 
                  ? 'chat-user-bubble shadow-xl self-end' 
                  : 'chat-ai-bubble shadow-lg text-white self-start'}
              `}>
                {m.image && (
                  <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                    <img src={m.image} className="w-full max-h-[300px] object-cover" alt="Uploaded UI" />
                  </div>
                )}
                <div className="relative z-10 whitespace-pre-wrap">
                  {m.content.split(/(\*\*.*?\*\*)/g).map((part, i) => 
                    part.startsWith('**') && part.endsWith('**') 
                    ? <strong key={i} className="text-pink-400 font-black">{part.slice(2, -2)}</strong> 
                    : part
                  )}
                </div>

                {m.answersSummary ? (
                  <div className="mt-4 p-5 bg-black/40 border border-pink-500/10 rounded-2xl italic text-zinc-400 text-[11px] leading-relaxed animate-in fade-in duration-700">
                    <div className="flex items-center gap-2 mb-1">
                       <Zap size={10} className="text-pink-500"/>
                       <span className="font-black uppercase text-[9px] tracking-widest text-pink-500">Config Built</span>
                    </div>
                    {m.answersSummary.split('\n').map((line: string, i: number) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                ) : (
                  m.questions && m.questions.length > 0 && (
                    <Questionnaire 
                      questions={m.questions} 
                      onComplete={(answers) => handleSend(answers)}
                      onSkip={() => handleSend("User skipped clarifying questions. Proceed with best estimates.")}
                    />
                  )
                )}
              </div>
              
              <div className={`text-[8px] mt-3 font-black uppercase tracking-widest text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity ${m.role === 'user' ? 'mr-4 self-end' : 'ml-4 self-start'}`}>
                LOG: {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        )) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-6">
             <div className="relative">
                <div className="absolute inset-0 bg-pink-500/10 blur-[80px] rounded-full"></div>
                <div className="relative z-10 p-8 bg-white/5 border border-white/10 rounded-[3rem] shadow-2xl">
                   <Layers size={50} className="text-pink-500 opacity-60 animate-pulse"/>
                </div>
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight uppercase">
                   New Project Stub
                </h3>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-pink-600">Secure Uplink Ready</p>
             </div>
             <p className="text-xs text-zinc-500 max-w-[240px] leading-relaxed font-bold">Describe your application or upload an image. AI will build the code instantly.</p>
          </div>
        )}
        
        {isGenerating && (
          <div className="flex flex-col gap-3 p-6 bg-pink-500/10 rounded-[2.5rem] border border-pink-500/20 animate-in fade-in slide-in-from-left-4 duration-500 max-w-[280px] shadow-[0_20px_40px_-10px_rgba(236,72,153,0.2)]">
            <div className="flex items-center gap-4 text-pink-400">
               <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-pink-400/20 blur-md rounded-full animate-ping"></div>
                  <Loader2 className="animate-spin relative z-10" size={18}/>
               </div>
               <span className="text-xs font-black uppercase tracking-tighter shimmer-text text-pink-400">Building App...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#020203] via-[#020203]/95 to-transparent pt-20 z-[100]">
        
        {selectedImage && (
          <div className="mb-5 animate-in slide-in-from-bottom-4 duration-500">
            <div className="relative w-28 h-28 rounded-3xl overflow-hidden border-2 border-pink-500/50 shadow-[0_15px_30px_-10px_rgba(236,72,153,0.5)] group">
              <img src={selectedImage.preview} className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14}/>
              </button>
            </div>
          </div>
        )}

        <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 flex items-center gap-3 mb-24 md:mb-0 shadow-2xl focus-within:border-pink-500/40 transition-all ring-1 ring-white/5">
           <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             accept="image/*" 
             onChange={onFileChange} 
           />
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-12 h-12 text-zinc-500 hover:text-white hover:bg-white/10 rounded-2xl transition-all flex items-center justify-center"
           >
             <ImageIcon size={22}/>
           </button>
           
           <textarea 
             value={input} 
             onChange={e => setInput(e.target.value)} 
             onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
             placeholder="Message AI..." 
             className="flex-1 bg-transparent p-3 text-sm h-14 outline-none text-white resize-none placeholder:text-zinc-700 font-black" 
           />
           <button 
             onClick={() => handleSend()} 
             disabled={isGenerating || (!input.trim() && !selectedImage)} 
             className="w-12 h-12 bg-pink-600 text-white rounded-[1.2rem] flex items-center justify-center shadow-[0_10px_20px_-5px_rgba(236,72,153,0.4)] active:scale-95 disabled:opacity-20 transition-all hover:bg-pink-500"
           >
             <Send size={18}/>
           </button>
        </div>
      </div>
    </section>
  );
};

export default ChatBox;
