# 🌍 Гайди по деплою на різні платформи

## 1. Vercel (Frontend) + Railway (Backend)

### Frontend на Vercel

1. **Підключення:**
   - Зайдіть на [vercel.com](https://vercel.com)
   - Import Git Repository
   - Виберіть ваш репозиторій

2. **Налаштування:**
   - Framework Preset: `Vite`
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Environment Variables:**
   ```
   VITE_API_URL = https://your-app.railway.app/api
   ```

4. **Deploy!**

### Backend на Railway

1. **Підключення:**
   - Зайдіть на [railway.app](https://railway.app)
   - New Project → Deploy from GitHub repo
   - Виберіть репозиторій

2. **Налаштування:**
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npx prisma db push && npm start`

3. **Додайте PostgreSQL:**
   - Add service → Database → PostgreSQL
   - Railway автоматично створить `DATABASE_URL`

4. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3000
   API_URL=${{RAILWAY_PUBLIC_DOMAIN}}
   DATABASE_URL=${{DATABASE_URL}}
   JWT_SECRET=<згенеруйте>
   JWT_EXPIRE=1h
   JWT_REFRESH_SECRET=<згенеруйте>
   JWT_REFRESH_EXPIRE=7d
   MINIO_ENDPOINT=<ваш MinIO>
   MINIO_PORT=9000
   MINIO_ACCESS_KEY=<ваш ключ>
   MINIO_SECRET_KEY=<ваш секрет>
   MINIO_BUCKET=documents
   MINIO_USE_SSL=true
   MINIO_PUBLIC_ENDPOINT=<публічний домен MinIO>
   FRONTEND_URL=https://your-app.vercel.app
   MAX_FILE_SIZE=10485760
   ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain
   ```

5. **Deploy!**

---

## 2. Netlify (Frontend) + Render (Backend)

### Frontend на Netlify

1. **Підключення:**
   - [netlify.com](https://netlify.com) → Add new site → Import from Git

2. **Налаштування:**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Environment Variables:**
   ```
   VITE_API_URL = https://your-app.onrender.com/api
   ```

### Backend на Render

1. **Підключення:**
   - [render.com](https://render.com) → New → Web Service

2. **Налаштування:**
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npx prisma db push && npm start`

3. **Додайте PostgreSQL:**
   - Dashboard → New → PostgreSQL
   - Скопіюйте Internal Database URL

4. **Environment Variables:** (такі ж як для Railway)

---

## 3. DigitalOcean App Platform (Full Stack)

### Один репозиторій - два сервіси

1. **Створіть App:**
   - [cloud.digitalocean.com](https://cloud.digitalocean.com)
   - Apps → Create App → GitHub

2. **Frontend Component:**
   - Type: Static Site
   - Source Directory: `/`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables:
     ```
     VITE_API_URL=${backend.PUBLIC_URL}/api
     ```

3. **Backend Component:**
   - Type: Web Service
   - Source Directory: `/backend`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Run Command: `npx prisma db push && npm start`
   - HTTP Port: 3000

4. **Database:**
   - Add Resource → Database → PostgreSQL
   - DigitalOcean автоматично створить `DATABASE_URL`

5. **Environment Variables для Backend:**
   ```
   NODE_ENV=production
   PORT=3000
   API_URL=${APP_URL}
   DATABASE_URL=${db.DATABASE_URL}
   FRONTEND_URL=${frontend.PUBLIC_URL}
   # + інші змінні
   ```

---

## 4. AWS (EC2 + RDS + S3)

### Підготовка

1. **RDS (Database):**
   - Створіть PostgreSQL instance
   - Збережіть endpoint і credentials

2. **S3 (Storage):**
   - Створіть bucket `documents`
   - Створіть IAM user з доступом до S3
   - Збережіть Access Key і Secret Key

3. **EC2 (Backend):**
   ```bash
   # SSH на сервер
   ssh -i key.pem ubuntu@your-ec2-ip
   
   # Встановіть Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Встановіть PM2
   sudo npm install -g pm2
   
   # Клонуйте репозиторій
   git clone https://github.com/your-repo.git
   cd your-repo/backend
   
   # Створіть .env
   nano .env
   # Вставте всі змінні
   
   # Build
   npm install
   npx prisma generate
   npm run build
   
   # Запустіть з PM2
   pm2 start dist/index.js --name backend
   pm2 save
   pm2 startup
   ```

4. **Frontend (S3 + CloudFront):**
   ```bash
   # Локально
   npm run build
   
   # Upload до S3
   aws s3 sync dist/ s3://your-frontend-bucket --delete
   
   # Налаштуйте CloudFront distribution
   ```

---

## 5. Docker на VPS (Hetzner/Linode/etc)

### Повний стек на одному сервері

```bash
# SSH на сервер
ssh root@your-server-ip

# Встановіть Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Встановіть Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Клонуйте репозиторій
git clone https://github.com/your-repo.git
cd your-repo

# Створіть .env файли
cp .env.docker.example .env
cp backend/.env.example backend/.env
nano .env
nano backend/.env

# Запустіть
docker-compose -f docker-compose.prod.yml up -d --build

# Перевірте
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

### Nginx для frontend

```nginx
# /etc/nginx/sites-available/your-app
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/your-app/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Активуйте конфіг
sudo ln -s /etc/nginx/sites-available/your-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL з Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 6. Kubernetes (для великих проектів)

### Приклад deployment файлів

**backend-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/backend:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: backend-secrets
```

**frontend-deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: nginx:alpine
        ports:
        - containerPort: 80
        volumeMounts:
        - name: frontend-files
          mountPath: /usr/share/nginx/html
      volumes:
      - name: frontend-files
        configMap:
          name: frontend-dist
```

---

## 🎯 Рекомендації

### Для початківців:
- **Frontend:** Vercel або Netlify
- **Backend:** Railway або Render
- **Database:** Supabase або Neon
- **Storage:** MinIO Cloud або AWS S3

### Для середнього рівня:
- **Full Stack:** DigitalOcean App Platform
- **Database:** Managed PostgreSQL
- **Storage:** S3-compatible

### Для досвідчених:
- **VPS:** Docker Compose на Hetzner/Linode
- **Kubernetes:** GKE/EKS/AKS
- **CDN:** CloudFront або Cloudflare

---

## 💰 Приблизні ціни (на місяць)

| Платформа | Frontend | Backend | Database | Storage | Всього |
|-----------|----------|---------|----------|---------|--------|
| Vercel + Railway | Free | $5 | $5 | $5 | **$15** |
| Netlify + Render | Free | $7 | $7 | $5 | **$19** |
| DigitalOcean | $0 | $5 | $15 | $5 | **$25** |
| AWS | $1 | $10 | $15 | $1 | **$27** |
| VPS (Hetzner) | $0 | $5 | $0 | $0 | **$5** |

*Ціни орієнтовні для малих проектів
