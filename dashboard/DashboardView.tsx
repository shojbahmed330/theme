
import React from 'react';
import { Rocket, Zap, Smartphone, MessageSquare } from 'lucide-react';
import { AppMode, BuildStep } from '../types';

// Sub-components
import ChatBox from './components/ChatBox';
import MobilePreview from './components/MobilePreview';
import CodeEditor from './components/CodeEditor';
import BuildStatusDisplay from './components/BuildStatusDisplay.tsx';

interface DashboardViewProps {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  messages: any[];
  input: string;
  setInput: (s: string) => void;
  isGenerating: boolean;
  projectFiles: Record<string, string>;
  setProjectFiles: (files: any) => void;
  selectedFile: string;
  setSelectedFile: (file: string) => void;
  buildStatus: { status: string; message: string; apkUrl?: string; webUrl?: string };
  setBuildStatus: (s: any) => void;
  buildSteps: BuildStep[];
  mobileTab: 'chat' | 'preview';
  setMobileTab: (t: 'chat' | 'preview') => void;
  handleSend: () => void;
  handleBuildAPK: () => void;
  handleSecureDownload: () => void;
  isDownloading: boolean;
  selectedImage: any;
  setSelectedImage: (img: any) => void;
  handleImageSelect: (file: File) => void;
}

const DashboardView: React.FC<DashboardViewProps> = (props) => {
  if (props.mode === AppMode.PREVIEW) {
    return (
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative bg-transparent">
        <div className="flex-1 flex flex-col lg:flex-row h-full">
          <ChatBox 
            messages={props.messages} input={props.input} setInput={props.setInput} 
            isGenerating={props.isGenerating} handleSend={props.handleSend} mobileTab={props.mobileTab} 
            selectedImage={props.selectedImage} setSelectedImage={props.setSelectedImage}
            handleImageSelect={props.handleImageSelect}
          />
          <MobilePreview 
            projectFiles={props.projectFiles} setMode={props.setMode} 
            handleBuildAPK={props.handleBuildAPK} mobileTab={props.mobileTab}
            isGenerating={props.isGenerating}
          />
        </div>

        {/* Enhanced Mobile-Only Floating UI */}
        <div className="lg:hidden fixed top-20 left-0 right-0 z-[200] px-4 pointer-events-none flex flex-col items-center gap-4">
           <div className="w-full flex items-center justify-between max-w-[500px]">
              {/* Centered Large Mobile Tab Switcher */}
              <div className="bg-black/80 backdrop-blur-2xl p-1.5 rounded-[1.5rem] border border-white/10 flex gap-1 pointer-events-auto shadow-[0_10px_30px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
                <button 
                  onClick={() => props.setMobileTab('chat')} 
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-black uppercase transition-all duration-300 ${props.mobileTab === 'chat' ? 'bg-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)]' : 'text-zinc-500 hover:text-white'}`}
                >
                  <MessageSquare size={16}/> <span>Chat</span>
                </button>
                <button 
                  onClick={() => props.setMobileTab('preview')} 
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-black uppercase transition-all duration-300 ${props.mobileTab === 'preview' ? 'bg-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)]' : 'text-zinc-500 hover:text-white'}`}
                >
                  <Smartphone size={16}/> <span>Visual</span>
                </button>
              </div>

              {/* Enlarged Mobile Build Button */}
              <button 
                onClick={props.handleBuildAPK}
                className="bg-gradient-to-br from-pink-500 to-rose-600 p-4 rounded-[1.5rem] text-white shadow-[0_10px_30px_rgba(236,72,153,0.3)] pointer-events-auto active:scale-90 transition-all border border-white/20 flex items-center justify-center group"
              >
                <Rocket size={20} className="group-active:animate-bounce" />
                <span className="ml-2 text-[10px] font-black uppercase tracking-widest hidden sm:inline">Execute Build</span>
              </button>
           </div>
        </div>

        {/* Desktop Floating Build Button - Only visible on LG+ */}
        <div className="hidden lg:block fixed bottom-12 right-12 z-[200] animate-in slide-in-from-right-10 duration-1000">
           <button 
             onClick={props.handleBuildAPK}
             className="group relative flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 bg-[length:200%_auto] hover:bg-right rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] text-white shadow-[0_20px_50px_-15px_rgba(236,72,153,0.6)] hover:shadow-[0_25px_60px_-10px_rgba(236,72,153,0.8)] transition-all duration-700 hover:scale-105 active:scale-95 overflow-hidden ring-1 ring-white/30"
           >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]"></div>
              <div className="relative z-10 flex items-center gap-3">
                 <Rocket size={20} className="group-hover:animate-bounce transition-transform" />
                 <span>Execute Build</span>
                 <Zap size={14} className="text-white group-hover:animate-pulse" />
              </div>
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-500">
      {props.buildStatus.status === 'idle' ? (
        <CodeEditor 
          projectFiles={props.projectFiles} setProjectFiles={props.setProjectFiles} 
          selectedFile={props.selectedFile} setSelectedFile={props.setSelectedFile} 
          handleBuildAPK={props.handleBuildAPK} 
        />
      ) : (
        <BuildStatusDisplay 
          status={props.buildStatus.status} message={props.buildStatus.message}
          apkUrl={props.buildStatus.apkUrl} buildSteps={props.buildSteps}
          handleSecureDownload={props.handleSecureDownload}
          resetBuild={() => props.setBuildStatus({ status: 'idle', message: '' })}
        />
      )}
    </div>
  );
};

export default DashboardView;
