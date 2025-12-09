import { ArrowLeft, Share2, User, Copy } from 'lucide-react';
import type { Company } from '../types';

interface CompanyInfoProps {
  company: Company;
  onBack: () => void;
  onShare: () => void;
}

export const CompanyInfo = ({ company, onBack, onShare }: CompanyInfoProps) => {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="w-full md:w-80 bg-white border-r border-slate-200 overflow-y-auto z-10">
      <div className="p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Назад
        </button>
        <h1 className="text-xl font-bold text-slate-800 break-words">
          {company.name}
        </h1>
        <div className="flex gap-2 mt-3">
          <button
            onClick={onShare}
            className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
          >
            <Share2 size={14} /> Пакет
          </button>
          <button className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            Редагувати
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Директор
          </label>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <User size={14} />
            </div>
            <div className="text-sm font-medium text-slate-700">
              {company.director}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Контакти
          </label>
          <div className="space-y-3">
            <div className="flex justify-between items-center group">
              <span className="text-sm text-slate-600">{company.phone}</span>
              <button
                onClick={() => handleCopy(company.phone)}
                className="text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Copy size={14} />
              </button>
            </div>
            <div className="flex justify-between items-center group">
              <span className="text-sm text-slate-600 truncate max-w-[180px]">
                {company.email}
              </span>
              <button
                onClick={() => handleCopy(company.email)}
                className="text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Бухгалтерія
          </label>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="text-sm font-medium text-slate-700">
              {company.accountant}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Відповідальний за звітність
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
