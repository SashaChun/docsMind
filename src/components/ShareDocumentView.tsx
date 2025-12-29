import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Download, AlertCircle, Image, Film, File } from 'lucide-react';
import { sharesApi } from '../services/api.ts';
import type { SharePayload } from '../types';
import mammoth from 'mammoth';

export const ShareDocumentView = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SharePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [docxContent, setDocxContent] = useState<string | null>(null);
  const [docxLoading, setDocxLoading] = useState(false);
  const [docxError, setDocxError] = useState('');

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

  // Завантаження та конвертація DOCX файлів
  useEffect(() => {
    const loadDocxContent = async () => {
      if (!data?.document) return;

      const doc = data.document;
      const isDocx = doc.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isDoc = doc.mimeType === 'application/msword';

      if (!isDocx && !isDoc) return;

      setDocxLoading(true);
      setDocxError('');

      try {
        const response = await fetch(doc.fileUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        if (arrayBuffer.byteLength === 0) {
          throw new Error('Файл порожній');
        }

        if (isDoc) {
          setDocxError('Старий формат .doc не підтримується для перегляду. Ви можете завантажити файл.');
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
        const errorMessage = err?.message || '';
        if (errorMessage.includes('central directory') || errorMessage.includes('zip')) {
          setDocxError('Не вдалося відкрити файл. Можливо, файл пошкоджений.');
        } else {
          setDocxError(errorMessage || 'Не вдалося завантажити документ');
        }
      } finally {
        setDocxLoading(false);
      }
    };

    loadDocxContent();
  }, [data]);

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

  const handleDownload = () => {
    if (document?.fileUrl) {
      const link = window.document.createElement('a');
      link.href = document.fileUrl;
      link.download = document.name;
      link.click();
    }
  };

  // Визначення типу файлу
  const isImage = document?.mimeType?.startsWith('image/');
  const isVideo = document?.mimeType?.startsWith('video/');
  const isPdf = document?.mimeType === 'application/pdf';
  const isDocx = document?.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const isDoc = document?.mimeType === 'application/msword';
  const isText = document?.mimeType === 'text/plain';

  const getFileIcon = () => {
    if (isImage) return <Image size={22} />;
    if (isVideo) return <Film size={22} />;
    if (isPdf || isDocx || isDoc || isText) return <FileText size={22} />;
    return <File size={22} />;
  };

  const getIconBgColor = () => {
    if (isImage) return 'bg-pink-50 text-pink-600';
    if (isVideo) return 'bg-purple-50 text-purple-600';
    if (isPdf) return 'bg-red-50 text-red-600';
    if (isDocx || isDoc) return 'bg-blue-50 text-blue-600';
    return 'bg-slate-50 text-slate-600';
  };

  const renderPreview = () => {
    if (!document?.fileUrl) {
      return (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          Попередній перегляд недоступний
        </div>
      );
    }

    // Зображення
    if (isImage) {
      return (
        <div className="flex-1 flex items-center justify-center bg-slate-100 p-4 overflow-auto">
          <img
            src={document.fileUrl}
            alt={document.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        </div>
      );
    }

    // Відео
    if (isVideo) {
      return (
        <div className="flex-1 flex items-center justify-center bg-slate-900 p-4">
          <video
            src={document.fileUrl}
            controls
            className="max-w-full max-h-full rounded-lg"
          />
        </div>
      );
    }

    // DOCX/DOC файли
    if (isDocx || isDoc) {
      return (
        <div className="flex-1 overflow-auto p-6 md:p-8 bg-white">
          {docxLoading ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              Завантаження документа...
            </div>
          ) : docxError && !docxContent ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm max-w-md text-center">
                {docxError}
              </div>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 flex items-center gap-2"
              >
                <Download size={16} />
                Завантажити файл
              </button>
            </div>
          ) : docxContent ? (
            <div className="prose prose-slate max-w-none">
              <div dangerouslySetInnerHTML={{ __html: docxContent }} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              Документ порожній
            </div>
          )}
        </div>
      );
    }

    // PDF - використовуємо iframe
    if (isPdf) {
      return (
        <iframe
          src={document.fileUrl}
          title={document.name}
          className="w-full h-full border-0"
        />
      );
    }

    // Текстові файли
    if (isText) {
      return (
        <TextFilePreview fileUrl={document.fileUrl} />
      );
    }

    // Для інших типів - показуємо повідомлення про завантаження
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-500">
        <File size={48} className="opacity-30" />
        <p>Попередній перегляд недоступний для цього типу файлу</p>
        <button
          onClick={handleDownload}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 flex items-center gap-2"
        >
          <Download size={16} />
          Завантажити файл
        </button>
      </div>
    );
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
                    <div className={`p-3 rounded-xl ${getIconBgColor()}`}>
                      {getFileIcon()}
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
                    <div className={`p-3 rounded-xl ${getIconBgColor()}`}>
                      {getFileIcon()}
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
                    <div className={`p-3 rounded-xl ${getIconBgColor()}`}>
                      {getFileIcon()}
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
                          Приватне посилання
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={handleDownload}
                      disabled={!document.fileUrl}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download size={14} />
                      Завантажити
                    </button>
                  </div>

                  {document.mimeType && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Тип: {document.mimeType.split('/').pop()}
                    </p>
                  )}
                </section>

                <section className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  {renderPreview()}
                </section>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

// Компонент для перегляду текстових файлів
const TextFilePreview = ({ fileUrl }: { fileUrl: string }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadText = async () => {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to load');
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError('Не вдалося завантажити текст');
      } finally {
        setLoading(false);
      }
    };
    loadText();
  }, [fileUrl]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Завантаження...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 bg-slate-50">
      <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700">
        {content}
      </pre>
    </div>
  );
};
