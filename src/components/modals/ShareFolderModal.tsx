import { useState, type FormEvent } from 'react';
import { X, Mail, Globe, Folder, Clock } from 'lucide-react';
import type { Folder as FolderType } from '../../types';
import { sharesApi } from '../../services/api.ts';

interface ShareFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: FolderType | null;
}

const EXPIRATION_OPTIONS = [
  { value: -1, label: 'Безлімітно' },
  { value: 60, label: '1 година' },
  { value: 1440, label: '24 години' },
  { value: 10080, label: '7 днів' },
  { value: 43200, label: '30 днів' },
  { value: 0, label: 'Власний час...' },
];

export const ShareFolderModal = ({ isOpen, onClose, folder }: ShareFolderModalProps) => {
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [email, setEmail] = useState('');
  const [expiresInMinutes, setExpiresInMinutes] = useState(-1);
  const [customDays, setCustomDays] = useState('');
  const [customHours, setCustomHours] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen || !folder) return null;

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
      let finalExpiration = expiresInMinutes;
      if (expiresInMinutes === 0) {
        const days = parseInt(customDays) || 0;
        const hours = parseInt(customHours) || 0;
        if (days === 0 && hours === 0) {
          setError('Вкажіть час дії посилання');
          return;
        }
        finalExpiration = days * 24 * 60 + hours * 60;
      }

      const payload: { visibility: 'public' | 'private'; email?: string; expiresInMinutes: number } = {
        visibility,
        expiresInMinutes: finalExpiration
      };
      if (visibility === 'private') {
        payload.email = email.trim();
      }

      const response = await sharesApi.createFolderShare(folder.id, payload);

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
    setExpiresInMinutes(-1);
    setCustomDays('');
    setCustomHours('');
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
          <h3 className="text-lg font-semibold">Поділитись папкою</h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4 p-3 bg-amber-50 rounded-lg">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
            <Folder size={20} />
          </div>
          <div>
            <p className="font-medium text-slate-800">{folder.name}</p>
            <p className="text-xs text-slate-500">
              {folder.documents?.length || 0} файлів
            </p>
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

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              <Clock size={12} className="inline mr-1" />
              Термін дії посилання
            </label>
            <select
              value={expiresInMinutes}
              onChange={(e) => setExpiresInMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none bg-white"
            >
              {EXPIRATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {expiresInMinutes === 0 && (
              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none"
                    placeholder="Днів"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={customHours}
                    onChange={(e) => setCustomHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none"
                    placeholder="Годин"
                  />
                </div>
              </div>
            )}
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
              className="flex-1 px-3 py-2 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Створення...' : 'Створити посилання'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
