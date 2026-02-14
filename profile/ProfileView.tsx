
import React, { useState, useEffect } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
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
    try { 
      await db.linkGithubIdentity(); 
    } catch (e: any) { 
      alert(e.message || "গিটহাব কানেক্ট করতে সমস্যা হচ্ছে।"); 
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
