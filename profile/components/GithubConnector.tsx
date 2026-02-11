
import React from 'react';
import { Github, Link2, Search, XCircle, Code, CheckCircle2, Loader2 } from 'lucide-react';
import { GithubConfig } from '../../types';

interface GithubConnectorProps {
  githubConfig: GithubConfig;
  isConnected: boolean;
  repoLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredRepos: any[];
  onConnect: () => void;
  onDisconnect: () => void;
  onSelectRepo: (name: string) => void;
}

const GithubConnector: React.FC<GithubConnectorProps> = ({
  githubConfig, isConnected, repoLoading, searchQuery, setSearchQuery, 
  filteredRepos, onConnect, onDisconnect, onSelectRepo
}) => {
  return (
    <div className="glass-tech p-8 md:p-10 rounded-[2.5rem] border-white/5 space-y-8 shadow-xl relative">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3"><Github className="text-pink-500"/> GitHub <span className="text-pink-500">Auto-Link</span></h3>
        {isConnected ? (
          <button onClick={onDisconnect} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full border border-red-500/20 hover:bg-red-500/20 transition-all group">
            <XCircle size={12} className="text-red-400 group-hover:scale-110"/>
            <span className="text-[9px] font-black uppercase text-red-400">Disconnect @{githubConfig.owner}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
            <Link2 size={12} className="text-yellow-400"/>
            <span className="text-[9px] font-black uppercase text-yellow-400">Disconnected</span>
          </div>
        )}
      </div>

      {!isConnected ? (
        <div className="bg-pink-600/5 border border-pink-500/10 p-10 rounded-[2.5rem] text-center border-dashed">
          <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><Github size={32} className="text-pink-500"/></div>
          <p className="text-sm text-slate-400 font-medium mb-8">Connect your GitHub to sync code and build APKs automatically.</p>
          <button onClick={onConnect} className="px-10 py-5 bg-pink-600 rounded-full font-black uppercase text-xs shadow-xl flex items-center gap-3 mx-auto hover:scale-105 transition-all"><Github size={20}/> Link Account</button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
            <input type="text" placeholder="Search repositories..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none" />
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {repoLoading ? <div className="flex flex-col items-center py-10 text-pink-500 gap-3"><Loader2 className="animate-spin" size={24}/></div> : filteredRepos.map((repo: any) => (
              <div key={repo.id} onClick={() => onSelectRepo(repo.name)} className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${githubConfig.repo === repo.name ? 'bg-pink-600/20 border-pink-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${githubConfig.repo === repo.name ? 'bg-pink-600 text-white' : 'bg-white/10 text-slate-400'}`}><Code size={16}/></div>
                  <span className="text-xs font-bold block">{repo.name}</span>
                </div>
                {githubConfig.repo === repo.name && <CheckCircle2 size={16} className="text-pink-500"/>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GithubConnector;
