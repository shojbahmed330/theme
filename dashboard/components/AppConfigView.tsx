
import React, { useState, useRef } from 'react';
import { ArrowLeft, Box, Image as ImageIcon, Smartphone, Globe, Database, Terminal, ShieldCheck, Lock, Cpu, Server, ShieldAlert, Zap } from 'lucide-react';
import { ProjectConfig } from '../../types';

interface AppConfigViewProps {
  config: ProjectConfig;
  onUpdate: (config: ProjectConfig) => void;
  onBack: () => void;
}

const AppConfigView: React.FC<AppConfigViewProps> = ({ config, onUpdate, onBack }) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'backend' | 'logic'>('identity');
  const iconInputRef = useRef<HTMLInputElement>(null);
  const splashInputRef = useRef<HTMLInputElement>(null);

  const updateDb = (fields: any) => {
    onUpdate({
      ...config,
      dbConfig: {
        provider: config.dbConfig?.provider || 'none',
        ...config.dbConfig,
        ...fields
      }
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-[#050108] animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-4 bg-white/5 hover:bg-white/10 rounded-3xl text-zinc-400 transition-all active:scale-95">
              <ArrowLeft size={24}/>
            </button>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">System <span className="text-pink-600">Core</span></h2>
              <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em] mt-1">Managed Backend & Logic Engine</p>
            </div>
          </div>
          
          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 shadow-2xl">
            {[
              { id: 'identity', icon: Globe, label: 'Identity' },
              { id: 'backend', icon: Database, label: 'Database' },
              { id: 'logic', icon: ShieldCheck, label: 'Security' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'text-zinc-500 hover:text-white'}`}
              >
                <tab.icon size={14}/> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* --- Identity Tab --- */}
        {activeTab === 'identity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-left-4 duration-500">
             <div className="glass-tech p-8 rounded-[3rem] border-white/5 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl"><Globe size={20}/></div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">App Identity</h3>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 ml-4 tracking-widest">Display Name</label>
                    <input value={config.appName} onChange={e => onUpdate({...config, appName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-pink-500/40 outline-none" placeholder="My Hybrid App" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 ml-4 tracking-widest">Package Identity</label>
                    <input value={config.packageName} onChange={e => onUpdate({...config, packageName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-mono text-pink-400 focus:border-pink-500/40 outline-none" placeholder="com.company.app" />
                  </div>
                </div>
             </div>

             <div className="glass-tech p-8 rounded-[3rem] border-white/5 flex flex-col justify-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-pink-500/10 text-pink-500 rounded-2xl"><Box size={20}/></div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Branding Assets</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => iconInputRef.current?.click()} className="p-6 bg-white/5 border border-dashed border-white/10 rounded-3xl flex flex-col items-center gap-3 hover:bg-white/10 transition-all group">
                      {config.icon ? <img src={config.icon} className="w-10 h-10 rounded-xl" /> : <ImageIcon size={20} className="text-zinc-600 group-hover:text-pink-500"/>}
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 text-center">App Icon</span>
                      <input type="file" ref={iconInputRef} className="hidden" accept="image/*" onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => onUpdate({...config, icon: reader.result as string});
                            reader.readAsDataURL(file);
                         }
                      }} />
                   </button>
                   <button onClick={() => splashInputRef.current?.click()} className="p-6 bg-white/5 border border-dashed border-white/10 rounded-3xl flex flex-col items-center gap-3 hover:bg-white/10 transition-all group">
                      {config.splash ? <img src={config.splash} className="w-7 h-10 rounded-lg" /> : <Smartphone size={20} className="text-zinc-600 group-hover:text-amber-500"/>}
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 text-center">Splash View</span>
                      <input type="file" ref={splashInputRef} className="hidden" accept="image/*" onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => onUpdate({...config, splash: reader.result as string});
                            reader.readAsDataURL(file);
                         }
                      }} />
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* --- Backend Tab (Database Bridge) --- */}
        {activeTab === 'backend' && (
          <div className="glass-tech p-10 rounded-[3rem] border-pink-500/10 bg-gradient-to-br from-pink-500/5 to-transparent animate-in slide-in-from-right-4 duration-500">
             <div className="flex items-center gap-4 mb-10">
               <div className="p-3 bg-pink-500/10 text-pink-500 rounded-2xl"><Database size={20}/></div>
               <h3 className="text-sm font-black uppercase tracking-widest text-white">Managed Database Bridge</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 ml-2 tracking-widest">Provider Selection</label>
                    <select 
                      value={config.dbConfig?.provider || 'none'} 
                      onChange={e => updateDb({ provider: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none appearance-none cursor-pointer"
                    >
                      <option value="none">Disabled (Standalone Mode)</option>
                      <option value="supabase">Supabase Cloud (Recommended)</option>
                      <option value="firebase">Google Firebase</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 ml-2 tracking-widest">Project Endpoint URL</label>
                    <input 
                      value={config.dbConfig?.supabaseUrl || ''} 
                      onChange={e => updateDb({ supabaseUrl: e.target.value })}
                      placeholder="https://your-project.supabase.co" 
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-pink-500/40 font-mono" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 ml-2 tracking-widest">Public Anon API Key</label>
                    <input 
                      type="password"
                      value={config.dbConfig?.supabaseKey || ''} 
                      onChange={e => updateDb({ supabaseKey: e.target.value })}
                      placeholder="eyJhbGciOiJIUzI1Ni..." 
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-pink-400 outline-none focus:border-pink-500/40" 
                    />
                  </div>
                </div>
                <div className="p-8 bg-pink-500/5 rounded-[2.5rem] border border-pink-500/10 flex flex-col items-center justify-center text-center gap-4">
                   <div className="w-16 h-16 bg-pink-500/10 rounded-3xl flex items-center justify-center text-pink-500 shadow-2xl animate-pulse">
                      <Zap size={32}/>
                   </div>
                   <div className="space-y-2">
                     <p className="text-xs font-black text-white uppercase tracking-tight">AI Backend Uplink</p>
                     <p className="text-[10px] font-bold text-zinc-600 uppercase leading-relaxed max-w-[220px] mx-auto">
                       Once connected, AI will automatically generate table schemas and secure sync logic using your private keys.
                     </p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* --- Security & Logic Tab --- */}
        {activeTab === 'logic' && (
          <div className="space-y-8 animate-in zoom-in duration-500">
             {/* Two-in-One Auth Gateway */}
             <div className="glass-tech p-10 rounded-[3rem] border-green-500/10 bg-gradient-to-br from-green-500/5 to-transparent">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-4">
                     <div className="p-3 bg-green-500/10 text-green-500 rounded-2xl"><Lock size={20}/></div>
                     <h3 className="text-sm font-black uppercase tracking-widest text-white">Auth Gateway & Role Control</h3>
                   </div>
                   <button 
                    onClick={() => updateDb({ enableAuth: !config.dbConfig?.enableAuth })}
                    className={`w-14 h-8 rounded-full transition-all relative ${config.dbConfig?.enableAuth ? 'bg-green-500' : 'bg-zinc-800'}`}
                   >
                     <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-md ${config.dbConfig?.enableAuth ? 'left-7' : 'left-1'}`}></div>
                   </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className={`p-6 rounded-2xl border transition-all ${config.dbConfig?.enableAuth ? 'bg-white/5 border-green-500/20' : 'bg-black/20 border-white/5 opacity-50'}`}>
                      <ShieldCheck className="text-green-500 mb-3" size={20}/>
                      <h4 className="text-[10px] font-black uppercase text-white mb-1">Protected Screens</h4>
                      <p className="text-[9px] font-bold text-zinc-600 uppercase">Redirect unauthorized guests</p>
                   </div>
                   <div className={`p-6 rounded-2xl border transition-all ${config.dbConfig?.enableAuth ? 'bg-white/5 border-green-500/20' : 'bg-black/20 border-white/5 opacity-50'}`}>
                      <Server className="text-blue-500 mb-3" size={20}/>
                      <h4 className="text-[10px] font-black uppercase text-white mb-1">Session Bridge</h4>
                      <p className="text-[9px] font-bold text-zinc-600 uppercase">Persistent cloud login</p>
                   </div>
                   <div className={`p-6 rounded-2xl border transition-all ${config.dbConfig?.enableAuth ? 'bg-white/5 border-green-500/20' : 'bg-black/20 border-white/5 opacity-50'}`}>
                      <ShieldAlert className="text-amber-500 mb-3" size={20}/>
                      <h4 className="text-[10px] font-black uppercase text-white mb-1">Admin Panel Access</h4>
                      <p className="text-[9px] font-bold text-zinc-600 uppercase">Hidden dashboard toggle</p>
                   </div>
                </div>
             </div>

             {/* Secure Serverless Rule Engine */}
             <div className="glass-tech p-10 rounded-[3rem] border-pink-500/10">
                <div className="flex items-center gap-4 mb-6">
                   <div className="p-3 bg-pink-500/10 text-pink-500 rounded-2xl"><Cpu size={20}/></div>
                   <h3 className="text-sm font-black uppercase tracking-widest text-white">Secure Serverless Rules</h3>
                </div>
                
                <div className="space-y-4">
                   <div className="p-4 bg-pink-500/5 rounded-2xl border border-pink-500/10">
                      <p className="text-[10px] font-bold text-pink-400 uppercase leading-relaxed">
                        Define your business logic and security protocols below. 
                        <br/>AI will translate these into secure backend functions inside your app code.
                      </p>
                   </div>
                   <textarea 
                      value={config.dbConfig?.serverlessRules || ''} 
                      onChange={e => updateDb({ serverlessRules: e.target.value })}
                      placeholder="e.g. 'Users must provide a valid email', 'Admins can delete orders', 'Calculate 10% tax on checkout'..."
                      className="w-full h-48 bg-black/40 border border-white/5 rounded-[2.5rem] p-8 text-xs text-white outline-none focus:border-pink-500/40 resize-none font-medium leading-relaxed custom-scrollbar"
                   />
                </div>
             </div>
          </div>
        )}

        {/* Save & Deploy Button */}
        <div className="flex justify-center pt-6">
           <button onClick={onBack} className="px-16 py-6 bg-gradient-to-r from-pink-600 to-pink-500 rounded-[2.5rem] font-black uppercase text-xs text-white shadow-[0_20px_40px_rgba(236,72,153,0.3)] hover:scale-105 transition-all active:scale-95 flex items-center gap-4 tracking-widest ring-1 ring-white/10">
              <ShieldCheck size={20}/> Deploy To Cloud
           </button>
        </div>

      </div>
    </div>
  );
};

export default AppConfigView;
