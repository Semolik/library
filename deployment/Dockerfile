FROM node:20-alpine

WORKDIR /app

# Копируем root файлы
COPY package*.json ./
COPY .npmrc ./
COPY tsconfig.json ./
COPY turbo.json ./

# Копируем packages
COPY packages ./packages

# Копируем api приложение
COPY apps/api ./apps/api

# Устанавливаем зависимости
RUN npm ci

# Собираем API через turbo
RUN npm run build -- --filter=@workspace/api

# Переходим в директорию api для запуска
WORKDIR /app/apps/api

EXPOSE 3001

CMD ["npm", "start"]

