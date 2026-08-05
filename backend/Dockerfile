FROM node:20-alpine AS deps
WORKDIR /app
# Prisma needs OpenSSL to detect the right query-engine binary; node:20-alpine
# ships OpenSSL 3.x but not the openssl package, so install it explicitly.
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run prisma:generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# libssl.so.3 must be present at runtime for the Prisma query engine to load.
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

EXPOSE 4000

# CMD is overridden per-service in docker-compose.yml:
#   api:    node dist/server.js
#   worker: node dist/worker.js
CMD ["node", "dist/server.js"]
