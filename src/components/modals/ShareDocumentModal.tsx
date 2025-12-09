import { useState, type FormEvent } from 'react';
import { X, Link2, Mail, Globe } from 'lucide-react';
import type { Document } from '../../types';
import { sharesApi } from '../../services/api.ts';

interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

export const ShareDocumentModal = ({ isOpen, onClose, document }: ShareDocumentModalProps) => {
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');

  if (!isOpen || !document) return null;

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

      const response = await sharesApi.createDocumentShare(document.id, payload);

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
      } catch {
        // ignore clipboard errors
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
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Поділитись документом</h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4 break-words">{document.name}</p>

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
            <div className="text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg break-all">
              Посилання згенеровано і скопійовано в буфер обміну:
              <div className="mt-1 flex items-center gap-2">
                <Link2 size={14} /> <span className="truncate flex-1">{link}</span>
              </div>
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
