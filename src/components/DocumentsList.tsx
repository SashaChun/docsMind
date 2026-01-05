import { useState } from 'react';
import { UploadCloud, FolderOpen, FileText, Share2, Edit, Trash2, Image, Film, File, Folder, ChevronDown, ChevronRight, FolderPlus, Check, X } from 'lucide-react';
import type { Document, CategoryType, Folder as FolderType } from '../types';

interface DocumentsListProps {
  documents: Document[];
  folders?: FolderType[];
  activeCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
  onUpload: () => void;
  onShare: (doc: Document) => void;
  onShareFolder?: (folder: FolderType) => void;
  onShareMultiple?: (docs: Document[]) => void;
  onView: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onDeleteFolder?: (folder: FolderType) => void;
  onMoveToFolder?: (documentId: number, folderId: number | null) => void;
  onCreateFolder?: (name: string, category: string) => void;
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

const isEditableFile = (doc: Document) => {
  // Перевіряємо по mimeType
  if (doc.mimeType) {
    const editableMimeTypes = [
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    return editableMimeTypes.includes(doc.mimeType);
  }

  // Fallback - перевіряємо по розширенню файлу
  const fileName = doc.fileName || doc.name;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return ['txt', 'doc', 'docx'].includes(ext);
};

export const DocumentsList = ({
  documents,
  folders = [],
  activeCategory,
  onCategoryChange,
  onUpload,
  onShare,
  onShareFolder,
  onShareMultiple,
  onView,
  onEdit,
  onDelete,
  onDeleteFolder,
  onMoveToFolder,
  onCreateFolder,
}: DocumentsListProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [draggedDocId, setDraggedDocId] = useState<number | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const filteredDocs =
    activeCategory === 'all'
      ? documents
      : documents.filter((d) => d.category === activeCategory);

  const filteredFolders =
    activeCategory === 'all'
      ? folders
      : folders.filter((f) => f.category === activeCategory);

  // Документи без папки
  const standaloneDocuments = filteredDocs.filter(d => !d.folderId);

  // Групуємо документи по папках
  const documentsByFolder = new Map<number, Document[]>();
  filteredDocs.forEach(doc => {
    if (doc.folderId) {
      const existing = documentsByFolder.get(doc.folderId) || [];
      existing.push(doc);
      documentsByFolder.set(doc.folderId, existing);
    }
  });

  const toggleFolder = (folderId: number) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, docId: number) => {
    setDraggedDocId(docId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', docId.toString());
  };

  const handleDragEnd = () => {
    setDraggedDocId(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (e: React.DragEvent, folderId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = (e: React.DragEvent, folderId: number) => {
    e.preventDefault();
    const docId = parseInt(e.dataTransfer.getData('text/plain'));
    if (docId && onMoveToFolder) {
      onMoveToFolder(docId, folderId);
    }
    setDraggedDocId(null);
    setDragOverFolderId(null);
  };

  const handleDropToRoot = (e: React.DragEvent) => {
    e.preventDefault();
    const docId = parseInt(e.dataTransfer.getData('text/plain'));
    if (docId && onMoveToFolder) {
      onMoveToFolder(docId, null);
    }
    setDraggedDocId(null);
    setDragOverFolderId(null);
  };

  // Selection handlers
  const toggleDocSelection = (docId: number) => {
    setSelectedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const handleShareSelected = () => {
    if (onShareMultiple && selectedDocs.size > 0) {
      const docsToShare = documents.filter(d => selectedDocs.has(d.id));
      onShareMultiple(docsToShare);
      setSelectedDocs(new Set());
      setIsSelectionMode(false);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim() && onCreateFolder) {
      const category = activeCategory === 'all' ? 'personal' : activeCategory;
      onCreateFolder(newFolderName.trim(), category);
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  const renderDocumentCard = (doc: Document, inFolder = false) => {
    const isDragging = draggedDocId === doc.id;
    const isSelected = selectedDocs.has(doc.id);

    return (
      <div
        key={doc.id}
        draggable={!isSelectionMode}
        onDragStart={(e) => handleDragStart(e, doc.id)}
        onDragEnd={handleDragEnd}
        className={`bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-all group relative ${inFolder ? 'ml-4' : ''} ${
          isDragging ? 'opacity-50 border-blue-400 border-2' : 'border-slate-100'
        } ${isSelected ? 'ring-2 ring-blue-500' : ''} cursor-grab active:cursor-grabbing`}
      >
        {isSelectionMode && (
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDocSelection(doc.id);
              }}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-300 hover:border-blue-400'
              }`}
            >
              {isSelected && <Check size={14} />}
            </button>
          </div>
        )}
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
              {new Date(doc.createdAt).toLocaleDateString()}
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
          {isEditableFile(doc) && (
            <button
              onClick={() => onEdit(doc)}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-1"
              title="Редагувати документ"
            >
              <Edit size={14} />
            </button>
          )}
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
    );
  };

  const renderFolderCard = (folder: FolderType) => {
    const folderDocs = documentsByFolder.get(folder.id) || [];
    const isExpanded = expandedFolders.has(folder.id);
    const isDragOver = dragOverFolderId === folder.id;

    return (
      <div key={`folder-${folder.id}`} className="space-y-2">
        <div
          className={`bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${
            isDragOver ? 'border-blue-500 border-2 bg-blue-50' : 'border-slate-100'
          }`}
          onClick={() => toggleFolder(folder.id)}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-lg ${isDragOver ? 'bg-blue-100 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
              <Folder size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown size={16} className="text-slate-400" />
                ) : (
                  <ChevronRight size={16} className="text-slate-400" />
                )}
                <h4
                  className="font-medium text-slate-800 truncate"
                  title={folder.name}
                >
                  {folder.name}
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {folderDocs.length} файлів • {new Date(folder.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-1">
              {onShareFolder && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShareFolder(folder);
                  }}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1"
                  title="Поділитись папкою"
                >
                  <Share2 size={14} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Видалити папку "${folder.name}" та всі файли в ній?`)) {
                    onDeleteFolder?.(folder);
                  }
                }}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1"
                title="Видалити папку"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          {isDragOver && (
            <div className="mt-2 text-center text-xs text-blue-600 font-medium">
              Перетягніть сюди для додавання в папку
            </div>
          )}
        </div>

        {isExpanded && folderDocs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pl-4 border-l-2 border-amber-200">
            {folderDocs.map(doc => renderDocumentCard(doc, true))}
          </div>
        )}
      </div>
    );
  };

  const hasContent = standaloneDocuments.length > 0 || filteredFolders.length > 0;

  return (
    <div className="flex-1 bg-[#F8FAFC] flex flex-col h-full overflow-hidden">
      <div className="bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
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
        <div className="flex gap-2 ml-4 shrink-0">
          {/* Кнопка режиму вибору */}
          {onShareMultiple && (
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) {
                  setSelectedDocs(new Set());
                }
              }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                isSelectionMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Вибрати документи"
            >
              <Check size={16} />
              <span className="hidden md:inline">{isSelectionMode ? 'Скасувати' : 'Вибрати'}</span>
            </button>
          )}

          {/* Кнопка створення папки */}
          {onCreateFolder && (
            <button
              onClick={() => setShowNewFolderInput(true)}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all flex items-center gap-1"
              title="Створити папку"
            >
              <FolderPlus size={16} />
              <span className="hidden md:inline">Папка</span>
            </button>
          )}

          <button
            onClick={onUpload}
            className="w-10 h-10 md:w-auto md:px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            <UploadCloud size={18} /> <span className="hidden md:inline">Завантажити</span>
          </button>
        </div>
      </div>

      {/* Панель вибору документів */}
      {isSelectionMode && selectedDocs.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-blue-700">
            Вибрано: {selectedDocs.size} документ(ів)
          </span>
          <button
            onClick={handleShareSelected}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Share2 size={16} />
            Поділитись вибраними
          </button>
        </div>
      )}

      {/* Форма створення папки */}
      {showNewFolderInput && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-3">
          <FolderPlus size={20} className="text-amber-600" />
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Назва нової папки..."
            className="flex-1 px-3 py-2 rounded-lg border border-amber-300 text-sm focus:outline-none focus:border-amber-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') {
                setShowNewFolderInput(false);
                setNewFolderName('');
              }
            }}
          />
          <button
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim()}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Check size={16} />
            Створити
          </button>
          <button
            onClick={() => {
              setShowNewFolderInput(false);
              setNewFolderName('');
            }}
            className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div
        className={`flex-1 overflow-y-auto p-6 ${draggedDocId ? 'bg-slate-100' : ''}`}
        onDragOver={(e) => {
          if (draggedDocId) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }
        }}
        onDrop={handleDropToRoot}
      >
        {!hasContent ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <FolderOpen size={48} className="mb-4 opacity-30" />
            <p>У цій категорії немає документів</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Папки */}
            {filteredFolders.length > 0 && (
              <div className="space-y-3">
                {filteredFolders.map(folder => renderFolderCard(folder))}
              </div>
            )}

            {/* Окремі документи (без папки) */}
            {standaloneDocuments.length > 0 && (
              <>
                {filteredFolders.length > 0 && (
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wider pt-2">
                    Файли без папки
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {standaloneDocuments.map((doc) => renderDocumentCard(doc))}
                </div>
              </>
            )}

            {/* Підказка при перетягуванні */}
            {draggedDocId && filteredFolders.length > 0 && (
              <div className="text-center text-sm text-slate-500 py-4 border-2 border-dashed border-slate-300 rounded-xl bg-white">
                Перетягніть файл на папку або залиште тут для видалення з папки
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
