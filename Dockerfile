# Офіційний образ Playwright з уже встановленими браузерами
# Версія відповідає @playwright/test 1.56.1 з твого package.json
FROM mcr.microsoft.com/playwright:v1.56.1-jammy

# Робоча директорія всередині контейнера
WORKDIR /app

# Спочатку копіюємо package.json + package-lock.json
COPY package*.json ./

# Встановлюємо залежності (включно з dev, бо @playwright/test нам потрібен)
RUN npm install

# Далі копіюємо весь проєкт
COPY . .

# Прод-режим (опціонально)
ENV NODE_ENV=production

# Railway сам передасть PORT через env, server.js вже читає process.env.PORT
CMD ["npm", "start"]
