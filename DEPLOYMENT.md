# 🚀 Deployment Guide

## Швидкий старт

### 1. Налаштування Environment Variables

```bash
# Frontend
cp .env.example .env
# Відредагуйте .env

# Backend
cp backend/.env.example backend/.env
# Відредагуйте backend/.env
```

### 2. Згенеруйте секрети

```bash
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # JWT_REFRESH_SECRET
```

### 3. Запуск

**Docker:**
```bash
docker-compose up -d --build
```

**Вручну:**
```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run build
npm start

# Frontend
npm install
npm run build
```

---

## Платформи

### Vercel (Frontend)
1. Import GitHub repo
2. Environment: `VITE_API_URL=https://your-api.com/api`
3. Deploy

### Railway (Backend)
1. Import GitHub repo → папка `backend`
2. Build: `npm install && npx prisma generate && npm run build`
3. Start: `npx prisma db push && npm start`
4. Додайте PostgreSQL database
5. Додайте всі env змінні з `backend/.env.example`

### Render (Backend)
1. New Web Service → GitHub repo
2. Root Directory: `backend`
3. Build: `npm install && npx prisma generate && npm run build`
4. Start: `npx prisma db push && npm start`
5. Додайте PostgreSQL database
6. Додайте всі env змінні

---

## Environment Variables

### Frontend (.env)
- `VITE_API_URL` - URL вашого backend API (з `/api`)

### Backend (backend/.env)
- `NODE_ENV` - production
- `PORT` - 3000
- `API_URL` - публічний URL backend
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - секрет для JWT (32+ chars)
- `JWT_REFRESH_SECRET` - секрет для refresh токенів (32+ chars)
- `MINIO_ENDPOINT` - MinIO/S3 host
- `MINIO_ACCESS_KEY` - MinIO/S3 access key
- `MINIO_SECRET_KEY` - MinIO/S3 secret key
- `MINIO_BUCKET` - назва bucket (documents)
- `MINIO_USE_SSL` - true для production
- `FRONTEND_URL` - URL вашого frontend (для CORS)

---

## Чеклист

- [ ] `.env` файли створені і заповнені
- [ ] JWT секрети згенеровані
- [ ] Database підключена
- [ ] MinIO/S3 налаштований
- [ ] CORS налаштований (FRONTEND_URL)
- [ ] Build проходить без помилок
- [ ] Реєстрація працює
- [ ] Завантаження файлів працює

---

## Troubleshooting

**CORS помилки:**
- Перевірте `FRONTEND_URL` в backend/.env

**Database помилки:**
- Перевірте формат `DATABASE_URL`
- Формат: `postgresql://USER:PASSWORD@HOST:5432/DB?schema=public`

**MinIO помилки:**
- Створіть bucket вручну
- Перевірте `MINIO_USE_SSL=true` для production

**API 404:**
- Перевірте `VITE_API_URL` закінчується на `/api`
