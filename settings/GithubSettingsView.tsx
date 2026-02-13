
import React, { useState } from 'react';
import { Github, Key, User, Folder, Save, ArrowLeft, ShieldCheck, AlertTriangle } from 'lucide-react';
import { GithubConfig } from '../types';

interface GithubSettingsViewProps {
  config: GithubConfig;
  onSave: (config: GithubConfig) => void;
  onBack: () => void;
}

const GithubSettingsView: React.FC<GithubSettingsViewProps> = ({ config, onSave, onBack }) => {
  const [localConfig, setLocalConfig] = useState<GithubConfig>({ ...config });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localConfig);
      // Brief delay for feedback
      setTimeout(() => {
        setIsSaving(false);
        onBack();
      }, 800);
    } catch (e) {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-black animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-2xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 bg-white/5 hover:bg-white/10 rounded-3xl text-zinc-400 transition-all active:scale-95">
            <ArrowLeft size={24}/>
          </button>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">GitHub <span className="text-pink-600">Terminal</span></h2>
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em] mt-1">Manual Repository Configuration</p>
          </div>
        </div>

        <div className="glass-tech p-8 md:p-10 rounded-[3rem] border-white/5 space-y-8 shadow-2xl">
          <div className="bg-pink-500/5 border border-pink-500/10 p-6 rounded-3xl flex gap-4">
            <AlertTriangle className="text-pink-500 shrink-0" size={20}/>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
              Eikhane manual GitHub details din. OAuth login kaj na korle ei setting ti APK create korar jonno use kora hobe. Token oboshoy <span className="text-pink-400 font-bold">'repo'</span> and <span className="text-pink-400 font-bold">'workflow'</span> access shoho hote hobe.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-widest flex items-center gap-2">
                <Key size={12}/> Personal Access Token (Classic)
              </label>
              <input 
                type="password"
                value={localConfig.token} 
                onChange={e => setLocalConfig({...localConfig, token: e.target.value})}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-pink-400 font-mono focus:border-pink-500/40 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-widest flex items-center gap-2">
                  <User size={12}/> Repository Owner
                </label>
                <input 
                  value={localConfig.owner} 
                  onChange={e => setLocalConfig({...localConfig, owner: e.target.value})}
                  placeholder="GitHub Username" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-pink-500/40 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-4 tracking-widest flex items-center gap-2">
                  <Folder size={12}/> Repository Name
                </label>
                <input 
                  value={localConfig.repo} 
                  onChange={e => setLocalConfig({...localConfig, repo: e.target.value})}
                  placeholder="oneclick-build-repo" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-pink-500/40 outline-none transition-all"
                />
              </div>
            </div>

            <button 
              onClick={handleSave} 
              disabled={isSaving || !localConfig.token || !localConfig.owner || !localConfig.repo}
              className="w-full py-5 bg-pink-600 rounded-2xl font-black uppercase text-sm shadow-xl shadow-pink-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSaving ? <span className="animate-pulse">Saving Connection...</span> : <><Save size={20}/> Connect GitHub Engine</>}
            </button>
          </div>
        </div>

        <div className="p-8 glass-tech rounded-[2.5rem] border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 text-green-500 rounded-2xl"><ShieldCheck size={24}/></div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Security Status</h4>
                <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">Token is stored securely in your private cloud stub.</p>
              </div>
           </div>
           <Github className="text-zinc-800" size={40}/>
        </div>

      </div>
    </div>
  );
};

export default GithubSettingsView;
