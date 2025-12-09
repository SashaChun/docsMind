import { Box, LayoutGrid, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Company } from '../types';

interface SidebarProps {
  companies: Company[];
  selectedCompanyId: number | null;
  onSelectCompany: (id: number | null) => void;
  onLogout: () => void;
}

export const Sidebar = ({
  companies,
  selectedCompanyId,
  onSelectCompany,
  onLogout,
}: SidebarProps) => {
  const navigate = useNavigate();
  return (
    <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-slate-900 text-white p-2 rounded-lg">
          <Box size={20} />
        </div>
        <span className="font-bold text-lg text-slate-800 hidden lg:block">
          CorpVault
        </span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <div
          onClick={() => onSelectCompany(null)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${
            !selectedCompanyId
              ? 'bg-blue-50 text-blue-600'
              : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <LayoutGrid size={20} />
          <span className="hidden lg:block font-medium">Всі компанії</span>
        </div>

        <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase hidden lg:block">
          Останні
        </div>

        {companies.slice(0, 3).map((c) => (
          <div
            key={c.id}
            onClick={() => onSelectCompany(c.id)}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
              selectedCompanyId === c.id
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            <span className="hidden lg:block truncate text-sm">{c.name}</span>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors px-4 py-2 mb-1 w-full"
        >
          <User size={18} />
          <span className="hidden lg:block text-sm font-medium">Профіль</span>
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 text-slate-500 hover:text-red-500 transition-colors px-4 py-2"
        >
          <LogOut size={18} />
          <span className="hidden lg:block text-sm font-medium">Вийти</span>
        </button>
      </div>
    </aside>
  );
};
