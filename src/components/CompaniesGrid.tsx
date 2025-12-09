import { Plus, ChevronRight } from 'lucide-react';
import type { Company, Document } from '../types';

interface CompaniesGridProps {
  companies: Company[];
  documents: Document[];
  onSelectCompany: (id: number) => void;
  onAddCompany: () => void;
}

export const CompaniesGrid = ({
  companies,
  documents,
  onSelectCompany,
  onAddCompany,
}: CompaniesGridProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Компанії</h1>
          <p className="text-slate-500">
            Оберіть компанію для роботи з документами
          </p>
        </div>
        <button
          onClick={onAddCompany}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-slate-200 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={18} /> Нова компанія
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div
            key={company.id}
            onClick={() => onSelectCompany(company.id)}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-blue-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {company.name[0]}
              </div>
              <div className="bg-slate-50 text-slate-600 text-xs px-2 py-1 rounded font-mono">
                {company.edrpou}
              </div>
            </div>

            <h3 className="font-bold text-slate-800 text-lg mb-1">
              {company.name}
            </h3>
            <p className="text-sm text-slate-500 mb-4">{company.director}</p>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                {documents.filter((d) => d.companyId === company.id).length}{' '}
                документів
              </div>
              <div className="text-blue-600 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Відкрити <ChevronRight size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
