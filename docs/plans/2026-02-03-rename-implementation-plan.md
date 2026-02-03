# Rename Functionality Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Додати можливість перейменування документів та папок з інлайн редагуванням, валідацією та захистом розширення файлів.

**Architecture:** Додати стан редагування до DocumentsList компонента, реалізувати інлайн input з валідацією на фронтенді, створити API методи для збереження змін на бекенді.

**Tech Stack:** React, TypeScript, Vite, lucide-react icons

---

## Task 1: Додати API методи для перейменування

**Files:**
- Modify: `src/services/api.ts` (в кінці файлу)

**Step 1: Додати API метод для перейменування документа**

```typescript
export const renameDocument = async (documentId: number, newName: string): Promise<Document> => {
  const response = await fetch(`/api/documents/${documentId}/rename`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({ name: newName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Помилка перейменування документа');
  }

  return response.json();
};
```

**Step 2: Додати API метод для перейменування папки**

```typescript
export const renameFolder = async (folderId: number, newName: string): Promise<Folder> => {
  const response = await fetch(`/api/folders/${folderId}/rename`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({ name: newName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Помилка перейменування папки');
  }

  return response.json();
};
```

**Step 3: Перевірити що типи імпортовані**

Переконайтесь що в імпортах є:
```typescript
import type { Document, Folder } from '../types';
```

**Step 4: Commit**

```bash
git add src/services/api.ts
git commit -m "feat: add API methods for renaming documents and folders"
```

---

## Task 2: Додати стан редагування в DocumentsList

**Files:**
- Modify: `src/components/DocumentsList.tsx:1-10` (імпорти)
- Modify: `src/components/DocumentsList.tsx:90-98` (після існуючого стану)

**Step 1: Додати імпорт іконки Edit2**

У рядку 2, де імпортуються іконки з lucide-react, додати `Edit2`:

```typescript
import { UploadCloud, FolderOpen, FileText, Share2, Edit, Trash2, Image, Film, File, Folder, ChevronDown, ChevronRight, FolderPlus, Check, X, Edit2 } from 'lucide-react';
```

**Step 2: Додати стан для редагування після існуючого стану**

Після рядка 97 (`const [newFolderName, setNewFolderName] = useState('');`) додати:

```typescript
const [editingItemId, setEditingItemId] = useState<number | null>(null);
const [editingItemType, setEditingItemType] = useState<'document' | 'folder' | null>(null);
const [editingValue, setEditingValue] = useState('');
const [editingError, setEditingError] = useState('');
```

**Step 3: Commit**

```bash
git add src/components/DocumentsList.tsx
git commit -m "feat: add editing state to DocumentsList"
```

---

## Task 3: Додати нові props для DocumentsList

**Files:**
- Modify: `src/components/DocumentsList.tsx:5-20` (інтерфейс DocumentsListProps)

**Step 1: Додати нові props в інтерфейс**

Після рядка 19 (`onCreateFolder?: (name: string, category: string) => void;`) додати:

```typescript
onRenameDocument?: (documentId: number, newName: string) => Promise<void>;
onRenameFolder?: (folderId: number, newName: string) => Promise<void>;
```

**Step 2: Додати props в деструктуризацію**

У функції DocumentsList (після рядка 89), додати до деструктуризації:

```typescript
onRenameDocument,
onRenameFolder,
```

**Step 3: Commit**

```bash
git add src/components/DocumentsList.tsx
git commit -m "feat: add rename props to DocumentsList interface"
```

---

## Task 4: Створити функцію валідації

**Files:**
- Modify: `src/components/DocumentsList.tsx` (після рядка ~205, після handleCreateFolder)

**Step 1: Додати функцію валідації перейменування**

```typescript
const validateRename = (newName: string, id: number, type: 'document' | 'folder'): string | null => {
  // Перевірка на порожню назву
  const trimmed = newName.trim();
  if (!trimmed) {
    return "Назва не може бути порожньою";
  }

  // Перевірка символів
  const validPattern = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9\s_-]+$/;
  if (!validPattern.test(trimmed)) {
    return "Назва містить заборонені символи. Дозволені: літери, цифри, пробіли, дефіси, підкреслення";
  }

  // Перевірка дублікатів
  if (type === 'document') {
    const doc = documents.find(d => d.id === id);
    const duplicates = documents.filter(d =>
      d.id !== id &&
      d.name === trimmed &&
      d.folderId === doc?.folderId &&
      d.category === doc?.category
    );
    if (duplicates.length > 0) {
      return "Документ з такою назвою вже існує";
    }
  } else {
    const folder = folders.find(f => f.id === id);
    const duplicates = folders.filter(f =>
      f.id !== id &&
      f.name === trimmed &&
      f.category === folder?.category
    );
    if (duplicates.length > 0) {
      return "Папка з такою назвою вже існує";
    }
  }

  return null;
};
```

**Step 2: Commit**

```bash
git add src/components/DocumentsList.tsx
git commit -m "feat: add rename validation function"
```

---

## Task 5: Створити функції для керування редагуванням

**Files:**
- Modify: `src/components/DocumentsList.tsx` (після функції validateRename)

**Step 1: Додати функцію активації редагування**

```typescript
const startEditing = (id: number, currentName: string, type: 'document' | 'folder') => {
  setEditingItemId(id);
  setEditingItemType(type);
  setEditingValue(currentName);
  setEditingError('');
};
```

**Step 2: Додати функцію скасування редагування**

```typescript
const cancelEditing = () => {
  setEditingItemId(null);
  setEditingItemType(null);
  setEditingValue('');
  setEditingError('');
};
```

**Step 3: Додати функцію обробки клавіатури**

```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleSaveRename();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    cancelEditing();
  }
};
```

**Step 4: Додати функцію збереження з валідацією та захистом розширення**

```typescript
const handleSaveRename = async () => {
  if (!editingItemId || !editingItemType) return;

  const error = validateRename(editingValue, editingItemId, editingItemType);
  if (error) {
    setEditingError(error);
    return;
  }

  // Для документів - захист розширення
  let finalName = editingValue.trim();
  if (editingItemType === 'document') {
    const doc = documents.find(d => d.id === editingItemId);
    if (doc?.fileName) {
      const originalExt = doc.fileName.split('.').pop();
      const newExt = finalName.split('.').pop();

      if (originalExt !== newExt) {
        const nameWithoutExt = finalName.split('.').slice(0, -1).join('.');
        finalName = `${nameWithoutExt}.${originalExt}`;
        alert("Розширення файлу не можна змінити");
      }
    }
  }

  try {
    // Викликати callback
    if (editingItemType === 'document' && onRenameDocument) {
      await onRenameDocument(editingItemId, finalName);
    } else if (editingItemType === 'folder' && onRenameFolder) {
      await onRenameFolder(editingItemId, finalName);
    }

    // Скинути стан після успішного збереження
    cancelEditing();
  } catch (error) {
    // При помилці залишити поле відкритим
    setEditingError(error instanceof Error ? error.message : 'Помилка збереження');
  }
};
```

**Step 5: Commit**

```bash
git add src/components/DocumentsList.tsx
git commit -m "feat: add editing control functions with validation"
```

---

## Task 6: Оновити рендер назви документа з інлайн редагуванням

**Files:**
- Modify: `src/components/DocumentsList.tsx:248-258` (рендер назви документа в renderDocumentCard)

**Step 1: Замінити h4 на умовний рендер з input**

Знайти блок де рендериться назва документа (приблизно рядок 249-257) і замінити на:

```typescript
<div className="flex-1 min-w-0">
  {editingItemId === doc.id && editingItemType === 'document' ? (
    <div>
      <input
        type="text"
        value={editingValue}
        onChange={(e) => setEditingValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSaveRename}
        className="w-full font-medium text-slate-800 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none bg-blue-50"
        autoFocus
        onClick={(e) => e.stopPropagation()}
      />
      {editingError && (
        <div className="text-xs text-red-600 mt-1">{editingError}</div>
      )}
    </div>
  ) : (
    <h4
      className="font-medium text-slate-800 truncate cursor-text"
      title={doc.name}
      onDoubleClick={() => !isSelectionMode && startEditing(doc.id, doc.name, 'document')}
    >
      {doc.name}
    </h4>
  )}
  <p className="text-xs text-slate-400 mt-0.5">
    {new Date(doc.createdAt).toLocaleDateString()}
  </p>
</div>
```

**Step 2: Commit**

```bash
git add src/components/DocumentsList.tsx
git commit -m "feat: add inline editing UI for document names"
```

---

## Task 7: Додати кнопку перейменування для документів

**Files:**
- Modify: `src/components/DocumentsList.tsx:260-295` (кнопки документа)

**Step 1: Додати кнопку перейменування після кнопки "Перегляд"**

Після кнопки "Перегляд" (приблизно після рядка 266), додати кнопку перейменування перед кнопкою Edit:

```typescript
{!isSelectionMode && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      startEditing(doc.id, doc.name, 'document');
    }}
    className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1"
    title="Перейменувати"
  >
    <Edit2 size={14} />
  </button>
)}
```

**Step 2: Commit**

```bash
git add src/components/DocumentsList.tsx
git commit -m "feat: add rename button for documents"
```

---

## Task 8: Оновити рендер назви папки з інлайн редагуванням

**Files:**
- Modify: `src/components/DocumentsList.tsx:320-336` (рендер назви папки в renderFolderCard)

**Step 1: Замінити h4 назви папки на умовний рендер з input**

Знайти блок де рендериться назва папки (приблизно рядок 319-335) і замінити на:

```typescript
<div className="flex-1 min-w-0">
  <div className="flex items-center gap-2">
    {isExpanded ? (
      <ChevronDown size={16} className="text-slate-400" />
    ) : (
      <ChevronRight size={16} className="text-slate-400" />
    )}
    {editingItemId === folder.id && editingItemType === 'folder' ? (
      <div className="flex-1">
        <input
          type="text"
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveRename}
          className="w-full font-medium text-slate-800 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none bg-blue-50"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
        {editingError && (
          <div className="text-xs text-red-600 mt-1">{editingError}</div>
        )}
      </div>
    ) : (
      <h4
        className="font-medium text-slate-800 truncate cursor-text"
        title={folder.name}
        onDoubleClick={(e) => {
          e.stopPropagation();
          startEditing(folder.id, folder.name, 'folder');
        }}
      >
        {folder.name}
      </h4>
    )}
  </div>
  <p className="text-xs text-slate-400 mt-0.5">
    {folderDocs.length} файлів • {new Date(folder.createdAt).toLocaleDateString()}
  </p>
</div>
```

**Step 2: Commit**

```bash
git add src/components/DocumentsList.tsx
git commit -m "feat: add inline editing UI for folder names"
```

---

## Task 9: Додати кнопку перейменування для папок

**Files:**
- Modify: `src/components/DocumentsList.tsx:337-362` (кнопки папки)

**Step 1: Додати кнопку перейменування перед кнопкою Share**

Перед блоком кнопки Share папки (приблизно рядок 338), додати:

```typescript
<button
  onClick={(e) => {
    e.stopPropagation();
    startEditing(folder.id, folder.name, 'folder');
  }}
  className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1"
  title="Перейменувати папку"
>
  <Edit2 size={14} />
</button>
```

**Step 2: Commit**

```bash
git add src/components/DocumentsList.tsx
git commit -m "feat: add rename button for folders"
```

---

## Task 10: Інтегрувати обробники перейменування в Dashboard

**Files:**
- Modify: `src/components/Dashboard.tsx` (знайти де імпортується api, додати handlers)

**Step 1: Додати імпорт API методів**

У блоці імпортів з `../services/api`, додати:

```typescript
import { renameDocument, renameFolder } from '../services/api';
```

**Step 2: Створити обробник перейменування документа**

Додати функцію після інших handlers (наприклад, після handleDeleteDocument):

```typescript
const handleRenameDocument = async (documentId: number, newName: string) => {
  try {
    const updatedDoc = await renameDocument(documentId, newName);
    setDocuments(prev =>
      prev.map(doc => doc.id === documentId ? updatedDoc : doc)
    );
  } catch (error) {
    console.error('Rename document error:', error);
    alert(error instanceof Error ? error.message : 'Помилка перейменування документа');
    throw error; // Re-throw щоб DocumentsList міг обробити помилку
  }
};
```

**Step 3: Створити обробник перейменування папки**

```typescript
const handleRenameFolder = async (folderId: number, newName: string) => {
  try {
    const updatedFolder = await renameFolder(folderId, newName);
    setFolders(prev =>
      prev.map(folder => folder.id === folderId ? updatedFolder : folder)
    );
  } catch (error) {
    console.error('Rename folder error:', error);
    alert(error instanceof Error ? error.message : 'Помилка перейменування папки');
    throw error;
  }
};
```

**Step 4: Передати обробники в DocumentsList**

Знайти компонент `<DocumentsList>` і додати props:

```typescript
onRenameDocument={handleRenameDocument}
onRenameFolder={handleRenameFolder}
```

**Step 5: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat: integrate rename handlers in Dashboard"
```

---

## Task 11: Мануальне тестування функціональності

**Step 1: Запустити dev сервер**

```bash
npm run dev
```

**Step 2: Перевірити базову функціональність**

Відкрити браузер і протестувати:
- [ ] Подвійний клік на назві документа активує редагування
- [ ] Подвійний клік на назві папки активує редагування
- [ ] Кнопка Edit2 активує редагування для документів
- [ ] Кнопка Edit2 активує редагування для папок
- [ ] Enter зберігає зміни
- [ ] Escape скасовує зміни
- [ ] Клік поза полем зберігає зміни

**Step 3: Перевірити валідацію**

- [ ] Порожня назва показує помилку "Назва не може бути порожньою"
- [ ] Спецсимволи (/, \, *, тощо) показують помилку про заборонені символи
- [ ] Дублікат назви документа в папці показує помилку
- [ ] Дублікат назви папки показує помилку
- [ ] Українські букви працюють правильно

**Step 4: Перевірити захист розширення**

- [ ] При зміні .pdf на .txt розширення залишається .pdf
- [ ] Показується alert "Розширення файлу не можна змінити"

**Step 5: Перевірити крайні випадки**

- [ ] В режимі вибору (selection mode) подвійний клік не активує редагування
- [ ] Кнопка перейменування прихована в режимі вибору
- [ ] Можна редагувати тільки один елемент за раз
- [ ] Довгі назви відображаються коректно

**Step 6: Записати результати тестування**

Створити файл `docs/testing/rename-manual-tests.md` з результатами:

```markdown
# Результати мануального тестування перейменування

Дата: 2026-02-03

## Базова функціональність
- [x/✗] Подвійний клік на документі
- [x/✗] Подвійний клік на папці
...

## Виявлені проблеми
1. [Опис проблеми якщо є]
```

**Step 7: Commit результатів тестування**

```bash
git add docs/testing/rename-manual-tests.md
git commit -m "test: add manual testing results for rename functionality"
```

---

## Task 12: Фінальна перевірка та очищення коду

**Step 1: Перевірити всі файли на console.log**

```bash
grep -r "console.log" src/components/DocumentsList.tsx src/components/Dashboard.tsx src/services/api.ts
```

Видалити всі debug console.log якщо є.

**Step 2: Перевірити TypeScript помилки**

```bash
npm run build
```

Виправити всі TypeScript помилки якщо є.

**Step 3: Перевірити ESLint**

```bash
npm run lint
```

Виправити критичні ESLint помилки.

**Step 4: Commit якщо були зміни**

```bash
git add .
git commit -m "chore: cleanup and fix linting issues"
```

**Step 5: Перевірити git status**

```bash
git status
```

Переконатись що немає uncommitted змін.

---

## Підсумок виконаних задач

Після виконання всіх задач ви матимете:

1. ✅ API методи для перейменування документів і папок
2. ✅ Інлайн редагування назв документів (подвійний клік + кнопка)
3. ✅ Інлайн редагування назв папок (подвійний клік + кнопка)
4. ✅ Валідація: порожні назви, неприпустимі символи, дублікати
5. ✅ Захист розширення файлів від зміни
6. ✅ Обробка помилок і відображення їх користувачу
7. ✅ Інтеграція з Dashboard компонентом
8. ✅ Мануальне тестування всіх сценаріїв

**Готовність до merge:**
- Всі коміти зроблені з чіткими повідомленнями
- Код протестований мануально
- Немає TypeScript/ESLint помилок
- Готово до code review

**Наступні кроки:**
Використати @superpowers:finishing-a-development-branch для створення PR або merge в main.
