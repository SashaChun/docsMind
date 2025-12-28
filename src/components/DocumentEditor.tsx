import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Undo,
  Redo,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { documentsApi } from '../services/api';
import mammoth from 'mammoth';

export const DocumentEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const [documentName, setDocumentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [document, setDocument] = useState<any>(null);

  useEffect(() => {
    const loadDocument = async () => {
      if (!id) return;
      
      setLoading(true);
      setError('');
      
      try {
        const response = await documentsApi.getById(parseInt(id));
        
        if (!response.success || !response.data) {
          setError(response.error || 'Не вдалося завантажити документ');
          setLoading(false);
          return;
        }
        
        const doc = response.data;
        console.log('=== DOCUMENT LOADED ===');
        console.log('mimeType:', doc.mimeType);
        console.log('content:', doc.content);
        console.log('fileUrl:', doc.fileUrl);
        setDocument(doc);
        setDocumentName(doc.name);
        
        // Встановлюємо початковий контент
        if (editorRef.current) {
          // Якщо є збережений контент, використовуємо його
          if (doc.content) {
            console.log('Loading saved content from database');
            editorRef.current.innerHTML = doc.content;
          }
          // Для DOCX файлів завантажуємо та конвертуємо в HTML
          else if (doc.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
              doc.mimeType === 'application/msword') {
            try {
              // Use backend proxy to avoid CORS issues
              const proxyUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/documents/${id}/file`;
              console.log('Loading DOCX from:', proxyUrl);

              const response = await fetch(proxyUrl, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
              });
              console.log('Fetch response:', {
                status: response.status,
                ok: response.ok,
                contentType: response.headers.get('content-type'),
                contentLength: response.headers.get('content-length'),
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const arrayBuffer = await response.arrayBuffer();
              console.log('ArrayBuffer size:', arrayBuffer.byteLength);
              
              if (arrayBuffer.byteLength === 0) {
                throw new Error('Файл порожній (0 байт)');
              }
              
              if (arrayBuffer.byteLength < 100) {
                throw new Error(`Файл занадто малий (${arrayBuffer.byteLength} байт). DOCX файли мають бути мінімум 5-10 KB. Можливо, ви хотіли створити .txt файл?`);
              }
              
              const result = await mammoth.convertToHtml({ arrayBuffer });
              console.log('Mammoth conversion result:', {
                htmlLength: result.value.length,
                messagesCount: result.messages.length,
              });
              
              if (result.value && result.value.trim().length > 0) {
                editorRef.current.innerHTML = result.value;
              } else {
                editorRef.current.innerHTML = '<p>Документ порожній або не містить текстового контенту.</p>';
              }
              
              if (result.messages.length > 0) {
                console.warn('Mammoth conversion warnings:', result.messages);
              }
            } catch (conversionError) {
              console.error('DOCX conversion error:', conversionError);
              editorRef.current.innerHTML = `
                <div style="padding: 20px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; margin-bottom: 20px;">
                  <p style="margin: 0; color: #991b1b;">
                    <strong>Помилка:</strong> ${conversionError instanceof Error ? conversionError.message : 'Не вдалося завантажити вміст DOCX файлу'}
                  </p>
                  <p style="margin-top: 10px; font-size: 12px; color: #991b1b;">
                    URL: ${doc.fileUrl}
                  </p>
                </div>
                <h2>Ваші нотатки</h2>
                <p>Почніть додавати нотатки до цього документа...</p>
              `;
            }
          }
          // Для PDF файлів показуємо повідомлення
          else if (doc.mimeType === 'application/pdf') {
            editorRef.current.innerHTML = `
              <div style="padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #64748b;">
                  <strong>Примітка:</strong> Редагування PDF файлів поки не підтримується. 
                  Ви можете створити текстовий документ або завантажити новий файл.
                </p>
              </div>
              <h2>Опис документа</h2>
              <p>Назва: ${doc.name}</p>
              <p>Категорія: ${doc.category}</p>
              <p>Дата створення: ${new Date(doc.createdAt).toLocaleDateString()}</p>
              <h2>Ваші нотатки</h2>
              <p>Почніть додавати нотатки до цього документа...</p>
            `;
          }
          // Для текстових файлів
          else if (doc.mimeType === 'text/plain') {
            try {
              // Use backend proxy to avoid CORS issues
              const proxyUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/documents/${id}/file`;
              const token = localStorage.getItem('accessToken');
              console.log('Loading TXT file from:', proxyUrl);
              console.log('Token exists:', !!token);

              const response = await fetch(proxyUrl, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              console.log('TXT fetch response:', response.status, response.ok);

              if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
              }

              const text = await response.text();
              console.log('TXT content length:', text.length);
              editorRef.current.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit;">${text}</pre>`;
            } catch (textError) {
              console.error('Text file loading error:', textError);
              editorRef.current.innerHTML = '<p>Помилка завантаження файлу. Перевірте консоль.</p>';
            }
          }
          // Для інших файлів
          else {
            editorRef.current.innerHTML = '<p>Почніть редагувати документ...</p>';
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError('Сталася помилка при завантаженні документа');
        setLoading(false);
      }
    };
    
    loadDocument();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSave = async () => {
    if (!editorRef.current || !id) return;

    setSaving(true);
    const content = editorRef.current.innerHTML;

    console.log('Saving content:', content);

    try {
      const response = await documentsApi.updateContent(parseInt(id), content);
      
      if (response.success) {
        console.log('Content saved successfully');
        // Можна показати повідомлення про успішне збереження
      } else {
        console.error('Failed to save:', response.error);
        alert('Помилка при збереженні: ' + response.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Не вдалося зберегти зміни');
    } finally {
      setSaving(false);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400">Завантаження...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4 text-red-600">
            <AlertCircle size={24} />
            <h2 className="text-lg font-semibold">Помилка</h2>
          </div>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="w-full px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
          >
            Повернутися назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={18} />
            <span className="hidden md:inline">Назад</span>
          </button>
          <div className="h-6 w-px bg-slate-200 hidden md:block" />
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-slate-400" />
            <div className="flex flex-col">
              <input
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                className="text-sm font-medium text-slate-800 bg-transparent border-none outline-none focus:ring-0 w-full md:w-auto"
                placeholder="Назва документа"
              />
              {document && (
                <span className="text-xs text-slate-400">
                  {document.company?.name} • {document.category}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          <span className="hidden md:inline">{saving ? 'Збереження...' : 'Зберегти'}</span>
        </button>
      </header>

      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-2 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => execCommand('undo')}
          className="p-2 rounded hover:bg-slate-100 text-slate-600"
          title="Скасувати"
        >
          <Undo size={18} />
        </button>
        <button
          onClick={() => execCommand('redo')}
          className="p-2 rounded hover:bg-slate-100 text-slate-600"
          title="Повторити"
        >
          <Redo size={18} />
        </button>
        
        <div className="w-px h-6 bg-slate-200 mx-1" />
        
        <button
          onClick={() => execCommand('bold')}
          className="p-2 rounded hover:bg-slate-100 text-slate-600"
          title="Жирний"
        >
          <Bold size={18} />
        </button>
        <button
          onClick={() => execCommand('italic')}
          className="p-2 rounded hover:bg-slate-100 text-slate-600"
          title="Курсив"
        >
          <Italic size={18} />
        </button>
        <button
          onClick={() => execCommand('underline')}
          className="p-2 rounded hover:bg-slate-100 text-slate-600"
          title="Підкреслений"
        >
          <Underline size={18} />
        </button>
        
        <div className="w-px h-6 bg-slate-200 mx-1" />
        
        <button
          onClick={() => execCommand('justifyLeft')}
          className="p-2 rounded hover:bg-slate-100 text-slate-600"
          title="По лівому краю"
        >
          <AlignLeft size={18} />
        </button>
        <button
          onClick={() => execCommand('justifyCenter')}
          className="p-2 rounded hover:bg-slate-100 text-slate-600"
          title="По центру"
        >
          <AlignCenter size={18} />
        </button>
        <button
          onClick={() => execCommand('justifyRight')}
          className="p-2 rounded hover:bg-slate-100 text-slate-600"
          title="По правому краю"
        >
          <AlignRight size={18} />
        </button>
        
        <div className="w-px h-6 bg-slate-200 mx-1" />
        
        <button
          onClick={() => execCommand('insertUnorderedList')}
          className="p-2 rounded hover:bg-slate-100 text-slate-600"
          title="Маркований список"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => execCommand('insertOrderedList')}
          className="p-2 rounded hover:bg-slate-100 text-slate-600"
          title="Нумерований список"
        >
          <ListOrdered size={18} />
        </button>
        
        <div className="w-px h-6 bg-slate-200 mx-1" />
        
        <select
          onChange={(e) => execCommand('fontSize', e.target.value)}
          className="px-2 py-1 rounded border border-slate-200 text-sm text-slate-600 bg-white"
          defaultValue="3"
        >
          <option value="1">Дуже малий</option>
          <option value="2">Малий</option>
          <option value="3">Звичайний</option>
          <option value="4">Середній</option>
          <option value="5">Великий</option>
          <option value="6">Дуже великий</option>
          <option value="7">Максимальний</option>
        </select>
        
        <select
          onChange={(e) => execCommand('formatBlock', e.target.value)}
          className="px-2 py-1 rounded border border-slate-200 text-sm text-slate-600 bg-white ml-2"
          defaultValue="p"
        >
          <option value="p">Параграф</option>
          <option value="h1">Заголовок 1</option>
          <option value="h2">Заголовок 2</option>
          <option value="h3">Заголовок 3</option>
          <option value="h4">Заголовок 4</option>
        </select>
      </div>

      <main className="flex-1 p-4 md:p-6 flex justify-center">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-sm border border-slate-200 p-8 md:p-12">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="min-h-[600px] outline-none prose prose-slate max-w-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-4"
            style={{
              fontSize: '16px',
              lineHeight: '1.6',
              color: '#1e293b',
            }}
          />
        </div>
      </main>
    </div>
  );
};
