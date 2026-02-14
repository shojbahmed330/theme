
import React, { useState, useEffect } from 'react';
import { LogOut, Loader2, AlertCircle, Key, Github, Zap, ExternalLink, Settings, ShieldAlert } from 'lucide-react';
import { User as UserType, Transaction, GithubConfig } from '../types.ts';
import { DatabaseService } from '../services/dbService.ts';
import { GithubService } from '../services/githubService.ts';

// Component Imports
import ProfileHeader from './components/ProfileHeader.tsx';
import GithubConnector from './components/GithubConnector.tsx';
import ProfileStats from './components/ProfileStats.tsx';
import TransactionHistory from './components/TransactionHistory.tsx';
import SecuritySettings from './components/SecuritySettings.tsx';

interface ProfileViewProps {
  user: UserType;
  userTransactions: Transaction[];
  oldPassword: string;
  setOldPassword: (p: string) => void;
  newPass: string;
  setNewPass: (p: string) => void;
  passError: string;
  isUpdatingPass: boolean;
  handlePasswordChange: () => void;
  handleLogout: () => void;
  handleAvatarUpload: () => void;
  githubConfig: GithubConfig;
  onSaveGithubConfig: (config: GithubConfig) => void;
  clearGithubConfig: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = (props) => {
  const [repos, setRepos] = useState<any[]>([]);
  const [repoLoading, setRepoLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [linkingError, setLinkingError] = useState<{ type: 'disabled' | 'exists', message: string } | null>(null);
  
  const isConnected = !!(props.githubConfig.token && props.githubConfig.owner);
  const db = DatabaseService.getInstance();
  const github = new GithubService();

  useEffect(() => {
    if (props.githubConfig.token) fetchRepos(props.githubConfig.token);
  }, [props.githubConfig.token]);

  const fetchRepos = async (token: string) => {
    setRepoLoading(true);
    try {
      const data = await github.listRepos(token);
      setRepos(Array.isArray(data) ? data : []);
    } catch (e) { setRepos([]); } finally { setRepoLoading(false); }
  };

  const handleConnectGithub = async () => {
    setIsLinking(true);
    setLinkingError(null);
    try { 
      await db.linkGithubIdentity(); 
    } catch (e: any) { 
      setIsLinking(false);
      if (e.message.includes('Manual linking is disabled')) {
        setLinkingError({ type: 'disabled', message: "Manual Link অপশনটি আপনার সুপাবেজ ড্যাশবোর্ডে অফ করা আছে।" });
      } else if (e.message.includes('identity_already_exists') || e.message.includes('already linked')) {
        setLinkingError({ type: 'exists', message: "এই গিটহাব অ্যাকাউন্টটি ইতিমধ্যে অন্য একটি প্রোফাইলের সাথে যুক্ত আছে।" });
      } else {
        alert(e.message || "গিটহাব কানেক্ট করতে সমস্যা হচ্ছে।"); 
      }
    }
  };

  const handleFallbackOAuth = async () => {
    setIsLinking(true);
    try {
      await db.signInWithOAuth('github');
    } catch (e: any) {
      alert(e.message);
      setIsLinking(false);
    }
  };

  const filteredRepos = repos.filter(r => r.name && r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto scroll-smooth">
       <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 pb-20">
          <ProfileHeader user={props.user} onAvatarUpload={props.handleAvatarUpload} />
          
          <div className="relative">
            {isLinking && (
              <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-[2.5rem]">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-pink-500" size={40}/>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Redirecting to GitHub...</span>
                </div>
              </div>
            )}

            {linkingError && (
              <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-[2.5rem] mb-6 flex flex-col items-center text-center gap-6 animate-in zoom-in">
                 <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                   {linkingError.type === 'exists' ? <ShieldAlert size={32} className="text-red-500"/> : <AlertCircle size={32} className="text-amber-500"/>}
                 </div>
                 
                 <div className="space-y-2">
                   <h4 className="text-xl font-black text-white uppercase tracking-tight">
                     {linkingError.type === 'exists' ? 'Identity Already Linked' : 'Configuration Required'}
                   </h4>
                   <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                     {linkingError.type === 'exists' 
                        ? "আপনি যে গিটহাব অ্যাকাউন্টটি লিঙ্ক করতে চাচ্ছেন, সেটি অন্য একটি অ্যাকাউন্টে ব্যবহৃত হচ্ছে। দয়া করে সেই অ্যাকাউন্টে লগইন করে গিটহাব ডিসকানেক্ট করুন, অথবা ম্যানুয়াল টোকেন ব্যবহার করুন।" 
                        : "ম্যানুয়াল অ্যাকাউন্ট লিঙ্কিং অপশনটি প্রোভাইডার পেজে নয়, বরং Authentication -> Settings -> External Providers সেকশনে পাবেন। অথবা নিচের বাটনগুলো ব্যবহার করুন:"}
                   </p>
                 </div>

                 <div className="flex flex-wrap justify-center gap-4 w-full px-4">
                   <button 
                    onClick={handleFallbackOAuth}
                    className="flex-1 min-w-[140px] py-4 bg-pink-600 rounded-2xl text-[10px] font-black uppercase text-white flex items-center justify-center gap-2 shadow-lg shadow-pink-600/20 hover:scale-105 transition-all"
                   >
                     <Zap size={14}/> GitHub Sign In
                   </button>
                   
                   <button 
                    onClick={() => window.open('https://github.com/settings/tokens', '_blank')}
                    className="flex-1 min-w-[140px] py-4 bg-zinc-800 rounded-2xl text-[10px] font-black uppercase text-white flex items-center justify-center gap-2 border border-white/5 hover:bg-zinc-700 transition-all"
                   >
                     <Key size={14}/> Manual Token
                   </button>
                 </div>

                 <button onClick={() => setLinkingError(null)} className="text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors">Dismiss</button>
              </div>
            )}

            <GithubConnector 
              githubConfig={props.githubConfig} isConnected={isConnected} 
              repoLoading={repoLoading} searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} filteredRepos={filteredRepos} 
              onConnect={handleConnectGithub} onDisconnect={props.clearGithubConfig} 
              onSelectRepo={(name) => props.onSaveGithubConfig({ ...props.githubConfig, repo: name })} 
            />
          </div>

          <ProfileStats user={props.user} />
          <TransactionHistory transactions={props.userTransactions} />
          
          <SecuritySettings 
            oldPassword={props.oldPassword} setOldPassword={props.setOldPassword}
            newPass={props.newPass} setNewPass={props.setNewPass}
            passError={props.passError} isUpdating={props.isUpdatingPass}
            onUpdate={props.handlePasswordChange}
          />

          <button onClick={props.handleLogout} className="w-full py-6 bg-red-600/10 border border-red-600/20 text-red-500 rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-3 hover:bg-red-600 hover:text-white transition-all">
             <LogOut size={20}/> টার্মিনাল থেকে প্রস্থান করুন
          </button>
       </div>
    </div>
  );
};

export default ProfileView;
