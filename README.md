# Rumbo - Sistema Personal de Hábitos

Sistema personal para registrar hábitos, métricas diarias y progreso semanal. No es solo una lista de tareas: es un sistema para ver qué está mejorando tu vida.

## Stack

- **Backend:** FastAPI + SQLAlchemy + PostgreSQL + Alembic + JWT
- **Frontend:** React + Vite + TypeScript
- **Auth:** JWT (JSON Web Tokens)

## Requisitos

- Python 3.12+
- Node.js 18+
- PostgreSQL 14+

## Setup rápido

### 1. Base de datos

Abre una terminal de PostgreSQL (`psql -U postgres`) y ejecuta:

```sql
CREATE USER rumbo_user WITH PASSWORD 'rumbo_pass';
CREATE DATABASE rumbo_db OWNER rumbo_user;
```

### 2. Backend

```bash
cd backend

# Crear entorno virtual (recomendado)
python -m venv .venv

# Activar entorno virtual:
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (CMD):
.venv\Scripts\activate.bat
# Linux/Mac:
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno (opcional, ya viene listo para desarrollo)
# Edita backend/.env si tu PostgreSQL usa credenciales diferentes

# Aplicar migración para crear las tablas
python -m alembic upgrade head

# Correr el servidor
uvicorn app.main:app --reload --port 8000
```

- API: `http://localhost:8000`
- Documentación interactiva (Swagger): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

### 3. Frontend

En otra terminal:

```bash
cd frontend

# Instalar dependencias
npm install

# Correr en modo desarrollo
npm run dev
```

- App: `http://localhost:5173`

### 4. Primer uso

1. Abre `http://localhost:5173` en tu navegador
2. Crea una cuenta (Regístrate)
3. Al registrarte se crean automáticamente 8 hábitos por defecto
4. Usa la pantalla "Hoy" para registrar tu día

## Hábitos por defecto (seed)

Al crear un usuario nuevo, se generan automáticamente:

| Hábito | Categoría | Core |
|--------|-----------|------|
| Sueño | salud | Sí |
| Agua | salud | Sí |
| Ejercicio | salud | Sí |
| Inglés | aprendizaje | Sí |
| Programación | aprendizaje | No |
| Lectura | desarrollo | No |
| Meditación | bienestar | No |
| Celular nocturno | bienestar | Sí |

## Endpoints de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro (crea usuario + hábitos seed) |
| POST | `/api/auth/login` | Login con JWT |
| GET | `/api/auth/me` | Usuario actual autenticado |
| GET | `/api/habits` | Listar hábitos (`?active_only=true`) |
| POST | `/api/habits` | Crear hábito |
| PUT | `/api/habits/{id}` | Editar hábito |
| PATCH | `/api/habits/{id}/toggle` | Activar/desactivar |
| DELETE | `/api/habits/{id}` | Eliminar hábito |
| GET | `/api/checkins/today` | Check-in de hoy |
| POST | `/api/checkins` | Crear check-in diario |
| PUT | `/api/checkins/{id}` | Actualizar check-in |
| GET | `/api/checkins` | Listar (`?start_date=&end_date=`) |
| POST | `/api/habit-logs` | Registrar nivel de hábito |
| PUT | `/api/habit-logs/{id}` | Actualizar nivel |
| GET | `/api/habit-logs` | Logs por fecha (`?log_date=YYYY-MM-DD`) |
| GET | `/api/reports/weekly` | Reporte semanal (`?start_date=YYYY-MM-DD`) |

## Pantallas

1. **Login / Registro** — autenticación con JWT
2. **Hoy** — pantalla principal: hábitos activos con selector de nivel + métricas diarias + nota
3. **Hábitos** — CRUD con niveles mínima/normal/ideal, toggle activo/inactivo
4. **Reporte semanal** — puntos, promedios de sueño/ánimo/energía, minutos por actividad, ranking de hábitos

## Puntuación

- No hecho = 0 puntos
- Mínima = 1 punto
- Normal = 2 puntos
- Ideal = 3 puntos
- Solo se suman, nunca se restan

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_URL` | URL de PostgreSQL | `postgresql+psycopg://rumbo_user:rumbo_pass@localhost:5432/rumbo_db` |
| `SECRET_KEY` | Clave para firmar JWT | `dev-secret-key-change-in-production` |
| `ALGORITHM` | Algoritmo JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del token | `1440` (24h) |

### Frontend (`frontend/.env`)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `VITE_API_URL` | URL base de la API | `http://localhost:8000/api` |

## Próximas fases

- Gráficas de tendencias y correlaciones
- Experimentos de 7/14/30 días
- Biblioteca de hábitos investigados
- Gamificación (logros, rachas flexibles)
- Modo offline / PWA
