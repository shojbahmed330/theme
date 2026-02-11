
import React, { useState, useEffect } from 'react';
import { Smartphone, Sparkles, Loader2, Cpu } from 'lucide-react';
import { AppMode, ProjectConfig } from '../../types';
import { buildFinalHtml } from '../../utils/previewBuilder';

interface MobilePreviewProps {
  projectFiles: Record<string, string>;
  setMode: (m: AppMode) => void;
  handleBuildAPK: () => void;
  mobileTab: 'chat' | 'preview';
  isGenerating?: boolean;
  projectConfig?: ProjectConfig;
}

const MobilePreview: React.FC<MobilePreviewProps> = ({ 
  projectFiles, setMode, handleBuildAPK, mobileTab, isGenerating, projectConfig
}) => {
  const [showSplash, setShowSplash] = useState(false);
  const finalHtml = buildFinalHtml(projectFiles);
  const hasFiles = Object.keys(projectFiles).length > 0 && projectFiles['index.html'];

  useEffect(() => {
    if (hasFiles && !isGenerating) {
      setShowSplash(true);
      const timer = setTimeout(() => setShowSplash(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasFiles, isGenerating]);

  return (
    <section className={`flex-1 flex flex-col items-center justify-center p-6 relative h-full ${mobileTab === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
      <div className="relative z-10 w-full max-w-[280px] md:max-w-[340px] max-h-[70vh] md:h-[680px] aspect-[9/18.5] bg-black rounded-[3.5rem] border-[10px] border-[#18181b] shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/5">
         <div className="h-7 w-full flex items-center justify-center relative bg-[#18181b] shrink-0">
            <div className="w-20 h-3 bg-black/40 rounded-b-xl shadow-sm"></div>
         </div>
         
         <div className="flex-1 w-full bg-[#09090b] relative overflow-hidden">
            {hasFiles ? (
              <>
                <iframe srcDoc={finalHtml} className="w-full h-full border-none" title="preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals" />
                
                {showSplash && (
                  <div className="absolute inset-0 bg-[#09090b] z-[200] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300 fade-out slide-out-to-top-full fill-mode-forwards delay-1000">
                    {projectConfig?.splash && (
                      <img src={projectConfig.splash} className="absolute inset-0 w-full h-full object-cover opacity-30" />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-6">
                       <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 animate-in zoom-in duration-500">
                          {projectConfig?.icon ? (
                            <img src={projectConfig.icon} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-pink-500/10 flex items-center justify-center text-pink-500"><Sparkles size={32}/></div>
                          )}
                       </div>
                       <h1 className="text-xl font-black text-white uppercase tracking-[0.3em]">{projectConfig?.appName || 'Studio App'}</h1>
                       <div className="w-4 h-4 border-2 border-white/5 rounded-full animate-spin border-t-pink-500 mt-10"></div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-black text-center space-y-6">
                 <div className="relative">
                    <div className="absolute inset-0 bg-pink-500/10 blur-3xl rounded-full animate-pulse"></div>
                    <Cpu size={48} className="text-pink-500 relative z-10 animate-pulse" />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-xs font-black text-zinc-600 tracking-[0.4em] uppercase">OneClick Studio</h2>
                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest leading-relaxed">
                      Awaiting Neural Uplink...
                    </p>
                 </div>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl z-[100] flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
                 <div className="absolute top-12 left-0 right-0 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                       <Sparkles className="text-pink-500" size={18}/>
                       <span className="font-black text-xs uppercase tracking-[0.3em] text-white">OneClick <span className="text-pink-500">Studio</span></span>
                    </div>
                 </div>
                 
                 <div className="flex flex-col items-center gap-10 w-full max-w-[200px]">
                    <div className="relative">
                       <div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full animate-pulse"></div>
                       <div className="w-20 h-20 border-2 border-white/10 rounded-3xl flex items-center justify-center relative overflow-hidden bg-black shadow-xl">
                          <Loader2 className="animate-spin text-pink-500" size={32}/>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <h3 className="text-xl font-black text-white uppercase tracking-tighter shimmer-text">
                         BUILDING...
                       </h3>
                       <p className="text-[9px] font-black uppercase text-pink-500/60 tracking-[0.5em] animate-pulse">
                         PLEASE WAIT
                       </p>
                    </div>

                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative">
                       <div className="h-full bg-pink-500 w-full animate-[loading-bar_1.5s_infinite]"></div>
                    </div>
                 </div>
              </div>
            )}
         </div>

         <div className="h-10 w-full flex items-center justify-center gap-14 bg-[#18181b] shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-black/40"></div>
            <div className="w-8 h-1 rounded-full bg-black/40"></div>
         </div>
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-text {
          background: linear-gradient(to right, #ffffff 20%, #ec4899 40%, #ffffff 60%, #ffffff 80%);
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
