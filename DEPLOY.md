# Deploy de BOX iT en un VPS

Stack: **Postgres + API (NestJS) + Web (Next.js) + Nginx** con Docker Compose.
Nginx sirve el front y proxya `/api`. La API corre migraciones (`prisma migrate
deploy`) al arrancar. **Web Push y la PWA requieren HTTPS**, así que hay que
configurar TLS con un dominio.

## 1. Requisitos en el VPS

- Docker + Docker Compose v2 (`docker compose version`).
- Un **dominio** apuntando (record A) a la IP del VPS. Ej: `boxit.tudominio.com`.
- Puertos **80 y 443** abiertos en el firewall.

## 2. Traer el código y configurar el `.env`

```bash
git clone <tu-repo> boxit && cd boxit
cp .env.example .env
```

Editá `.env` (NO se commitea). Valores de producción:

```dotenv
# Postgres (poné una password fuerte)
POSTGRES_USER=boxit
POSTGRES_PASSWORD=<password-fuerte>
POSTGRES_DB=boxit
# En Docker el host de la DB es "db"
DATABASE_URL=postgresql://boxit:<password-fuerte>@db:5432/boxit?schema=public

# Origen del front = tu dominio con https
CORS_ORIGIN=https://boxit.tudominio.com

# Secrets JWT (generá cada uno):  openssl rand -base64 48
JWT_SECRET=<...>
JWT_REFRESH_SECRET=<...>
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=604800
ADMIN_EMAILS=tu-email@dominio.com

# Web Push (generá el par UNA vez):
#   docker run --rm node:22-alpine sh -c "npx -y web-push generate-vapid-keys"
VAPID_PUBLIC_KEY=<public>
VAPID_PRIVATE_KEY=<private>
VAPID_SUBJECT=mailto:tu-email@dominio.com

# Mismo origen: el navegador llama /api (nginx proxya). Dejalo VACÍO.
NEXT_PUBLIC_API_URL=
```

> El compose usa `VAPID_PUBLIC_KEY` también como `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
> del web (deben coincidir), así que con setearla una vez alcanza.

## 3. Primer arranque (HTTP)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Verificá: `docker compose -f docker-compose.prod.yml ps` (todos "healthy"/"running")
y `curl -I http://localhost` (debería responder desde el web). En este punto la
app anda por HTTP, pero **el push/PWA todavía no** (falta TLS).

## 4. TLS con Let's Encrypt (certbot)

Con el dominio ya apuntando al VPS y el stack corriendo en :80:

**a)** Serví el challenge ACME desde nginx. Agregá al `server { listen 80; }` de
`nginx/default.conf`, arriba del `location /`:

```nginx
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
```

**b)** Montá dos volúmenes en el servicio `nginx` del `docker-compose.prod.yml`
(y habilitá el `443`):

```yaml
  nginx:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - certbot_www:/var/www/certbot
      - certbot_certs:/etc/letsencrypt
# … y al final del archivo:
volumes:
  boxit_pgdata:
  certbot_www:
  certbot_certs:
```

`docker compose -f docker-compose.prod.yml up -d` para recargar nginx.

**c)** Pedí el certificado (reemplazá el dominio y email):

```bash
docker run --rm \
  -v boxit_certbot_www:/var/www/certbot \
  -v boxit_certbot_certs:/etc/letsencrypt \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d boxit.tudominio.com --email tu-email@dominio.com --agree-tos --no-eff-email
```

**d)** Agregá el server TLS a `nginx/default.conf` (redirige 80→443 y sirve 443).
Hay un ejemplo listo en **`nginx/tls.conf.example`** — copiá su contenido
reemplazando `TU_DOMINIO`. Luego recargá:

```bash
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

**e)** Renovación automática (cron del host, cada semana):

```bash
0 3 * * 1 docker run --rm -v boxit_certbot_www:/var/www/certbot -v boxit_certbot_certs:/etc/letsencrypt certbot/certbot renew --webroot -w /var/www/certbot --quiet && docker compose -f /ruta/boxit/docker-compose.prod.yml exec nginx nginx -s reload
```

## 5. Actualizar a una versión nueva

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Las migraciones nuevas se aplican solas al reiniciar la API.

## 6. Backups de la base

```bash
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U boxit boxit > boxit-$(date +%F).sql
```

## Notas

- El nombre del volumen de certbot depende del *project name* de compose
  (default = nombre del directorio, ej. `boxit`). Ajustá `boxit_certbot_*` si tu
  carpeta se llama distinto (`docker volume ls` para ver los nombres reales).
- Este repo trae un `.env.prod.local` que se usó para el **ensayo local** de
  producción (`--env-file .env.prod.local`, origen `http://localhost`); no lo
  uses en el VPS, usá `.env` con tu dominio.
