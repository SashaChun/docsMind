import { FolderOpen, FileText, Download, Eye } from 'lucide-react';
import type { SharedData } from '../types';

interface SharedViewProps {
  sharedData: SharedData | null;
  onExit: () => void;
}

export const SharedView = ({ sharedData, onExit }: SharedViewProps) => {
  if (!sharedData) return null;

  const isFolder = sharedData.type === 'folder';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">
            {sharedData.companyName[0]}
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Secure Doc Share
            </h1>
            <p className="text-xs text-slate-500">Надано: {sharedData.companyName}</p>
          </div>
        </div>
        <button
          onClick={onExit}
          className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full text-slate-600"
        >
          (Demo: Повернутись в адмінку)
        </button>
      </div>

      <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {isFolder ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <FolderOpen size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Пакет документів
              </h2>
              <p className="text-slate-500 mb-6">
                {sharedData.items?.length || 0} файлів доступно для завантаження
              </p>
              <div className="text-left space-y-2 max-w-md mx-auto">
                {sharedData.items?.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all cursor-pointer group"
                  >
                    <FileText className="text-blue-500" size={20} />
                    <span className="flex-1 text-slate-700 font-medium group-hover:text-blue-700">
                      {doc.name}
                    </span>
                    <Download
                      size={16}
                      className="text-slate-300 group-hover:text-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-0">
              <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-50 rounded-xl text-red-500">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {sharedData.item?.name}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                      {sharedData.item?.category} • Завантажено{' '}
                      {sharedData.item?.date
                        ? new Date(sharedData.item.date).toLocaleDateString()
                        : ''}
                    </p>
                  </div>
                </div>
                <button className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-2">
                  <Download size={16} /> Завантажити
                </button>
              </div>
              <div className="bg-slate-100 h-96 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Eye size={48} className="mx-auto mb-2 opacity-20" />
                  <p>Попередній перегляд документу</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
