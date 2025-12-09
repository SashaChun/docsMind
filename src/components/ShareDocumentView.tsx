import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import { sharesApi } from '../services/api.ts';
import type { SharePayload } from '../types';

export const ShareDocumentView = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SharePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError('Посилання не знайдено');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      const response = await sharesApi.getByToken(token);

      if (!response.success || !response.data) {
        setError(response.error || 'Не вдалося завантажити документ');
      } else {
        setData(response.data as SharePayload);
      }

      setLoading(false);
    };

    load();
  }, [token]);

  const handleBack = () => {
    navigate(-1);
  };

  const document = data?.document;
  const share = data?.share;
  const isPrivate = share?.type === 'document_private';
  
  const currentUserEmail = localStorage.getItem('userEmail');
  const canViewPrivate = !isPrivate || (currentUserEmail && share?.targetEmail && currentUserEmail.toLowerCase() === share.targetEmail.toLowerCase());
  const needsAuth = isPrivate && !currentUserEmail;
  const wrongUser = isPrivate && currentUserEmail && share?.targetEmail && currentUserEmail.toLowerCase() !== share.targetEmail.toLowerCase();

  const handleOpenInNewTab = () => {
    if (document?.fileUrl) {
      window.open(document.fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={18} />
          <span>Назад</span>
        </button>
        {share && (
          <div className="text-[11px] text-slate-400">
            Лінк {isPrivate ? 'приватний' : 'публічний'} • Діє до{' '}
            {new Date(share.expiresAt).toLocaleString()}
          </div>
        )}
      </header>

      <main className="flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-6 max-w-6xl w-full mx-auto">
        {loading && (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Завантаження документа...
          </div>
        )}

        {!loading && error && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm max-w-md text-center flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
            >
              Увійти
            </button>
          </div>
        )}

        {!loading && !error && document && (
          <>
            {needsAuth ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-md">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                      <FileText size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="font-semibold text-slate-900 text-base break-words">
                        {document.name}
                      </h1>
                      <p className="text-xs text-slate-500 mt-1">
                        Завантажено {new Date(document.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-4">
                    <p className="font-medium mb-1">Приватне посилання</p>
                    <p className="text-xs">
                      Цей документ доступний лише для {share?.targetEmail}. 
                      Будь ласка, увійдіть з цим email для перегляду.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
                  >
                    Увійти
                  </button>
                </div>
              </div>
            ) : wrongUser ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-md">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                      <FileText size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="font-semibold text-slate-900 text-base break-words">
                        {document.name}
                      </h1>
                    </div>
                  </div>
                  <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4 flex items-center gap-2">
                    <AlertCircle size={16} />
                    <div>
                      <p className="font-medium mb-1">Доступ заборонено</p>
                      <p className="text-xs">
                        Цей документ призначений для {share?.targetEmail}. 
                        Ви увійшли як {currentUserEmail}.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
                  >
                    Увійти з іншим акаунтом
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100vh-140px)]">
                <section className="lg:w-80 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-5 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                      <FileText size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="font-semibold text-slate-900 text-sm md:text-base break-words">
                        {document.name}
                      </h1>
                      <p className="text-xs text-slate-500 mt-1">
                        Завантажено {new Date(document.createdAt).toLocaleDateString()}
                      </p>
                      {document.company?.name && (
                        <p className="text-xs text-slate-500 mt-1">
                          Компанія: {document.company.name}
                        </p>
                      )}
                      {isPrivate && (
                        <p className="text-[11px] text-amber-600 mt-1">
                          Приватне посилання. Доступне лише для вказаного отримувача.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={handleOpenInNewTab}
                      disabled={!document.fileUrl}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ExternalLink size={14} />
                      Відкрити в новій вкладці
                    </button>
                  </div>
                </section>

                <section className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  {document.fileUrl ? (
                    <iframe
                      src={document.fileUrl}
                      title={document.name}
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                      Попередній перегляд недоступний
                    </div>
                  )}
                </section>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
