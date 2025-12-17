# ⚡ Швидкий старт

## Локальна розробка (Docker)

```bash
# 1. Запустіть все
docker-compose up -d

# 2. Перевірте
docker-compose ps
docker-compose logs -f backend

# 3. Відкрийте
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
# MinIO Console: http://localhost:9001
```

## Деплой на Vercel + Railway

### Frontend (Vercel)
1. Підключіть GitHub repo
2. Environment: `VITE_API_URL=https://your-backend.railway.app/api`
3. Deploy

### Backend (Railway)
1. Підключіть GitHub repo
2. Root Directory: `backend`
3. Add PostgreSQL database
4. Build: `npm install && npx prisma generate && npm run build`
5. Start: `npx prisma db push && npm start`
6. Додайте env змінні з `backend/.env.example`

## Генерація секретів

```bash
openssl rand -base64 32  # для JWT_SECRET
openssl rand -base64 32  # для JWT_REFRESH_SECRET
```

## Детальна інструкція

Дивіться `DEPLOYMENT.md` та `PLATFORM_GUIDES.md`
