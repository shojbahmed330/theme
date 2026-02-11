
import React from 'react';
import { LayoutDashboard, Code2, FolderKanban, ShoppingCart, User as UserIcon } from 'lucide-react';
import { AppMode } from '../types';

interface MobileNavProps {
  path: string;
  mode: AppMode;
  navigateTo: (path: string, mode: AppMode) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ path, mode, navigateTo }) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around p-4 z-50">
      <button 
        onClick={() => navigateTo('/dashboard', AppMode.PREVIEW)} 
        className={`p-3 transition-all rounded-2xl ${path === '/dashboard' && mode !== AppMode.EDIT ? 'text-pink-500 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.2)]' : 'text-zinc-600'}`}
      >
        <LayoutDashboard size={22}/>
      </button>
      <button 
        onClick={() => navigateTo('/dashboard', AppMode.EDIT)} 
        className={`p-3 transition-all rounded-2xl ${path === '/dashboard' && mode === AppMode.EDIT ? 'text-pink-500 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.2)]' : 'text-zinc-600'}`}
      >
        <Code2 size={22}/>
      </button>
      <button 
        onClick={() => navigateTo('/projects', AppMode.PROJECTS)} 
        className={`p-3 transition-all rounded-2xl ${path === '/projects' ? 'text-pink-500 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.2)]' : 'text-zinc-600'}`}
      >
        <FolderKanban size={22}/>
      </button>
      <button 
        onClick={() => navigateTo('/shop', AppMode.SHOP)} 
        className={`p-3 transition-all rounded-2xl ${path === '/shop' ? 'text-pink-500 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.2)]' : 'text-zinc-600'}`}
      >
        <ShoppingCart size={22}/>
      </button>
      <button 
        onClick={() => navigateTo('/profile', AppMode.PROFILE)} 
        className={`p-3 transition-all rounded-2xl ${path === '/profile' ? 'text-pink-500 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.2)]' : 'text-zinc-600'}`}
      >
        <UserIcon size={22}/>
      </button>
    </div>
  );
};

export default MobileNav;
