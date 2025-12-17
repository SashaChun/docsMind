#!/bin/bash

# Генерація секретів для production

echo "🔐 Генерація нових секретів..."
echo ""

JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 24)

echo "✅ Секрети згенеровані!"
echo ""
echo "📋 Скопіюйте ці значення в backend/.env:"
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo ""
echo "💡 Для PostgreSQL password (якщо потрібно):"
echo "POSTGRES_PASSWORD=$DB_PASSWORD"
echo ""
echo "⚠️  Збережіть ці секрети в безпечному місці!"
