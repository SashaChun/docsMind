#!/bin/bash

# Автоматичне оновлення backend/.env з новими секретами

echo "🔐 Генерація нових секретів..."

JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

if [ ! -f "backend/.env" ]; then
    echo "❌ Файл backend/.env не знайдено!"
    echo "📝 Створіть його з backend/.env.example"
    exit 1
fi

echo "📝 Оновлення backend/.env..."

# Backup
cp backend/.env backend/.env.backup

# Update JWT_SECRET
if grep -q "^JWT_SECRET=" backend/.env; then
    sed -i.tmp "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" backend/.env
else
    echo "JWT_SECRET=$JWT_SECRET" >> backend/.env
fi

# Update JWT_REFRESH_SECRET
if grep -q "^JWT_REFRESH_SECRET=" backend/.env; then
    sed -i.tmp "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" backend/.env
else
    echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET" >> backend/.env
fi

# Cleanup
rm -f backend/.env.tmp

echo "✅ Секрети оновлені!"
echo ""
echo "📋 Нові значення:"
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo ""
echo "💾 Backup збережено: backend/.env.backup"
