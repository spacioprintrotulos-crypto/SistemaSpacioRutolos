FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "index.js"]
