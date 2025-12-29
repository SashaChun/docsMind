import { X, Upload, Trash2 } from 'lucide-react';
import { useState, type FormEvent, type ChangeEvent } from 'react';
import type { Document } from '../../types';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (doc: Omit<Document, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>, file: File) => void;
  onSubmitMultiple?: (name: string, category: string, files: File[]) => void;
}

export const AddDocumentModal = ({
  isOpen,
  onClose,
  onSubmit,
  onSubmitMultiple,
}: AddDocumentModalProps) => {
  const [files, setFiles] = useState<File[]>([]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (files.length === 0) {
      alert('Будь ласка, виберіть файл(и)');
      return;
    }

    const name = formData.get('docName') as string;
    const category = formData.get('category') as 'statutory' | 'tax' | 'personal';

    // Якщо більше одного файлу - використовуємо множинне завантаження
    if (files.length > 1 && onSubmitMultiple) {
      onSubmitMultiple(name, category, files);
    } else {
      // Один файл - стара логіка
      const doc: Omit<Document, 'id' | 'companyId' | 'createdAt' | 'updatedAt'> = {
        name,
        category,
      };
      onSubmit(doc, files[0]);
    }

    setFiles([]);
    e.currentTarget.reset();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getTotalSize = (): string => {
    const total = files.reduce((acc, f) => acc + f.size, 0);
    return formatFileSize(total);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);

      // Перевірка файлів
      for (const file of selectedFiles) {
        if (file.size === 0) {
          alert(`Файл "${file.name}" порожній. Будь ласка, виберіть інший файл.`);
          e.target.value = '';
          return;
        }

        if (file.size > 10485760) { // 10MB
          alert(`Файл "${file.name}" занадто великий. Максимальний розмір: 10MB`);
          e.target.value = '';
          return;
        }
      }

      setFiles(selectedFiles);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Додати документ</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
              <Upload className="mx-auto text-slate-400 mb-2" size={24} />
              {files.length > 0 ? (
                <>
                  <p className="text-sm text-slate-700 font-medium mb-1">
                    {files.length === 1
                      ? files[0].name
                      : `Вибрано ${files.length} файлів`}
                  </p>
                  <p className="text-xs text-slate-500">{getTotalSize()}</p>
                  {files.length > 1 && (
                    <p className="text-xs text-blue-600 mt-1">
                      Буде створено папку
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-500 mb-1">
                    Натисніть або перетягніть файли
                  </p>
                  <p className="text-xs text-slate-400">
                    Підтримуються: PDF, DOCX, DOC, TXT, JPG, PNG, GIF, WEBP, WEBM
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    Можна вибрати декілька файлів
                  </p>
                </>
              )}
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.webm"
                multiple
              />
            </label>
          </div>

          {files.length > 1 && (
            <div className="max-h-32 overflow-y-auto space-y-1">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg text-sm"
                >
                  <span className="truncate flex-1 mr-2">{file.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">{formatFileSize(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <input
            name="docName"
            required
            placeholder={files.length > 1 ? "Назва папки" : "Назва документу"}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none"
          />

          <select
            name="category"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm outline-none bg-white"
          >
            <option value="statutory">Установчі</option>
            <option value="tax">Податкові</option>
            <option value="personal">Особисті</option>
          </select>

          <button
            type="submit"
            disabled={files.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {files.length > 1 ? `Завантажити ${files.length} файлів` : 'Завантажити'}
          </button>
        </form>
      </div>
    </div>
  );
};
