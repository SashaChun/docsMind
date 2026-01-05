import { useState, type FormEvent } from 'react';
import { X, Mail, Globe, FileText } from 'lucide-react';
import type { Document } from '../../types';
import { sharesApi } from '../../services/api.ts';

interface ShareMultipleModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
}

export const ShareMultipleModal = ({ isOpen, onClose, documents }: ShareMultipleModalProps) => {
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen || documents.length === 0) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLink('');

    if (visibility === 'private' && !email.trim()) {
      setError('Вкажіть email для приватного доступу');
      return;
    }

    setLoading(true);

    try {
      const payload: { visibility: 'public' | 'private'; email?: string } = { visibility };
      if (visibility === 'private') {
        payload.email = email.trim();
      }

      const documentIds = documents.map(d => d.id);
      const response = await sharesApi.createMultipleShare(documentIds, payload);

      if (!response.success || !response.data) {
        setError(response.error || 'Не вдалося створити посилання');
        return;
      }

      const url = (response.data as any).url as string | undefined;
      if (!url) {
        setError('Сервер не повернув посилання');
        return;
      }

      setLink(url);
      try {
        await navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        setError('Не вдалося скопіювати посилання в буфер обміну');
      }
    } catch {
      setError('Сталася помилка. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setLink('');
    setEmail('');
    setVisibility('public');
    setCopySuccess(false);
    onClose();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError('Не вдалося скопіювати посилання в буфер обміну');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Поділитись документами</h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-800 mb-2">
            Вибрано {documents.length} документ(ів):
          </p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center gap-2 text-xs text-slate-600">
                <FileText size={14} className="text-blue-500 shrink-0" />
                <span className="truncate">{doc.name}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                visibility === 'public'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Globe size={14} /> Публічний доступ
            </button>
            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                visibility === 'private'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Mail size={14} /> Приватний (по email)
            </button>
          </div>

          {visibility === 'private' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email отримувача
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none"
                placeholder="user@example.com"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Доступ отримає лише користувач, зареєстрований з цим email.
              </p>
            </div>
          )}

          {error && (
            <div className="text-xs bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {link && (
            <div className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg">
              <div className="font-medium mb-2">Посилання згенеровано:</div>
              <div className="bg-white border border-green-200 rounded p-2 mb-2 break-all text-xs text-slate-700 max-h-20 overflow-y-auto">
                {link}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
              >
                {copySuccess ? '✓ Скопійовано' : 'Копіювати посилання'}
              </button>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Створення...' : 'Створити посилання'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
