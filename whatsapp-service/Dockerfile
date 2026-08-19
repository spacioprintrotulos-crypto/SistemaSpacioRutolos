FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install --production

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "index.js"]
