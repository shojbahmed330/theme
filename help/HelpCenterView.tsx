
import React, { useState } from 'react';
import { 
  ArrowLeft, Book, Github, Zap, Smartphone, 
  Key, Rocket, Code, HelpCircle, ChevronRight,
  ExternalLink, ShieldCheck, PlayCircle
} from 'lucide-react';

interface HelpCenterViewProps {
  onBack: () => void;
}

const HelpCenterView: React.FC<HelpCenterViewProps> = ({ onBack }) => {
  const [activeTopic, setActiveTopic] = useState<'basics' | 'github' | 'ai' | 'build'>('basics');

  const guides = {
    basics: [
      { title: "কিভাবে শুরু করবেন?", desc: "প্রথমে ড্যাশবোর্ড থেকে AI চ্যাট বক্সে আপনার আইডিয়া লিখুন। AI স্বয়ংক্রিয়ভাবে কোড জেনারেট করবে।", icon: PlayCircle },
      { title: "প্রজেক্ট সেভ করা", desc: "Workspace সেকশন থেকে আপনার প্রজেক্টটি একটি নাম দিয়ে ক্লাউডে সেভ করে রাখতে পারেন।", icon: Book },
      { title: "লাইভ প্রিভিউ", desc: "মোবাইল প্রিভিউ উইন্ডোতে আপনার অ্যাপের আউটপুট সাথে সাথে দেখতে পারবেন।", icon: Smartphone }
    ],
    github: [
      { title: "টোকেন জেনারেশন", desc: "GitHub Settings > Developer Settings > PAT (Classic) এ গিয়ে repo এবং workflow স্কোপ দিয়ে একটি টোকেন তৈরি করুন।", icon: Key },
      { title: "অটো-লিঙ্ক সিস্টেম", desc: "প্রোফাইল থেকে গিটহাব কানেক্ট করলে আপনার প্রতিটি প্রজেক্ট অটোমেটিক গিটহাবে পুশ হবে।", icon: Github },
      { title: "টোকেন সুরক্ষা", desc: "আপনার টোকেনটি এনক্রিপ্টেড অবস্থায় আমাদের সুরক্ষিত ডেটাবেসে সংরক্ষিত থাকে।", icon: ShieldCheck }
    ],
    ai: [
      { title: "ভালো প্রোম্প্ট লেখার টিপস", desc: "AI-কে নির্দিষ্টভাবে বলুন আপনি কি চান। যেমন: 'একটি আধুনিক ডার্ক থিম ক্যালকুলেটর তৈরি করো'।", icon: Zap },
      { title: "ইমেজ টু কোড", desc: "আপনার হাতে আঁকা কোনো ইউআই এর ছবি আপলোড করে AI-কে সেটি কোডে রূপান্তর করতে বলুন।", icon: Smartphone },
      { title: "কোড এডিটিং", desc: "আপনি যদি চান, সরাসরি কোড এডিটর থেকেও ম্যানুয়ালি কোড পরিবর্তন করতে পারেন।", icon: Code }
    ],
    build: [
      { title: "Cloud Build প্রসেস", desc: "আপনার কোড রেডি হলে 'Execute Build' বাটনে ক্লিক করুন। আমাদের ক্লাউড সার্ভার আপনার জন্য APK তৈরি করবে।", icon: Rocket },
      { title: "ডাউনলোড ও ইন্সটল", desc: "বিল্ড সফল হলে আপনি একটি QR কোড পাবেন। সেটি স্ক্যান করে সরাসরি ফোনে ইন্সটল করতে পারবেন।", icon: Zap }
    ]
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-black animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-4xl mx-auto space-y-10 pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-4 bg-white/5 hover:bg-white/10 rounded-3xl text-zinc-400 transition-all active:scale-95">
              <ArrowLeft size={24}/>
            </button>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">Help <span className="text-pink-600">Center</span></h2>
              <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em] mt-1">Documentation & Mastery Guide</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[10px] text-zinc-400 hover:text-white transition-all flex items-center gap-2">
                <ExternalLink size={14}/> Support Terminal
             </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-2 bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
          {[
            { id: 'basics', label: 'Basics', icon: PlayCircle },
            { id: 'github', label: 'GitHub Link', icon: Github },
            { id: 'ai', label: 'AI Prompts', icon: Zap },
            { id: 'build', label: 'Cloud Build', icon: Rocket }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTopic(tab.id as any)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTopic === tab.id ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'text-zinc-500 hover:bg-white/5'}`}
            >
              <tab.icon size={16}/> {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides[activeTopic].map((guide, idx) => (
            <div key={idx} className="glass-tech p-8 rounded-[2.5rem] border-white/5 group hover:border-pink-500/20 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500 mb-6 group-hover:scale-110 transition-transform">
                <guide.icon size={28}/>
              </div>
              <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight">{guide.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-bold uppercase tracking-widest">{guide.desc}</p>
            </div>
          ))}
          
          {/* Quick Help Bento Box */}
          <div className="md:col-span-2 glass-tech p-10 rounded-[3rem] border-pink-500/10 flex flex-col md:flex-row items-center gap-10 bg-gradient-to-br from-pink-500/5 to-transparent">
             <div className="text-center md:text-left space-y-4">
                <h4 className="text-2xl font-black text-white uppercase tracking-tight">গিটহাব টোকেন নিয়ে সমস্যা?</h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-bold uppercase tracking-widest max-w-sm">
                   আমাদের AI আপনাকে ধাপে ধাপে ভিডিও গাইড দেখাতে পারে। চ্যাটবক্সে "GitHub setup guide" লিখে মেসেজ দিন।
                </p>
                <button className="px-8 py-4 bg-pink-600 rounded-2xl font-black uppercase text-[10px] text-white shadow-xl shadow-pink-600/20 active:scale-95 transition-all">
                   Watch Tutorial Video
                </button>
             </div>
             <div className="flex-1 flex justify-center">
                <div className="w-40 h-40 bg-pink-600/10 rounded-full flex items-center justify-center border-4 border-pink-500/20 relative group">
                   <div className="absolute inset-0 bg-pink-500/20 blur-3xl animate-pulse rounded-full"></div>
                   <HelpCircle size={60} className="text-pink-500 relative z-10 group-hover:scale-110 transition-transform duration-500"/>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HelpCenterView;
