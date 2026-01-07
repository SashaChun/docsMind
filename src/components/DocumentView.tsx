import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, ExternalLink, Edit3 } from 'lucide-react';
import { documentsApi } from '../services/api.ts';
import mammoth from 'mammoth';
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
  const [docxContent, setDocxContent] = useState<string | null>(null);
  const [docxLoading, setDocxLoading] = useState(false);
  const [docxError, setDocxError] = useState('');

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

  // Завантаження та конвертація DOCX/DOC файлів
  useEffect(() => {
    const loadDocxContent = async () => {
      if (!document || !id) return;

      const isDocx = document.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isDoc = document.mimeType === 'application/msword';

      if (!isDocx && !isDoc) return;

      // Якщо є збережений контент, використовуємо його
      if ((document as any).content) {
        setDocxContent((document as any).content);
        return;
      }

      setDocxLoading(true);
      setDocxError('');

      try {
        const proxyUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/documents/${id}/file`;

        const response = await fetch(proxyUrl, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        if (arrayBuffer.byteLength === 0) {
          throw new Error('Файл порожній');
        }

        // Старий .doc формат не підтримується mammoth.js
        if (isDoc) {
          setDocxError('Старий формат .doc не підтримується для перегляду. Будь ласка, конвертуйте файл у .docx формат або завантажте його для перегляду в Microsoft Word.');
          setDocxLoading(false);
          return;
        }

        const result = await mammoth.convertToHtml({ arrayBuffer });

        if (result.value && result.value.trim().length > 0) {
          setDocxContent(result.value);
        } else {
          setDocxContent('<p style="color: #64748b; text-align: center;">Документ порожній або не містить текстового контенту.</p>');
        }
      } catch (err: any) {
        console.error('DOCX conversion error:', err);
        // Перевіряємо чи це помилка JSZip (невалідний DOCX)
        const errorMessage = err?.message || '';
        if (errorMessage.includes('central directory') || errorMessage.includes('zip')) {
          setDocxError('Не вдалося відкрити файл. Можливо, це старий формат .doc або файл пошкоджений. Спробуйте конвертувати його у .docx.');
        } else {
          setDocxError(errorMessage || 'Не вдалося завантажити документ');
        }
      } finally {
        setDocxLoading(false);
      }
    };

    loadDocxContent();
  }, [document, id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleOpenInNewTab = () => {
    if (document?.fileUrl) {
      window.open(document.fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEdit = () => {
    if (id) {
      navigate(`/documents/${id}/edit`);
    }
  };

  const createdAt = document?.createdAt;

  const isImage = document?.mimeType?.startsWith('image/');
  const isVideo = document?.mimeType?.startsWith('video/');
  const isPdf = document?.mimeType === 'application/pdf';
  const isDocx = document?.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const isDoc = document?.mimeType === 'application/msword';

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

              <div className="mt-2 flex flex-col gap-2">
                {(isDocx || isDoc) && (
                  <button
                    onClick={handleEdit}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                  >
                    <Edit3 size={14} />
                    Редагувати
                  </button>
                )}
                <button
                  onClick={handleOpenInNewTab}
                  disabled={!document.fileUrl}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ExternalLink size={14} />
                  Завантажити файл
                </button>
              </div>

              {document.mimeType && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Тип файлу: {document.mimeType}
                </p>
              )}
            </section>

            <section className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              {(isDocx || isDoc) ? (
                <div className="flex-1 overflow-auto p-6 md:p-8">
                  {docxLoading ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      Завантаження документа...
                    </div>
                  ) : docxError && !docxContent ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm max-w-md text-center">
                        {docxError}
                      </div>
                      <button
                        onClick={handleEdit}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                      >
                        Відкрити в редакторі
                      </button>
                    </div>
                  ) : docxContent ? (
                    <div className="prose prose-slate max-w-none">
                      {docxError && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                          {docxError}
                        </div>
                      )}
                      <div dangerouslySetInnerHTML={{ __html: docxContent }} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      Документ порожній
                    </div>
                  )}
                </div>
              ) : document.fileUrl ? (
                isImage ? (
                  <div className="flex-1 flex items-center justify-center bg-slate-50 p-4 overflow-auto">
                    <img
                      src={document.fileUrl}
                      alt={document.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : isVideo ? (
                  <div className="flex-1 flex items-center justify-center bg-slate-50 p-4">
                    <video
                      src={document.fileUrl}
                      controls
                      className="max-w-full max-h-full"
                    />
                  </div>
                ) : (
                  <iframe
                    src={document.fileUrl}
                    title={document.name}
                    className="w-full h-full border-0"
                  />
                )
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
