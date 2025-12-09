# Виправлення проблеми з порожніми файлами

## Проблема
Файл `1765219309976-file.docx` має розмір 0 байт в MinIO. Це сталося до того, як була додана валідація.

## Рішення

### Варіант 1: Видалити через UI (Рекомендовано)

1. Відкрийте додаток: http://localhost:5173
2. Знайдіть документ "file.docx" (або з ID 7)
3. Натисніть кнопку видалення документа
4. Завантажте новий DOCX файл

### Варіант 2: Видалити через MinIO Console

1. Відкрийте MinIO Console: http://localhost:9001
2. Логін: `minioadmin` / Пароль: `minioadmin`
3. Перейдіть в bucket `documents`
4. Знайдіть файл `1765219309976-file.docx`
5. Видаліть його
6. Потім видаліть запис з бази даних або через UI

### Варіант 3: Видалити через API

```bash
# Отримайте токен авторизації (замініть email та password)
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  | jq -r '.data.accessToken')

# Видаліть документ (замініть 7 на ID вашого документа)
curl -X DELETE http://localhost:3000/api/documents/7 \
  -H "Authorization: Bearer $TOKEN"
```

## Після видалення

1. **Завантажте новий DOCX файл** через UI
2. **Перевірте розмір файлу** - тепер він буде відображатися в модальному вікні
3. **Відкрийте редактор** - DOCX контент має з'явитися

## Перевірка логів

Тепер при завантаженні файлу в логах бекенду буде:

```
File upload details: {
  originalname: 'example.docx',
  mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  size: 12345,
  bufferLength: 12345
}
```

Перегляньте логи:
```bash
docker-compose logs backend -f
```

## Що було виправлено

✅ Додано валідацію порожніх файлів на бекенді
✅ Додано валідацію порожніх файлів на фронтенді
✅ Додано відображення розміру файлу
✅ Додано детальне логування завантаження
✅ Додано перевірку максимального розміру (10MB)

Тепер порожні файли не можуть бути завантажені!
