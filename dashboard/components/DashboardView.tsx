
import React from 'react';
import { AppMode, BuildStep } from '../../types';

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
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
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
          />
        </div>
        <div className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 bg-purple-900/80 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/10 flex gap-1 z-[150]">
           <button onClick={() => props.setMobileTab('chat')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${props.mobileTab === 'chat' ? 'bg-pink-600 text-white' : 'text-slate-400'}`}>Chat</button>
           <button onClick={() => props.setMobileTab('preview')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${props.mobileTab === 'preview' ? 'bg-pink-600 text-white' : 'text-slate-400'}`}>Visual</button>
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
