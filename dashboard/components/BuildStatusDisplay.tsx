
import React from 'react';
import { CheckCircle2, Terminal, Download } from 'lucide-react';
import BuildConsole from './BuildConsole';
import { BuildStep } from '../../types';

interface BuildStatusDisplayProps {
  status: string;
  message: string;
  apkUrl?: string;
  buildSteps: BuildStep[];
  handleSecureDownload: () => void;
  resetBuild: () => void;
}

const BuildStatusDisplay: React.FC<BuildStatusDisplayProps> = ({
  status, message, apkUrl, buildSteps, handleSecureDownload, resetBuild
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 overflow-y-auto">
      <div className="glass-tech w-full max-w-2xl p-8 md:p-16 rounded-[3rem] text-center relative overflow-hidden">
        {status === 'success' ? (
          <div className="space-y-8 animate-in zoom-in">
            <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-500/50 shadow-lg animate-bounce"><CheckCircle2 size={48}/></div>
            <h2 className="text-4xl font-black text-white">APK Ready</h2>
            <div className="flex gap-4 justify-center">
              <button onClick={handleSecureDownload} className="flex items-center gap-3 px-10 py-5 bg-pink-600 rounded-2xl font-black uppercase text-sm shadow-xl"><Download size={20}/> Download APK</button>
              <button onClick={resetBuild} className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-sm">Back</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Terminal size={60} className="text-pink-500 animate-pulse mx-auto"/>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                {status === 'pushing' ? 'Syncing Code' : 'Building APK'}
              </h2>
              <p className="text-pink-400/70 font-mono text-[10px] uppercase tracking-widest mt-1">{message}</p>
            </div>
            <BuildConsole steps={buildSteps} />
            <button onClick={resetBuild} className="mt-6 text-[10px] font-black uppercase text-slate-600 hover:text-red-500 transition-colors">Terminate Build</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildStatusDisplay;
