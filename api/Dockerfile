# BOX iT API — imagen de producción (multi-stage).
# Contexto de build = raíz del monorepo (ver docker-compose.prod.yml).
# NOTA: definido y listo para deploy, todavía no construido en Fase 1.

# ---------- builder ----------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable
WORKDIR /repo

# Copiamos TODOS los manifiestos del workspace primero (pnpm necesita el grafo
# completo aunque instalemos sólo la API) para cachear la instalación.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY api/package.json ./api/package.json
COPY web/package.json ./web/package.json

RUN pnpm install --frozen-lockfile

# Código de la API
COPY api ./api

RUN pnpm --filter @box-it/api exec prisma generate
RUN pnpm --filter @box-it/api build

# Bundle prod autocontenido en /out (node_modules aplanado, solo deps de prod).
# --legacy: pnpm v10+ exige inject-workspace-packages salvo con este flag.
RUN pnpm --filter @box-it/api deploy --prod --legacy /out
# Regeneramos el cliente Prisma dentro de /out (el generado no viaja con deploy)
RUN cd /out && node node_modules/prisma/build/index.js generate

# ---------- runner ----------
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV API_PORT=3001

COPY --from=builder /out/dist ./dist
COPY --from=builder /out/node_modules ./node_modules
COPY --from=builder /out/prisma ./prisma
COPY --from=builder /out/package.json ./package.json

EXPOSE 3001

# Aplica migraciones pendientes y arranca la API
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node dist/main.js"]
