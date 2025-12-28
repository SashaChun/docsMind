import { UploadCloud, FolderOpen, FileText, Share2, Edit, Trash2, Image, Film, File } from 'lucide-react';
import type { Document, CategoryType } from '../types';

interface DocumentsListProps {
  documents: Document[];
  activeCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
  onUpload: () => void;
  onShare: (doc: Document) => void;
  onView: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

const CATEGORIES = [
  { value: 'all' as const, label: 'Всі' },
  { value: 'statutory' as const, label: 'Установчі' },
  { value: 'tax' as const, label: 'Податкова' },
  { value: 'personal' as const, label: 'Особисті' },
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'tax':
      return 'bg-green-50 text-green-600';
    case 'statutory':
      return 'bg-purple-50 text-purple-600';
    default:
      return 'bg-blue-50 text-blue-600';
  }
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    return { icon: Image, color: 'text-pink-600 bg-pink-50' };
  }
  if (['webm', 'mp4', 'avi', 'mov'].includes(ext)) {
    return { icon: Film, color: 'text-purple-600 bg-purple-50' };
  }
  if (['pdf'].includes(ext)) {
    return { icon: FileText, color: 'text-red-600 bg-red-50' };
  }
  if (['doc', 'docx'].includes(ext)) {
    return { icon: FileText, color: 'text-blue-600 bg-blue-50' };
  }
  return { icon: File, color: 'text-slate-600 bg-slate-50' };
};

export const DocumentsList = ({
  documents,
  activeCategory,
  onCategoryChange,
  onUpload,
  onShare,
  onView,
  onEdit,
  onDelete,
}: DocumentsListProps) => {
  const filteredDocs =
    activeCategory === 'all'
      ? documents
      : documents.filter((d) => d.category === activeCategory);

  return (
    <div className="flex-1 bg-[#F8FAFC] flex flex-col h-full overflow-hidden">
      <div className="bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0">
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.value
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <button
          onClick={onUpload}
          className="w-10 h-10 md:w-auto md:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95 shrink-0 ml-4"
        >
          <UploadCloud size={18} /> <span className="hidden md:inline">Завантажити</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredDocs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <FolderOpen size={48} className="mb-4 opacity-30" />
            <p>У цій категорії немає документів</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative"
              >
                <div className="flex items-start gap-3 mb-3">
                  {(() => {
                    const fileInfo = getFileIcon(doc.name);
                    const IconComponent = fileInfo.icon;
                    return (
                      <div className={`p-2.5 rounded-lg ${fileInfo.color}`}>
                        <IconComponent size={20} />
                      </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-medium text-slate-800 truncate"
                      title={doc.name}
                    >
                      {doc.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(doc.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 pt-3 border-t border-slate-50">
                  <button
                    onClick={() => onView(doc)}
                    className="flex-1 py-1.5 rounded-md text-xs font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Перегляд
                  </button>
                  <button
                    onClick={() => onEdit(doc)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-1"
                    title="Редагувати документ"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => onShare(doc)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1"
                    title="Поділитись документом"
                  >
                    <Share2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Видалити документ "${doc.name}"?`)) {
                        onDelete(doc);
                      }
                    }}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1"
                    title="Видалити документ"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
