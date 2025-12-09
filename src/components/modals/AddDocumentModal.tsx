import { X, Upload } from 'lucide-react';
import { useState, type FormEvent, type ChangeEvent } from 'react';
import type { Document } from '../../types';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (doc: Omit<Document, 'id' | 'companyId' | 'date'>, file: File) => void;
}

export const AddDocumentModal = ({
  isOpen,
  onClose,
  onSubmit,
}: AddDocumentModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!file) {
      alert('Please select a file');
      return;
    }

    console.log('Submitting file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString(),
    });

    if (file.size === 0) {
      alert('Файл порожній! Виберіть інший файл.');
      return;
    }

    const doc: Omit<Document, 'id' | 'companyId' | 'date'> = {
      name: formData.get('docName') as string,
      category: formData.get('category') as 'statutory' | 'tax' | 'personal',
    };

    onSubmit(doc, file);
    setFile(null);
    setFileName('');
    setFileSize('');
    e.currentTarget.reset();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.size === 0) {
        alert('Файл порожній. Будь ласка, виберіть інший файл.');
        e.target.value = '';
        return;
      }
      
      if (selectedFile.size > 10485760) { // 10MB
        alert('Файл занадто великий. Максимальний розмір: 10MB');
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setFileSize(formatFileSize(selectedFile.size));
    }
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
              {fileName ? (
                <>
                  <p className="text-sm text-slate-700 font-medium mb-1">{fileName}</p>
                  <p className="text-xs text-slate-500">{fileSize}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-500 mb-1">
                    Натисніть або перетягніть файл
                  </p>
                  <p className="text-xs text-slate-400">
                    Підтримуються: PDF, DOCX, DOC, TXT, JPG, PNG
                  </p>
                </>
              )}
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              />
            </label>
          </div>

          <input
            name="docName"
            required
            placeholder="Назва документу"
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
            disabled={!file}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Завантажити
          </button>
        </form>
      </div>
    </div>
  );
};
