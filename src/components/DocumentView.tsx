import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, ExternalLink } from 'lucide-react';
import { documentsApi } from '../services/api.ts';
import type { Document } from '../types';

type DocumentWithFile = Document & {
  fileUrl?: string;
  mimeType?: string;
  createdAt?: string;
  company?: {
    id: number;
    name: string;
  };
};

export const DocumentView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<DocumentWithFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError('Документ не знайдено');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await documentsApi.getById(Number(id));

        if (!response.success || !response.data) {
          setError(response.error || 'Не вдалося завантажити документ');
          return;
        }

        setDocument(response.data as DocumentWithFile);
      } catch (e) {
        setError('Сталася помилка при завантаженні документа');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleOpenInNewTab = () => {
    if (document?.fileUrl) {
      window.open(document.fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const createdAt = document?.createdAt || (document as any)?.date;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={18} />
          <span>Назад</span>
        </button>
      </header>

      <main className="flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-6 max-w-6xl w-full mx-auto">
        {loading && (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Завантаження документа...
          </div>
        )}

        {!loading && error && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm max-w-md text-center">
              {error}
            </div>
            <button
              onClick={handleBack}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
            >
              Повернутись
            </button>
          </div>
        )}

        {!loading && document && (
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
                  {createdAt && (
                    <p className="text-xs text-slate-500 mt-1">
                      Завантажено {new Date(createdAt).toLocaleDateString()}
                    </p>
                  )}
                  {document.company?.name && (
                    <p className="text-xs text-slate-500 mt-1">
                      Компанія: {document.company.name}
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

              {document.mimeType && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Тип файлу: {document.mimeType}
                </p>
              )}
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
      </main>
    </div>
  );
};
