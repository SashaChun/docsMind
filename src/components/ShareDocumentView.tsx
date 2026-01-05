import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Download, AlertCircle, Image, Film, File, Folder, ChevronRight } from 'lucide-react';
import { sharesApi } from '../services/api.ts';
import type { SharePayload, SharedDocumentInfo } from '../types';
import mammoth from 'mammoth';

interface ExtendedShareData {
  share: {
    token: string;
    type: string;
    expiresAt: string;
    accessCount: number;
    targetEmail?: string | null;
  };
  document?: SharedDocumentInfo;
  folder?: {
    id: number;
    name: string;
    category: string;
    createdAt: string;
    company?: { id: number; name: string };
    documents: SharedDocumentInfo[];
  };
  documents?: SharedDocumentInfo[];
}

export const ShareDocumentView = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ExtendedShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [docxContent, setDocxContent] = useState<string | null>(null);
  const [docxLoading, setDocxLoading] = useState(false);
  const [docxError, setDocxError] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<SharedDocumentInfo | null>(null);

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
        const shareData = response.data as ExtendedShareData;
        setData(shareData);
        // Для одиночного документа - встановлюємо як вибраний
        if (shareData.document) {
          setSelectedDoc(shareData.document);
        }
      }

      setLoading(false);
    };

    load();
  }, [token]);

  // Завантаження та конвертація DOCX файлів
  useEffect(() => {
    const loadDocxContent = async () => {
      if (!selectedDoc) return;

      const doc = selectedDoc;
      const isDocx = doc.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isDoc = doc.mimeType === 'application/msword';

      if (!isDocx && !isDoc) {
        setDocxContent(null);
        setDocxError('');
        return;
      }

      setDocxLoading(true);
      setDocxError('');
      setDocxContent(null);

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
  }, [selectedDoc]);

  const handleBack = () => {
    if (selectedDoc && (data?.folder || data?.documents)) {
      setSelectedDoc(null);
    } else {
      navigate(-1);
    }
  };

  const share = data?.share;
  const isPrivate = share?.type?.includes('private');
  const isFolder = share?.type?.includes('folder');
  const isMultiple = share?.type?.includes('multiple');

  const currentUserEmail = localStorage.getItem('userEmail');
  const canViewPrivate = !isPrivate || (currentUserEmail && share?.targetEmail && currentUserEmail.toLowerCase() === share.targetEmail.toLowerCase());
  const needsAuth = isPrivate && !currentUserEmail;
  const wrongUser = isPrivate && currentUserEmail && share?.targetEmail && currentUserEmail.toLowerCase() !== share.targetEmail.toLowerCase();

  // Отримуємо список документів залежно від типу шерінгу
  const documentsList: SharedDocumentInfo[] = data?.folder?.documents || data?.documents || (data?.document ? [data.document] : []);

  const handleDownload = (doc?: SharedDocumentInfo) => {
    const docToDownload = doc || selectedDoc;
    if (docToDownload?.fileUrl) {
      const link = window.document.createElement('a');
      link.href = docToDownload.fileUrl;
      link.download = docToDownload.name;
      link.click();
    }
  };

  // Визначення типу файлу
  const isImage = selectedDoc?.mimeType?.startsWith('image/');
  const isVideo = selectedDoc?.mimeType?.startsWith('video/');
  const isPdf = selectedDoc?.mimeType === 'application/pdf';
  const isDocx = selectedDoc?.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const isDoc = selectedDoc?.mimeType === 'application/msword';
  const isText = selectedDoc?.mimeType === 'text/plain';

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

  const getFileIconForDoc = (doc: SharedDocumentInfo) => {
    const mimeType = doc.mimeType || '';
    if (mimeType.startsWith('image/')) return <Image size={18} className="text-pink-600" />;
    if (mimeType.startsWith('video/')) return <Film size={18} className="text-purple-600" />;
    if (mimeType === 'application/pdf') return <FileText size={18} className="text-red-600" />;
    if (mimeType.includes('word')) return <FileText size={18} className="text-blue-600" />;
    return <File size={18} className="text-slate-600" />;
  };

  const renderDocumentsList = () => {
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-4 flex items-center gap-3">
          {isFolder && data?.folder && (
            <>
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
                <Folder size={24} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">{data.folder.name}</h2>
                <p className="text-xs text-slate-500">{documentsList.length} файлів</p>
              </div>
            </>
          )}
          {isMultiple && (
            <>
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">Документи</h2>
                <p className="text-xs text-slate-500">{documentsList.length} файлів</p>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documentsList.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedDoc(doc)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-50">
                  {getFileIconForDoc(doc)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-800 text-sm truncate" title={doc.name}>
                    {doc.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(doc);
                  }}
                  className="flex-1 py-1.5 rounded-md text-xs font-medium bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1"
                >
                  <Download size={14} />
                  Завантажити
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    if (!selectedDoc?.fileUrl) {
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
            src={selectedDoc.fileUrl}
            alt={selectedDoc.name}
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
            src={selectedDoc.fileUrl}
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
                onClick={() => handleDownload()}
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
          src={selectedDoc.fileUrl}
          title={selectedDoc.name}
          className="w-full h-full border-0"
        />
      );
    }

    // Текстові файли
    if (isText) {
      return (
        <TextFilePreview fileUrl={selectedDoc.fileUrl} />
      );
    }

    // Для інших типів - показуємо повідомлення про завантаження
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-500">
        <File size={48} className="opacity-30" />
        <p>Попередній перегляд недоступний для цього типу файлу</p>
        <button
          onClick={() => handleDownload()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 flex items-center gap-2"
        >
          <Download size={16} />
          Завантажити файл
        </button>
      </div>
    );
  };

  const getShareTitle = () => {
    if (isFolder && data?.folder) return data.folder.name;
    if (isMultiple) return `${documentsList.length} документів`;
    if (selectedDoc) return selectedDoc.name;
    return 'Документ';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={18} />
          <span>{selectedDoc && (isFolder || isMultiple) ? 'До списку' : 'Назад'}</span>
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
            Завантаження...
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

        {!loading && !error && data && (
          <>
            {needsAuth ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-md">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`p-3 rounded-xl ${isFolder ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                      {isFolder ? <Folder size={22} /> : <FileText size={22} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="font-semibold text-slate-900 text-base break-words">
                        {getShareTitle()}
                      </h1>
                      <p className="text-xs text-slate-500 mt-1">
                        {documentsList.length} файлів
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-4">
                    <p className="font-medium mb-1">Приватне посилання</p>
                    <p className="text-xs">
                      Цей контент доступний лише для {share?.targetEmail}.
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
                    <div className={`p-3 rounded-xl ${isFolder ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                      {isFolder ? <Folder size={22} /> : <FileText size={22} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="font-semibold text-slate-900 text-base break-words">
                        {getShareTitle()}
                      </h1>
                    </div>
                  </div>
                  <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4 flex items-center gap-2">
                    <AlertCircle size={16} />
                    <div>
                      <p className="font-medium mb-1">Доступ заборонено</p>
                      <p className="text-xs">
                        Цей контент призначений для {share?.targetEmail}.
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
            ) : (isFolder || isMultiple) && !selectedDoc ? (
              // Показуємо список документів для папки або множинного шерінгу
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                {renderDocumentsList()}
              </div>
            ) : selectedDoc ? (
              <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100vh-140px)]">
                <section className="lg:w-80 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-5 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-xl ${getIconBgColor()}`}>
                      {getFileIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="font-semibold text-slate-900 text-sm md:text-base break-words">
                        {selectedDoc.name}
                      </h1>
                      <p className="text-xs text-slate-500 mt-1">
                        Завантажено {new Date(selectedDoc.createdAt).toLocaleDateString()}
                      </p>
                      {selectedDoc.company?.name && (
                        <p className="text-xs text-slate-500 mt-1">
                          Компанія: {selectedDoc.company.name}
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
                      onClick={() => handleDownload()}
                      disabled={!selectedDoc.fileUrl}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download size={14} />
                      Завантажити
                    </button>
                  </div>

                  {selectedDoc.mimeType && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Тип: {selectedDoc.mimeType.split('/').pop()}
                    </p>
                  )}
                </section>

                <section className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  {renderPreview()}
                </section>
              </div>
            ) : null}
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
