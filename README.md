# BOX iT

PWA mobile-first de tracking de entrenos de gimnasio. Trackeá cada serie, en vivo.

- **API**: NestJS 11 + Prisma + PostgreSQL 17
- **Web**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind (mobile-first, PWA con Serwist)
- **Auth**: JWT en cookies httpOnly (access + refresh con rotación) — _Fase 2_
- **Monorepo**: pnpm workspaces (`api/`, `web/`)

## Requisitos

- Node >= 20 (probado con 24)
- pnpm >= 9 (probado con 11.6)
- Docker + Docker Compose (para Postgres)

## Puesta en marcha (desarrollo)

```bash
# 1) Variables de entorno
cp .env.example .env               # docker-compose (Postgres)
cp .env.example api/.env           # Prisma/Nest leen de acá
cp web/.env.example web/.env.local # Next lee de acá (NEXT_PUBLIC_API_URL)

# 2) Instalar dependencias
pnpm install

# 3) Levantar Postgres 17
pnpm dev:db

# 4) Migrar la base y sembrar la librería de ejercicios
pnpm db:migrate
pnpm db:seed

# 5) Levantar API y Web (en dos terminales)
pnpm dev:api     # http://localhost:3001/api
pnpm dev:web     # http://localhost:3000
```

### Verificar

- API: `GET http://localhost:3001/api/exercises` devuelve la librería sembrada.
- Web: abrí `http://localhost:3000` en el navegador (dark, marca BOX iT).
- PWA: en Chrome DevTools → Application → Manifest / Service Workers; instalable
  desde `localhost` o por HTTPS en el celular.

## Estructura

```
box-it/
├─ api/                 # NestJS + Prisma
├─ web/                 # Next.js (App Router) + Tailwind + PWA
├─ nginx/               # reverse proxy (prod)
├─ docker-compose.yml         # dev: solo Postgres
└─ docker-compose.prod.yml    # prod: db + api + web + nginx
```

## Producción (listo, sin deployar todavía)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Nginx sirve el front y proxya `/api` a la API. El TLS (443) se agrega con certbot
en el VPS.

## Fases

1. **Scaffolding** ✅
2. **Auth JWT con cookies httpOnly** ✅
3. **API de entrenos** ✅
4. **Pantalla de entreno en vivo** ✅
5. **Rutinas / plantillas** ✅
6. **Historial + PRs** ✅
