
import React from 'react';
import { Sparkles, Shield, Crown } from 'lucide-react';
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
          <div className="absolute inset-0 bg-pink-500/30 blur-xl rounded-full logo-glow-effect"></div>
        </div>
        <span className="font-black text-sm uppercase tracking-[0.2em]">
          <span className="text-white">OneClick</span>
          <span className="text-pink-600 ml-1">Studio</span>
        </span>
      </div>
      
      <nav className="hidden lg:flex bg-white/5 rounded-2xl p-1.5 border border-white/5 items-center gap-1">
        {navItems.map((m) => (
          <button 
            key={m.label} 
            onClick={() => navigateTo(m.path, m.mode)} 
            className={`px-6 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${((path === m.path && mode === m.mode)) ? 'active-nav-pink' : 'text-zinc-500 hover:text-white'}`}
          >
            {m.label}
          </button>
        ))}
        {user.isAdmin && (
          <button 
            onClick={() => navigateTo('/admin', AppMode.ADMIN)} 
            className={`px-6 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all flex items-center gap-2 border-l border-white/10 ml-2 ${path === '/admin' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20' : 'text-amber-500 hover:bg-amber-500/10'}`}
          >
            <Crown size={12} className={path === '/admin' ? 'animate-bounce' : ''}/> 
            ADMIN HQ
          </button>
        )}
      </nav>
      
      <div className="flex items-center gap-4">
        <div className="px-5 py-2.5 bg-pink-500/10 border border-pink-500/30 rounded-xl text-[11px] font-black text-white shadow-[0_0_20px_rgba(236,72,153,0.15)] uppercase tracking-widest">
          {user.tokens} Tokens
        </div>
      </div>
    </header>
  );
};

export default Header;
