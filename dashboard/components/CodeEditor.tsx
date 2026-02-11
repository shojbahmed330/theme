
import React from 'react';
import { FileCode, Rocket, Settings } from 'lucide-react';

interface CodeEditorProps {
  projectFiles: Record<string, string>;
  setProjectFiles: (files: any) => void;
  selectedFile: string;
  setSelectedFile: (file: string) => void;
  handleBuildAPK: () => void;
  onOpenConfig?: () => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  projectFiles, setProjectFiles, selectedFile, setSelectedFile, handleBuildAPK, onOpenConfig
}) => {
  return (
    <>
      <aside className="w-full md:w-64 border-r border-pink-500/10 bg-purple-900/10 p-4 space-y-2 overflow-y-auto">
         <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500 mb-4 px-2">Project Terminal</h3>
         {Object.keys(projectFiles).map(file => (
           <button key={file} onClick={() => setSelectedFile(file)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${selectedFile === file ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
              <FileCode size={16} /> {file}
           </button>
         ))}
      </aside>
      <main className="flex-1 bg-[#1a0533]/40 p-4 overflow-hidden flex flex-col">
         <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-pink-400 font-bold">{selectedFile}</span>
              {onOpenConfig && (
                <button 
                  onClick={onOpenConfig}
                  className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 hover:text-pink-400 transition-colors"
                >
                  <Settings size={14}/> <span>App Settings</span>
                </button>
              )}
            </div>
            <button onClick={handleBuildAPK} className="px-6 py-2 bg-pink-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-pink-500 transition-colors"><Rocket size={14}/> Run Cloud Build</button>
         </div>
         <textarea 
           value={projectFiles[selectedFile]} 
           onChange={e => setProjectFiles(prev => ({...prev, [selectedFile]: e.target.value}))} 
           className="flex-1 w-full bg-purple-950/20 border border-pink-500/10 rounded-2xl p-6 font-mono text-xs text-slate-300 outline-none resize-none backdrop-blur-md shadow-inner" 
         />
      </main>
    </>
  );
};

export default CodeEditor;
