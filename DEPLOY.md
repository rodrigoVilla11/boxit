# Deploy de BOX iT

Stack: **Postgres + API (NestJS) + Web (Next.js)**. Cada servicio se buildea de
su `Dockerfile` (contexto = raíz del repo). Las imágenes están verificadas con
un ensayo local del stack completo.

> **Importante:** el front y la API tienen que quedar en el **mismo dominio**
> (web en `/`, API en `/api`). El auth usa cookies `SameSite=Lax` + `Secure`, así
> que mismo origen = las cookies funcionan sin CORS ni subdominios. Además **Web
> Push y la PWA necesitan HTTPS** (cualquier deploy real debe tener TLS).

---

## Opción A — Easypanel (recomendado)

Easypanel corre en tu VPS y da **reverse proxy (Traefik) + HTTPS automático**, así
que no hace falta el nginx/certbot de este repo.

### 0. Requisitos
- Easypanel instalado en el VPS. Si no: `curl -sSL https://get.easypanel.io | sh`.
- Un **dominio** con record A → IP del VPS. Ej: `boxit.tudominio.com`.
- El repo en un Git accesible (Easypanel buildea desde Git).

### 1. Claves VAPID (una vez)
```bash
docker run --rm node:22-alpine sh -c "npx -y web-push generate-vapid-keys"
```
Guardá la **public** y la **private**.

### 2. Proyecto con 3 servicios

Creá un proyecto (ej. `boxit`) y adentro:

**a) Postgres** — servicio *Database → Postgres 17*.
Anotá el connection string interno. El host interno suele ser `<proyecto>_<nombre>`
(ej. `boxit_db`), puerto 5432.

**b) API** — servicio *App*.
- **Source:** tu repo Git (rama `main`).
- **Build:** Dockerfile → `api/Dockerfile` (build context = raíz, es el default).
- **Environment:**
  ```
  NODE_ENV=production
  DATABASE_URL=postgres://<user>:<pass>@<host-interno>:5432/<db>?schema=public
  CORS_ORIGIN=https://boxit.tudominio.com
  JWT_SECRET=<openssl rand -base64 48>
  JWT_REFRESH_SECRET=<openssl rand -base64 48>
  ADMIN_EMAILS=tu-email@dominio.com
  VAPID_PUBLIC_KEY=<public>
  VAPID_PRIVATE_KEY=<private>
  VAPID_SUBJECT=mailto:tu-email@dominio.com
  ```
- **Port:** 3001.
- **Domain:** `boxit.tudominio.com` con **Path = `/api`**, HTTPS activado.

**c) Web** — servicio *App*.
- **Source:** tu repo Git.
- **Build:** Dockerfile → `web/Dockerfile`.
- **Build Args** (se embeben en el build):
  ```
  NEXT_PUBLIC_API_URL=            (vacío → mismo origen, /api relativo)
  NEXT_PUBLIC_VAPID_PUBLIC_KEY=<la MISMA public key de la API>
  ```
- **Environment** (runtime):
  ```
  NODE_ENV=production
  API_INTERNAL_URL=http://<host-interno-de-la-api>:3001    (ej. http://boxit_api:3001)
  ```
- **Port:** 3000.
- **Domain:** `boxit.tudominio.com` con **Path = `/`**, HTTPS activado.

Traefik enruta `/api/*` a la API y el resto al web, todo en el mismo dominio.

### 3. Deploy
Deploy a cada servicio. La API **corre las migraciones sola** al arrancar
(`prisma migrate deploy`).

### 4. Seed de ejercicios (una vez)
La base nueva arranca vacía; sin los ~23 ejercicios globales no se pueden armar
rutinas. La imagen de la API ya trae `prisma/seed.ts` y el cliente; correlo
**una vez** desde la **consola del servicio API** en Easypanel (Terminal):

```bash
node --experimental-strip-types prisma/seed.ts
```

Usa el `DATABASE_URL` del contenedor y es idempotente (`upsert`), así que si lo
corrés de más no pasa nada. (No hace falta exponer la base ni ts-node.)

### 5. Updates
Push a `main` → **Deploy** en Easypanel (o auto-deploy si lo activás). Las
migraciones nuevas se aplican solas.

---

## Opción B — VPS manual (Docker Compose + Nginx + certbot)

Si preferís sin Easypanel, el repo trae `docker-compose.prod.yml` (Postgres + API
+ Web + Nginx).

```bash
git clone <tu-repo> boxit && cd boxit
cp .env.example .env    # completá dominio, secrets y VAPID (ver abajo)
docker compose -f docker-compose.prod.yml up -d --build
```

`.env` de producción (valores clave):
```dotenv
POSTGRES_PASSWORD=<fuerte>
DATABASE_URL=postgresql://boxit:<fuerte>@db:5432/boxit?schema=public
CORS_ORIGIN=https://boxit.tudominio.com
JWT_SECRET=<openssl rand -base64 48>
JWT_REFRESH_SECRET=<openssl rand -base64 48>
ADMIN_EMAILS=tu-email@dominio.com
VAPID_PUBLIC_KEY=<public>
VAPID_PRIVATE_KEY=<private>
VAPID_SUBJECT=mailto:tu-email@dominio.com
NEXT_PUBLIC_API_URL=          # vacío: mismo origen, nginx proxya /api
```

**TLS con certbot:** ver `nginx/tls.conf.example` y los pasos abajo.

1. En `nginx/default.conf`, dentro del `server { listen 80; }`, agregá:
   ```nginx
   location /.well-known/acme-challenge/ { root /var/www/certbot; }
   ```
2. En el servicio `nginx` del compose, habilitá `"443:443"` y montá los volúmenes
   `certbot_www:/var/www/certbot` y `certbot_certs:/etc/letsencrypt` (y declaralos
   en `volumes:`). `docker compose ... up -d`.
3. Pedí el cert:
   ```bash
   docker run --rm -v boxit_certbot_www:/var/www/certbot -v boxit_certbot_certs:/etc/letsencrypt \
     certbot/certbot certonly --webroot -w /var/www/certbot \
     -d boxit.tudominio.com --email tu-email@dominio.com --agree-tos --no-eff-email
   ```
4. Reemplazá el contenido de `nginx/default.conf` por `nginx/tls.conf.example`
   (cambiando `TU_DOMINIO`) y `docker compose ... exec nginx nginx -s reload`.
5. Renovación (cron semanal del host):
   ```
   0 3 * * 1 docker run --rm -v boxit_certbot_www:/var/www/certbot -v boxit_certbot_certs:/etc/letsencrypt certbot/certbot renew --webroot -w /var/www/certbot --quiet && docker compose -f /ruta/boxit/docker-compose.prod.yml exec nginx nginx -s reload
   ```

Seed (una vez) y backups:
```bash
# seed de ejercicios (idempotente)
docker compose -f docker-compose.prod.yml exec api node --experimental-strip-types prisma/seed.ts
# backup de la base
docker compose -f docker-compose.prod.yml exec db pg_dump -U boxit boxit > boxit-$(date +%F).sql
```

---

## Notas
- `.env.prod.local` (gitignored) se usó para el **ensayo local** de producción
  (`docker compose -p boxit-prod -f docker-compose.prod.yml --env-file .env.prod.local up -d --build`,
  origen `http://localhost`). No lo uses en el VPS.
- Las claves VAPID `VAPID_PUBLIC_KEY` (API) y `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (web)
  **deben ser la misma**.
