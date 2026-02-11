
import React from 'react';
import { Smartphone, Sparkles, Loader2, Cpu } from 'lucide-react';
import { AppMode } from '../../types';
import { buildFinalHtml } from '../../utils/previewBuilder';

interface MobilePreviewProps {
  projectFiles: Record<string, string>;
  setMode: (m: AppMode) => void;
  handleBuildAPK: () => void;
  mobileTab: 'chat' | 'preview';
  isGenerating?: boolean;
}

const MobilePreview: React.FC<MobilePreviewProps> = ({ 
  projectFiles, setMode, handleBuildAPK, mobileTab, isGenerating 
}) => {
  const finalHtml = buildFinalHtml(projectFiles);
  const hasFiles = Object.keys(projectFiles).length > 0 && projectFiles['index.html'];

  return (
    <section className={`flex-1 flex flex-col items-center justify-center p-6 relative h-full ${mobileTab === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
      <div className="relative z-10 w-full max-w-[280px] md:max-w-[340px] max-h-[70vh] md:h-[680px] aspect-[9/18.5] bg-[#020203] rounded-[3.5rem] border-[12px] border-[#0a0a0c] shadow-[0_0_80px_rgba(236,72,153,0.15)] overflow-hidden flex flex-col ring-1 ring-white/10">
         <div className="h-8 w-full flex items-center justify-center relative bg-[#0a0a0c] shrink-0">
            <div className="w-20 h-4 bg-black/60 rounded-b-2xl"></div>
         </div>
         
         <div className="flex-1 w-full bg-[#09090b] relative overflow-hidden">
            {hasFiles ? (
              <iframe srcDoc={finalHtml} className="w-full h-full border-none" title="preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#020203] text-center space-y-6">
                 <div className="relative">
                    <div className="absolute inset-0 bg-pink-500/10 blur-3xl rounded-full animate-pulse"></div>
                    <Cpu size={48} className="text-pink-500 relative z-10 animate-[pulse_2s_infinite]" />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-xs font-black text-white/40 tracking-[0.4em] uppercase">OneClick Studio</h2>
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-relaxed animate-pulse">
                      Awaiting Neural Uplink...
                    </p>
                 </div>
              </div>
            )}

            {/* AI Generation Overlay - High End Pink Style */}
            {isGenerating && (
              <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
                 <div className="absolute top-12 left-0 right-0 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                       <Sparkles className="text-pink-500 logo-glow-effect" size={18}/>
                       <span className="font-black text-xs uppercase tracking-[0.3em] text-white">OneClick <span className="text-pink-500">Studio</span></span>
                    </div>
                 </div>
                 
                 <div className="flex flex-col items-center gap-10 w-full max-w-[200px]">
                    <div className="relative">
                       <div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full animate-pulse"></div>
                       <div className="w-20 h-20 border border-white/10 rounded-3xl flex items-center justify-center relative overflow-hidden bg-white/5">
                          <Loader2 className="animate-spin text-pink-500" size={32}/>
                          <div className="absolute inset-0 bg-gradient-to-t from-pink-500/10 to-transparent"></div>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <h3 className="text-xl font-black text-white uppercase tracking-tighter shimmer-text">
                         CREATING APP
                       </h3>
                       <p className="text-[9px] font-black uppercase text-pink-500/60 tracking-[0.5em] animate-pulse">
                         PLEASE WAIT
                       </p>
                    </div>

                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative">
                       <div className="h-full bg-gradient-to-r from-pink-500 via-white to-pink-500 w-full animate-[loading-bar_1.5s_infinite]"></div>
                    </div>
                 </div>
              </div>
            )}
         </div>

         <div className="h-12 w-full flex items-center justify-center gap-14 bg-[#0a0a0c] shrink-0">
            <div className="w-3 h-3 rounded-full bg-white/5 border border-white/10"></div>
            <div className="w-3 h-3 rounded-sm bg-white/5 border border-white/10"></div>
         </div>
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-text {
          background: linear-gradient(to right, #fff 20%, #ec4899 40%, #ec4899 60%, #fff 80%);
          background-size: 200% auto;
          color: #000;
          background-clip: text;
          text-fill-color: transparent;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 2s linear infinite;
        }
        @keyframes shine {
          to { background-position: 200% center; }
        }
      `}</style>
    </section>
  );
};

export default MobilePreview;
