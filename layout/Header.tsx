
import React from 'react';
import { Sparkles, Crown, Settings } from 'lucide-react';
import { AppMode, User } from '../types';

interface HeaderProps {
  user: User;
  path: string;
  mode: AppMode;
  navigateTo: (path: string, mode: AppMode) => void;
}

const Header: React.FC<HeaderProps> = ({ user, path, mode, navigateTo }) => {
  const navItems = [
    { label: 'PREVIEW', mode: AppMode.PREVIEW, path: '/dashboard' },
    { label: 'EDIT', mode: AppMode.EDIT, path: '/dashboard' },
    { label: 'PROJECTS', mode: AppMode.PROJECTS, path: '/projects' },
    { label: 'SHOP', mode: AppMode.SHOP, path: '/shop' },
    { label: 'PROFILE', mode: AppMode.PROFILE, path: '/profile' },
  ];

  return (
    <header className="h-16 md:h-20 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 z-50">
      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('/dashboard', AppMode.PREVIEW)}>
        <div className="relative">
          <Sparkles className="text-pink-500 relative z-10" size={26}/>
          <div className="absolute inset-0 bg-pink-500/20 blur-lg rounded-full animate-pulse"></div>
        </div>
        <span className="font-black text-sm uppercase tracking-[0.2em] flex flex-col md:flex-row md:gap-1">
          <span className="text-white">OneClick</span>
          <span className="text-pink-500">Studio</span>
        </span>
      </div>
      
      <nav className="hidden lg:flex bg-white/5 rounded-2xl p-1 items-center gap-1 border border-white/5 shadow-inner">
        {navItems.map((m) => (
          <button 
            key={m.label} 
            onClick={() => navigateTo(m.path, m.mode)} 
            className={`px-5 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all duration-300 ${((path === m.path && mode === m.mode)) ? 'nav-active bg-pink-600 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
          >
            {m.label}
          </button>
        ))}
        {user.isAdmin && (
          <button 
            onClick={() => navigateTo('/admin', AppMode.ADMIN)} 
            className={`px-5 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all flex items-center gap-2 border-l border-white/10 ml-2 ${path === '/admin' ? 'bg-pink-600 text-white' : 'text-pink-500 hover:bg-pink-500/5'}`}
          >
            <Crown size={12}/> 
            ADMIN HQ
          </button>
        )}
      </nav>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigateTo('/dashboard', AppMode.SETTINGS)}
          className={`p-2.5 rounded-xl border border-white/5 transition-all ${mode === AppMode.SETTINGS ? 'bg-pink-600 text-white' : 'bg-black/40 text-zinc-500 hover:text-white'}`}
          title="GitHub Settings"
        >
          <Settings size={20} />
        </button>
        <div className="px-5 py-2.5 bg-black/40 border border-white/5 rounded-2xl text-[11px] font-black text-pink-500 shadow-sm uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899]"></div>
          {user.tokens} Tokens
        </div>
      </div>
    </header>
  );
};

export default Header;
