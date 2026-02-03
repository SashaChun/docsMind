# Дизайн функціональності перейменування файлів, папок і документів

**Дата:** 2026-02-03
**Статус:** Затверджено

## Огляд

Додавання можливості перейменування документів, папок та компаній у додатку docsMind з інлайн редагуванням для документів і папок, та збереженням існуючого модального вікна для компаній.

## Об'єкти перейменування

### Документи
- Інлайн редагування назви (подвійний клік або кнопка)
- Синхронізація полів `name` і `fileName`
- Захист розширення файлу від зміни

### Папки
- Інлайн редагування назви (подвійний клік або кнопка)
- Оновлення поля `name`

### Компанії
- Тільки через існуюче модальне вікно `EditCompanyModal`
- Без інлайн редагування (компанія має багато полів)

## Способи активації

### Для документів і папок:
1. **Подвійний клік** на назві → активує інлайн редагування
2. **Кнопка "Перейменувати"** (іконка Edit2) поруч з іншими кнопками → активує інлайн редагування

### Для компаній:
- Залишається існуюча кнопка "Редагувати" яка відкриває повну модалку

## Поведінка інлайн редагування

### Активація:
- Назва перетворюється на input поле
- Автоматичний фокус на поле
- Весь текст виділяється для швидкого перезапису
- Візуальний індикатор: border-2 border-blue-500, bg-blue-50

### Клавіатурні команди:
- **Enter** → зберегти зміни
- **Escape** → скасувати зміни, повернути оригінальну назву
- **Клік поза полем** → зберегти зміни (як Enter)

### Стан компонента:
```typescript
const [editingItemId, setEditingItemId] = useState<number | null>(null);
const [editingItemType, setEditingItemType] = useState<'document' | 'folder' | null>(null);
const [editingValue, setEditingValue] = useState('');
const [editingError, setEditingError] = useState('');
```

## Валідація

### Валідація символів

**Дозволені символи:**
- Латинські букви: a-z, A-Z
- Українські букви: а-я, А-Я, і, ї, є, ґ (та їх великі варіанти)
- Цифри: 0-9
- Пробіли, дефіси (-), підкреслення (_)

**Регулярний вираз:**
```regex
/^[a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9\s_-]+$/
```

### Валідація дублікатів

**Для документів** - перевіряти в межах:
- Тієї ж папки (якщо `folderId` вказаний)
- Тієї ж категорії та `companyId` (якщо документ без папки)

**Для папок** - перевіряти в межах:
- Тієї ж категорії та `companyId`

### Захист розширення файлу

При перейменуванні документа:
1. Отримати оригінальне розширення з `fileName` (наприклад: `.pdf`)
2. Дозволити користувачу редагувати повну назву
3. При збереженні перевірити чи розширення не змінилося
4. Якщо змінилося → автоматично повернути оригінальне розширення
5. Показати повідомлення: "Розширення файлу не можна змінити"

### Повідомлення про помилки

- **Порожня назва:** "Назва не може бути порожньою"
- **Неприпустимі символи:** "Назва містить заборонені символи. Дозволені: літери, цифри, пробіли, дефіси, підкреслення"
- **Дублікат документа:** "Документ з такою назвою вже існує"
- **Дублікат папки:** "Папка з такою назвою вже існує"

## UI Реалізація

### Зміни в DocumentsList.tsx

#### Функція активації редагування:
```typescript
const startEditing = (id: number, currentName: string, type: 'document' | 'folder') => {
  setEditingItemId(id);
  setEditingItemType(type);
  setEditingValue(currentName);
  setEditingError('');
};
```

#### Рендер назви:
```typescript
{editingItemId === doc.id && editingItemType === 'document' ? (
  <div>
    <input
      type="text"
      value={editingValue}
      onChange={(e) => setEditingValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleSaveRename}
      className="font-medium text-slate-800 px-2 py-1 border-2 border-blue-500 rounded focus:outline-none bg-blue-50"
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
```

#### Кнопка "Перейменувати":
```typescript
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
```

### Нові props для DocumentsList:
```typescript
interface DocumentsListProps {
  // ... існуючі props
  onRenameDocument?: (documentId: number, newName: string) => Promise<void>;
  onRenameFolder?: (folderId: number, newName: string) => Promise<void>;
}
```

## Логіка збереження

### Функція валідації:
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

### Функція збереження:
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

  // Викликати callback
  if (editingItemType === 'document') {
    await onRenameDocument(editingItemId, finalName);
  } else {
    await onRenameFolder(editingItemId, finalName);
  }

  // Скинути стан
  setEditingItemId(null);
  setEditingItemType(null);
  setEditingValue('');
  setEditingError('');
};
```

## API Інтеграція

### Нові методи в services/api.ts:

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

export const renameFolder = async (folderId: number, newName: string): Promise<FolderType> => {
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

### Інтеграція в Dashboard.tsx:

```typescript
const handleRenameDocument = async (documentId: number, newName: string) => {
  try {
    const updatedDoc = await renameDocument(documentId, newName);
    setDocuments(prev =>
      prev.map(doc => doc.id === documentId ? updatedDoc : doc)
    );
    alert('Документ успішно перейменовано');
  } catch (error) {
    console.error('Rename error:', error);
    alert(error.message || 'Помилка перейменування');
  }
};

const handleRenameFolder = async (folderId: number, newName: string) => {
  try {
    const updatedFolder = await renameFolder(folderId, newName);
    setFolders(prev =>
      prev.map(folder => folder.id === folderId ? updatedFolder : folder)
    );
    alert('Папку успішно перейменовано');
  } catch (error) {
    console.error('Rename error:', error);
    alert(error.message || 'Помилка перейменування');
  }
};
```

### Бекенд endpoints (очікувані):
- `PATCH /api/documents/:id/rename` - body: `{ name: string }`
- `PATCH /api/folders/:id/rename` - body: `{ name: string }`

**Бекенд повинен:**
1. Валідувати назву (ті ж правила)
2. Перевірити дублікати в межах категорії/папки
3. Для документів - оновити обидва поля `name` і `fileName`
4. Повернути оновлений об'єкт

## Обробка помилок та крайні випадки

### Відображення помилок
Помилки валідації показуються під input полем:
```typescript
{editingError && (
  <div className="text-xs text-red-600 mt-1">
    {editingError}
  </div>
)}
```

### Крайні випадки

#### 1. Перейменування під час режиму вибору
- Вимкнути подвійний клік якщо `isSelectionMode === true`
- Приховати кнопку "Перейменувати" в режимі вибору

#### 2. Перейменування під час drag & drop
- Вимкнути подвійний клік якщо елемент в процесі перетягування
- Тимчасово вимкнути draggable при активному редагуванні

#### 3. Одночасне редагування
- Дозволити редагувати тільки один елемент за раз
- При активації нового редагування - скасувати попереднє автоматично

#### 4. Мережеві помилки
- При помилці API - показати повідомлення і залишити поле редагування відкритим
- Користувач може виправити і спробувати знову

#### 5. Довгі назви
- В input полі дозволити горизонтальну прокрутку
- Після збереження - truncate в UI з tooltip (title атрибут)

### Покращення UX

- **Loading стан:** Disabled input + spinner під час збереження
- **Smooth transition:** Плавний перехід між h4 і input
- **Виділення тексту:** Весь текст виділяється при активації (для швидкого перезапису)
- **Scroll position:** Зберігати позицію прокрутки після перейменування
- **Візуальний фідбек:** Підсвічування поля при редагуванні

### Доступність

- `aria-label="Перейменувати"` для кнопки
- Підтримка Tab навігації
- Screen reader анонси про зміни статусу

## Послідовність імплементації

1. **Додати стан редагування** в DocumentsList.tsx
2. **Реалізувати UI** для інлайн редагування (input поле, кнопка)
3. **Додати валідацію** на фронтенді
4. **Створити API методи** в services/api.ts
5. **Інтегрувати в Dashboard.tsx** (handlers)
6. **Додати обробку помилок** та крайніх випадків
7. **Тестування** всіх сценаріїв
8. **Покращення UX** (loading, transitions, accessibility)

## Тестові сценарії

- [ ] Подвійний клік активує редагування
- [ ] Кнопка "Перейменувати" активує редагування
- [ ] Enter зберігає зміни
- [ ] Escape скасовує зміни
- [ ] Клік поза полем зберігає зміни
- [ ] Валідація порожньої назви
- [ ] Валідація неприпустимих символів
- [ ] Валідація дублікатів документів у папці
- [ ] Валідація дублікатів папок у категорії
- [ ] Захист розширення файлу працює
- [ ] Перейменування не працює в режимі вибору
- [ ] Перейменування не конфліктує з drag & drop
- [ ] Мережеві помилки обробляються правильно
- [ ] Довгі назви відображаються коректно
- [ ] Українські букви працюють правильно
