# Kira Backend — ElysiaJS + Bun
FROM oven/bun:1-alpine

WORKDIR /app

# Copy workspace deps
COPY package.json bun.lock ./
COPY backend/package.json ./backend/

RUN cd backend && bun install --production

# Copy source
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/

WORKDIR /app/backend

EXPOSE 3001

CMD ["bun", "run", "src/server.ts"]
