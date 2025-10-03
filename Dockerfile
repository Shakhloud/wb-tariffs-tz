FROM node:18-alpine

WORKDIR /app

# Устанавливаем зависимости для postgres клиента
RUN apk add --no-cache postgresql-client

# Копируем package.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем ВСЕ исходные файлы включая конфиги
COPY . .

# Компилируем TypeScript
RUN npm run build

# Создаем пользователя
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 && \
    chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 3000

CMD ["npm", "start"]