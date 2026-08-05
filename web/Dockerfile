# BOX iT Web — imagen de producción (Next.js standalone, multi-stage).
# Contexto de build = raíz del monorepo (ver docker-compose.prod.yml).
# NOTA: definido y listo para deploy, todavía no construido en Fase 1.

# ---------- builder ----------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /repo

# Todos los manifiestos del workspace (pnpm necesita el grafo completo).
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY web/package.json ./web/package.json
COPY api/package.json ./api/package.json
RUN pnpm install --frozen-lockfile

COPY web ./web

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_TELEMETRY_DISABLED=1
# Activa el output "standalone" (Linux soporta symlinks sin problemas)
ENV BUILD_STANDALONE=true
RUN pnpm --filter @box-it/web build

# ---------- runner ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Output "standalone" respeta la estructura del monorepo (carpeta web/)
COPY --from=builder /repo/web/.next/standalone ./
COPY --from=builder /repo/web/.next/static ./web/.next/static
COPY --from=builder /repo/web/public ./web/public

EXPOSE 3000
CMD ["node", "web/server.js"]
