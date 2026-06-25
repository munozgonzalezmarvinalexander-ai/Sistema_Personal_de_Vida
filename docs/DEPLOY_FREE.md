# Rumbo — Deploy Gratuito

Deploy 100% gratuito usando servicios separados. No requiere tarjeta de credito.

## Arquitectura

```
[Frontend en Vercel/Render Static]  →  [Backend en Render Free*]  →  [PostgreSQL en Neon/Supabase]
        (gratis)                          (gratis con limites)              (gratis)
```

*Render ya no ofrece tier gratuito para web services nuevos. Las alternativas gratuitas para el backend son **Koyeb**, **Fly.io** (con limites) o un VPS barato. Si Render reactiva el free tier, se puede usar ahi tambien.

## Opcion recomendada: Vercel + Render/Koyeb + Neon

| Servicio | Plataforma | Costo | Limites |
|----------|-----------|-------|---------|
| Frontend | Vercel Hobby | Gratis | 100 GB bandwidth/mes |
| Backend | Koyeb Free | Gratis | 1 app, duerme tras inactividad |
| PostgreSQL | Neon Free | Gratis | 512 MB, sin expiracion |

## Paso 1 — Base de datos (Neon)

1. Crear cuenta en **https://neon.tech**
2. Crear proyecto → elegir region (us-east-1 recomendado)
3. Copiar el **Connection String** que aparece. Se ve asi:
   ```
   postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Este valor es tu `DATABASE_URL`. Guardalo.

### Alternativa: Supabase

1. Crear cuenta en **https://supabase.com**
2. Crear proyecto → copiar connection string de Settings → Database
3. Formato: `postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres`

## Paso 2 — SECRET_KEY

Generar en tu terminal:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Copiar el resultado. Este es tu `SECRET_KEY`.

## Paso 3 — Backend

### Opcion A: Koyeb (recomendado para free)

1. Crear cuenta en **https://www.koyeb.com**
2. Create Service → GitHub → conectar repo `Sistema_Personal_de_Vida`
3. Configurar:
   - **Builder:** Dockerfile
   - **Dockerfile path:** `backend/Dockerfile`
   - **Port:** 8000
4. Variables de entorno:
   - `DATABASE_URL` = (el connection string de Neon)
   - `SECRET_KEY` = (el valor generado)
   - `ENVIRONMENT` = `production`
   - `BACKEND_CORS_ORIGINS` = (se llena despues con la URL del frontend)
   - `ALGORITHM` = `HS256`
5. Deploy → esperar a que este "Healthy"
6. Anotar la URL, por ejemplo: `https://rumbo-api-xxxxx.koyeb.app`

### Opcion B: Render (si tienes free tier disponible)

1. Render Dashboard → **New** → **Web Service**
2. Conectar repo → configurar:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python -m alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Variables de entorno (mismas que Opcion A)
4. Elegir plan (si existe free, usarlo)

### Verificar backend

```bash
curl https://TU-BACKEND-URL/api/health
# Esperado: {"status":"ok","app":"Rumbo","environment":"production"}
```

### Correr migraciones

Las migraciones corren automaticamente al iniciar (estan en el startCommand/Dockerfile CMD).
Si necesitas correrlas manualmente, usa la consola/shell del servicio:

```bash
cd backend && python -m alembic upgrade head
```

## Paso 4 — Frontend

### Opcion A: Vercel (recomendado)

1. Crear cuenta en **https://vercel.com** con GitHub
2. Import Project → seleccionar repo `Sistema_Personal_de_Vida`
3. Configurar:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Environment Variables:
   - `VITE_API_URL` = `https://TU-BACKEND-URL/api`
5. Deploy
6. Anotar la URL, por ejemplo: `https://rumbo-xxxxx.vercel.app`

### Opcion B: Render Static Site (gratis)

1. Render Dashboard → **New** → **Static Site**
2. Conectar repo → configurar:
   - **Build Command:** `cd frontend && npm ci && npm run build`
   - **Publish Directory:** `frontend/dist`
3. Environment Variables:
   - `VITE_API_URL` = `https://TU-BACKEND-URL/api`
   - `NODE_VERSION` = `22`
4. Agregar Rewrite Rule: `/*` → `/index.html` (status 200)
5. Deploy

## Paso 5 — Conectar CORS

Ahora que tienes la URL del frontend, actualizar la variable `BACKEND_CORS_ORIGINS` en el backend:

```
BACKEND_CORS_ORIGINS=https://rumbo-xxxxx.vercel.app
```

Si usas multiples dominios, separar con comas:

```
BACKEND_CORS_ORIGINS=https://rumbo-xxxxx.vercel.app,https://rumbo-frontend.onrender.com
```

Reiniciar el backend despues de cambiar esta variable.

## Paso 6 — Verificar todo

### Health
```bash
curl https://TU-BACKEND-URL/api/health
```

### Registro
```bash
curl -X POST https://TU-BACKEND-URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"tupassword123","display_name":"Tu Nombre"}'
```

### Frontend
1. Abrir la URL del frontend en el navegador
2. Registrar usuario
3. Verificar que la pantalla "Hoy" carga correctamente

### PWA
1. Abrir en Chrome mobile
2. Verificar que aparece opcion de instalar
3. Instalar y verificar que abre standalone

### Smoke test
```bash
pip install requests
API_URL=https://TU-BACKEND-URL/api python scripts/smoke_backend.py
```

## Resumen de variables

### Backend

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Connection string de Neon/Supabase |
| `SECRET_KEY` | `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `ENVIRONMENT` | `production` |
| `BACKEND_CORS_ORIGINS` | URL del frontend (https://...) |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` |

### Frontend

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://TU-BACKEND-URL/api` |

## Limites del tier gratuito

| Servicio | Limite principal | Que pasa al llegar |
|----------|------------------|--------------------|
| Neon | 512 MB storage | Se rechaza escritura |
| Supabase | 500 MB storage | Se pausa el proyecto |
| Koyeb | 1 app, se duerme tras inactividad | Cold start ~30s |
| Vercel | 100 GB bandwidth/mes | Deploy bloqueado |
| Render Static | Sin limite practico | — |

## Checklist post-deploy

- [ ] `/api/health` responde OK
- [ ] Registro y login funcionan
- [ ] Frontend carga y conecta al backend
- [ ] CORS configurado (no errores en consola del browser)
- [ ] PWA instalable
- [ ] Exportar respaldo periodicamente (`GET /api/export/json`)
- [ ] Si usas Neon/Supabase free: monitorear uso de storage
