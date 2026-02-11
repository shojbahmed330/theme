
import React from 'react';
import { Search, Coins } from 'lucide-react';
import { User as UserType } from '../../types';

interface UserTableProps {
  users: UserType[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setEditingUser: (user: UserType) => void;
  setNewTokenCount: (count: number) => void;
  handleBanToggle: (uid: string, email: string, status: boolean) => void;
}

const UserTable: React.FC<UserTableProps> = ({ 
  users, searchQuery, setSearchQuery, setEditingUser, setNewTokenCount, handleBanToggle 
}) => {
  const filtered = users.filter(u => u.email.includes(searchQuery));

  return (
    <div className="space-y-6">
      <div className="glass-tech rounded-2xl p-4 border-white/5 flex items-center gap-4">
        <Search className="text-slate-500" size={20}/>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search member by email or name..." className="flex-1 bg-transparent outline-none text-sm" />
      </div>
      <div className="glass-tech rounded-[2.5rem] overflow-hidden border-white/5">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/5 text-pink-500 font-black uppercase"><tr><th className="p-6">Member</th><th className="p-6">Credits</th><th className="p-6">Status</th><th className="p-6">Control</th></tr></thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-white/5">
                <td className="p-6"><div className="flex items-center gap-3"><img src={u.avatar_url} className="w-10 h-10 rounded-xl" /><div><div className="font-black text-white">{u.name}</div><div className="opacity-50 text-[10px]">{u.email}</div></div></div></td>
                <td className="p-6"><div className="flex items-center gap-3"><span className="font-mono text-pink-400 font-black text-lg">{u.tokens}</span><button onClick={() => { setEditingUser(u); setNewTokenCount(u.tokens); }} className="p-2 bg-white/5 rounded-lg text-pink-400"><Coins size={14}/></button></div></td>
                <td className="p-6">{u.is_banned ? <span className="text-red-500 font-bold uppercase text-[10px]">Suspended</span> : <span className="text-green-400 font-bold uppercase text-[10px]">Clear</span>}</td>
                <td className="p-6"><button onClick={() => handleBanToggle(u.id, u.email, u.is_banned || false)} className={`px-4 py-2 rounded-xl font-black uppercase text-[10px] ${u.is_banned ? 'bg-green-600' : 'bg-red-600/20 text-red-500 border border-red-500/20'}`}>{u.is_banned ? 'Unsuspend' : 'Terminate'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
