# Rumbo — Guia de Deploy a Produccion

## Arquitectura

```
[Cliente/PWA] → [Nginx/CDN] → [Frontend estático]
                            → [FastAPI Backend] → [PostgreSQL]
```

## Variables de Entorno

### Backend (requeridas)

| Variable | Descripcion | Ejemplo produccion |
|----------|-------------|-------------------|
| `DATABASE_URL` | Conexion PostgreSQL | `postgresql+psycopg://user:pass@host:5432/rumbo_db` |
| `SECRET_KEY` | Clave JWT (min 32 chars) | `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `ALGORITHM` | Algoritmo JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiracion token | `1440` |
| `BACKEND_CORS_ORIGINS` | Origenes permitidos | `https://rumbo.tudominio.com` |
| `ENVIRONMENT` | Entorno actual | `production` |

### Frontend (build time)

| Variable | Descripcion | Ejemplo produccion |
|----------|-------------|-------------------|
| `VITE_API_URL` | URL del API | `/api` (con proxy) o `https://api.tudominio.com/api` |

## Opcion 1: Docker Compose (VPS)

### Requisitos
- Docker y Docker Compose instalados
- Puerto 80/443 disponible

### Pasos

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/Sistema_Personal_de_Vida.git
cd Sistema_Personal_de_Vida

# 2. Generar SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(48))"

# 3. Crear archivo .env en la raiz
cat > .env << 'EOF'
SECRET_KEY=tu-clave-generada-aqui
ENVIRONMENT=production
EOF

# 4. Construir y levantar
docker compose build
docker compose up -d

# 5. Ejecutar migraciones (se ejecuta automaticamente como servicio)
docker compose logs migrations

# 6. Verificar
curl http://localhost/api/health
```

### Comandos utiles

```bash
# Ver logs
docker compose logs -f backend

# Reiniciar
docker compose restart backend

# Actualizar
git pull
docker compose build
docker compose up -d

# Backup de base de datos
docker compose exec postgres pg_dump -U rumbo_user rumbo_db > backup.sql

# Restaurar backup
cat backup.sql | docker compose exec -T postgres psql -U rumbo_user rumbo_db
```

## Opcion 2: Render

### Advertencia sobre PostgreSQL free en Render

Render PostgreSQL free **expira y se borra a los 30 dias**. Sirve para probar el deploy, pero para uso personal real se recomienda:

- **Render PostgreSQL pagado** ($7/mes) — la opcion mas simple si ya usas Render.
- **Supabase** (free tier generoso) — PostgreSQL gestionado con 500 MB gratis.
- **Neon** (free tier) — PostgreSQL serverless con 512 MB gratis y sin expiracion.

Para usar una DB externa, configurar `DATABASE_URL` manualmente en las variables del backend en lugar de usar `fromDatabase` en render.yaml.

### Deploy con Blueprint (recomendado)

1. En Render Dashboard → **New** → **Blueprint**
2. Conectar el repo `Sistema_Personal_de_Vida`
3. Render detecta `render.yaml` y muestra 3 servicios: DB, API, frontend
4. Configurar las variables `sync: false`:
   - `BACKEND_CORS_ORIGINS`: `https://rumbo-frontend.onrender.com`
   - `VITE_API_URL`: `https://rumbo-api.onrender.com/api`
5. Click **Apply** — Render crea todo automaticamente

### Deploy manual

#### Backend (Web Service)
1. Crear Web Service conectado al repo
2. **Build Command:** `cd backend && pip install -r requirements.txt`
3. **Start Command:** `cd backend && python -m alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Agregar variables de entorno: `DATABASE_URL`, `SECRET_KEY`, `ENVIRONMENT=production`, `BACKEND_CORS_ORIGINS`
5. Agregar PostgreSQL como servicio y conectar la `DATABASE_URL`

#### Frontend (Static Site)
1. Crear Static Site conectado al repo
2. **Build Command:** `cd frontend && npm ci && npm run build`
3. **Publish Directory:** `frontend/dist`
4. Agregar variable: `VITE_API_URL=https://tu-backend.onrender.com/api`
5. Configurar rewrite rule: `/*` → `/index.html` (200)

## Opcion 3: Railway

```bash
# Backend
railway link
railway add --database postgres
railway variables set SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(48))")
railway variables set ENVIRONMENT=production
railway variables set BACKEND_CORS_ORIGINS=https://tu-frontend.railway.app
railway up
```

Para el frontend, crear otro servicio Railway con la misma configuracion de build que Render.

## Opcion 4: VPS manual (sin Docker)

### Backend

```bash
# Instalar dependencias del sistema
sudo apt update && sudo apt install python3.12 python3.12-venv postgresql nginx certbot

# Crear base de datos
sudo -u postgres createuser rumbo_user -P
sudo -u postgres createdb rumbo_db -O rumbo_user

# Setup del backend
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Crear .env con variables de produccion
cp .env.example .env
# Editar .env con valores reales

# Migraciones
python -m alembic upgrade head

# Correr con systemd (crear /etc/systemd/system/rumbo-api.service)
# ExecStart=/path/to/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
npm ci
VITE_API_URL=/api npm run build

# Copiar dist/ al directorio de nginx
sudo cp -r dist/* /var/www/rumbo/
```

### Nginx (proxy + static)

```nginx
server {
    listen 80;
    server_name rumbo.tudominio.com;

    root /var/www/rumbo;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Luego: `sudo certbot --nginx -d rumbo.tudominio.com`

## PostgreSQL en produccion

- Usar SSL: agregar `?sslmode=require` a `DATABASE_URL`
- Backups automaticos diarios
- No usar usuario `postgres` directamente
- Limitar conexiones por usuario

## Ejecutar Alembic en produccion

```bash
# Con Docker
docker compose run --rm migrations

# Sin Docker
cd backend
source .venv/bin/activate
python -m alembic upgrade head
```

## Verificacion post-deploy

### Health check
```bash
curl https://tu-dominio.com/api/health
# Esperado: {"status":"ok","app":"Rumbo","environment":"production"}
```

### Login
```bash
curl -X POST https://tu-dominio.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"testpass123","display_name":"Test"}'
```

### PWA
1. Abrir en Chrome movil
2. Verificar que aparece "Instalar app"
3. Instalar y verificar que abre standalone

## Checklist post-deploy

- [ ] `api/health` responde `{"status":"ok"}`
- [ ] Registro de usuario funciona
- [ ] Login devuelve token
- [ ] CORS solo acepta dominios configurados
- [ ] `ENVIRONMENT=production`
- [ ] `SECRET_KEY` es unica y segura
- [ ] `/docs` no es accesible (produccion)
- [ ] HTTPS activo
- [ ] PWA instalable
- [ ] Service worker cacheando assets

### Base de datos

- [ ] Si usas Render Postgres free: exportar respaldo antes de 30 dias (`GET /api/export/json`)
- [ ] Si usas Render Postgres free: migrar a Postgres pagado, Supabase o Neon antes de que expire
- [ ] Si usas DB pagada o externa: verificar que backups automaticos estan configurados
- [ ] Probar restauracion de backup al menos una vez
