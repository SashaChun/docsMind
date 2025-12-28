#!/bin/bash

# Налаштування CORS для MinIO
docker-compose exec minio mc alias set myminio http://localhost:9000 minioadmin minioadmin
docker-compose exec minio mc anonymous set download myminio/documents
docker-compose exec minio mc cors set myminio/documents --cors-config '{"CORSRules":[{"AllowedOrigins":["*"],"AllowedMethods":["GET","HEAD"],"AllowedHeaders":["*"],"ExposeHeaders":["ETag"]}]}'

echo "MinIO CORS configured successfully!"
