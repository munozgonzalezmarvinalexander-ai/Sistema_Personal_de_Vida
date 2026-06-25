# Rumbo — Sistema Personal de Vida

![CI](https://github.com/munozgonzalezmarvinalexander-ai/Sistema_Personal_de_Vida/actions/workflows/ci.yml/badge.svg)

Sistema personal para registrar habitos, metricas diarias, experimentos y progreso semanal. Genera insights automaticos con reglas locales — sin IA externa ni envio de datos a terceros.

## Stack

- **Backend:** FastAPI + SQLAlchemy + PostgreSQL + Alembic + JWT + bcrypt
- **Frontend:** React + Vite + TypeScript + Recharts
- **Infra:** Docker Compose, GitHub Actions CI, PWA

## Features

| Area | Funcionalidad |
|------|--------------|
| Habitos | CRUD, niveles (minimo/normal/ideal), puntuacion, habitos core |
| Check-ins | Registro diario de sueno, energia, animo, agua, pantalla, estudio, etc. |
| Reportes | Reporte semanal con comparacion vs semana anterior |
| Tendencias | Graficas de metricas a 7/14/30/60 dias |
| Rachas | Racha actual, mejor racha, dias de gracia |
| Experimentos | Probar habitos por 7/14/30 dias con hipotesis y decision final |
| Biblioteca | Catalogo de habitos con evidencia cientifica, tradicional o personal |
| Logros | Sistema de gamificacion con niveles y achievements |
| Insights | Sugerencias automaticas basadas en reglas locales |
| Correlaciones | Analisis Pearson entre metricas + retardo temporal + scatter plots |
| Exportacion | Export JSON completo y CSVs individuales |
| Recordatorios | Configuracion de recordatorios diarios y semanales |
| PWA | Instalable en movil, funciona offline para assets |
| Auth | Registro/login con JWT, datos aislados por usuario |

## Requisitos

- Python 3.12+
- Node.js 22+
- PostgreSQL 14+

## Setup local (sin Docker)

### 1. Base de datos

```sql
CREATE USER rumbo_user WITH PASSWORD 'rumbo_pass';
CREATE DATABASE rumbo_db OWNER rumbo_user;
```

### 2. Backend

```bash
cd backend
python -m venv .venv

# Activar (Windows PowerShell)
.venv\Scripts\Activate.ps1
# Activar (Linux/Mac)
source .venv/bin/activate

cp .env.example .env
# Editar .env: configurar SECRET_KEY con un valor seguro

pip install -r requirements.txt
python -m alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

API: http://localhost:8000 | Swagger: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: http://localhost:5173

### 4. Primer uso

1. Abre http://localhost:5173
2. Crea una cuenta
3. Se crean 8 habitos por defecto
4. Usa la pantalla "Hoy" para registrar tu dia

## Setup con Docker

```bash
# Generar clave secreta
python3 -c "import secrets; print(secrets.token_urlsafe(48))"

# Crear .env en la raiz del proyecto
echo "SECRET_KEY=tu-clave-generada" > .env

# Construir y levantar
docker compose build
docker compose up -d

# Verificar
curl http://localhost/api/health
```

La app estara disponible en http://localhost (frontend + API bajo el mismo dominio).

## Tests

### Backend

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

Usa SQLite en memoria — no necesita PostgreSQL.

### Frontend

```bash
cd frontend
npm ci
npm run test:run
```

### Smoke test

```bash
pip install requests
API_URL=http://localhost:8000/api python scripts/smoke_backend.py
```

### CI/CD

GitHub Actions ejecuta automaticamente en cada push/PR a main:
- **Backend:** compileall, alembic migrations, pytest (58 tests)
- **Frontend:** tsc, build, vitest (21 tests)

## Deploy

Ver [docs/DEPLOY.md](docs/DEPLOY.md) para guias completas de deploy en:
- Render (Blueprint con `render.yaml` incluido)
- Docker Compose (VPS)
- Railway
- VPS manual con nginx

**Nota sobre base de datos:** Render PostgreSQL free expira a los 30 dias. Para uso personal real se recomienda Render Postgres pagado ($7/mes), Supabase (free, 500 MB) o Neon (free, 512 MB).

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Requerida | Default | Descripcion |
|----------|-----------|---------|-------------|
| `DATABASE_URL` | Si | — | Conexion PostgreSQL |
| `SECRET_KEY` | Si | — | Clave JWT (min 16 chars) |
| `ALGORITHM` | No | `HS256` | Algoritmo JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `1440` | Expiracion de token |
| `BACKEND_CORS_ORIGINS` | No | `localhost:5173,localhost:3000` | Origenes CORS |
| `ENVIRONMENT` | No | `development` | `development` o `production` |

### Frontend (`frontend/.env`)

| Variable | Requerida | Default | Descripcion |
|----------|-----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:8000/api` | URL del backend |

## Endpoints principales

| Metodo | Endpoint | Auth | Descripcion |
|--------|----------|------|-------------|
| GET | /api/health | No | Health check |
| POST | /api/auth/register | No | Registro |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | Si | Usuario actual |
| GET/POST | /api/habits | Si | Habitos |
| GET/POST | /api/checkins | Si | Check-ins diarios |
| GET/POST | /api/habit-logs | Si | Logs de habitos |
| GET | /api/reports/weekly | Si | Reporte semanal |
| GET | /api/experiments | Si | Experimentos |
| GET | /api/habit-library | Si | Biblioteca |
| GET | /api/gamification/* | Si | Logros y progreso |
| GET | /api/reminders | Si | Recordatorios |
| GET | /api/export/json | Si | Exportar todo |
| GET | /api/insights | Si | Sugerencias |
| GET | /api/insights/correlations | Si | Correlaciones |

## Seguridad

- Passwords hasheados con bcrypt + salt
- JWT con clave configurable y expiracion
- Datos aislados por usuario (user_id en todas las queries)
- Export excluye password_hash
- Biblioteca solo lectura
- CORS configurable por entorno
- Headers de seguridad (X-Frame-Options, X-Content-Type-Options, HSTS en produccion)
- Swagger/ReDoc deshabilitado en produccion

## Estado del proyecto

**Version 1.0 — Lista para produccion**

## Roadmap

- [ ] Refresh tokens
- [ ] Rate limiting en endpoints de auth
- [ ] Notificaciones push reales
- [ ] Dashboard con graficas avanzadas
- [ ] Modo oscuro toggle manual
- [ ] Import de datos (JSON)
- [ ] IA local para insights avanzados
