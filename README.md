# Rumbo - Sistema Personal de Habitos

![CI](https://github.com/munozgonzalezmarvinalexander-ai/Sistema_Personal_de_Vida/actions/workflows/ci.yml/badge.svg)

Sistema personal para registrar habitos, metricas diarias y progreso semanal.

## Stack

- **Backend:** FastAPI + SQLAlchemy + PostgreSQL + Alembic + JWT
- **Frontend:** React + Vite + TypeScript

## Requisitos

- Python 3.12+
- Node.js 18+
- PostgreSQL 14+

## Setup

### 1. Base de datos

```sql
CREATE USER rumbo_user WITH PASSWORD 'rumbo_pass';
CREATE DATABASE rumbo_db OWNER rumbo_user;
```

### 2. Backend

```bash
cd backend

# Crear entorno virtual
python -m venv .venv

# Activar (Windows PowerShell):
.venv\Scripts\Activate.ps1

# Activar (Windows CMD):
.venv\Scripts\activate.bat

# Activar (Linux/Mac):
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Crear tablas
python -m alembic upgrade head

# Correr servidor
uvicorn app.main:app --reload --port 8000
```

API: http://localhost:8000
Swagger: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

### 4. Primer uso

1. Abre http://localhost:5173
2. Crea una cuenta
3. Se crean 8 habitos por defecto
4. Usa la pantalla Hoy para registrar tu dia

## Endpoints

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | /api/auth/register | Registro |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Usuario actual |
| GET | /api/habits | Listar habitos |
| POST | /api/habits | Crear habito |
| PUT | /api/habits/{id} | Editar habito |
| PATCH | /api/habits/{id}/toggle | Activar/desactivar |
| DELETE | /api/habits/{id} | Eliminar habito |
| GET | /api/checkins/today | Check-in de hoy |
| POST | /api/checkins | Crear check-in |
| PUT | /api/checkins/{id} | Actualizar check-in |
| GET | /api/checkins | Listar check-ins |
| POST | /api/habit-logs | Registrar nivel |
| PUT | /api/habit-logs/{id} | Actualizar nivel |
| GET | /api/habit-logs | Logs por fecha |
| GET | /api/reports/weekly | Reporte semanal |

## Puntuacion

- No hecho = 0 puntos
- Minima = 1 punto
- Normal = 2 puntos
- Ideal = 3 puntos
- Solo se suman, nunca se restan

## Tests

### Backend

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

Usa SQLite en memoria (no necesita PostgreSQL para tests).
44 tests cubriendo auth, habits, checkins, experiments, library,
gamification, reminders, export e insights.

### Frontend

```bash
cd frontend
npm ci
npm run test:run
```

12 tests con Vitest + Testing Library (jsdom).

### CI/CD

GitHub Actions corre automaticamente en cada push y PR a main:
- Backend: compileall, alembic migrations, pytest
- Frontend: tsc, build, vitest

El badge de CI esta al inicio de este README.

## Variables de entorno

Backend (backend/.env):
- DATABASE_URL: postgresql+psycopg://rumbo_user:rumbo_pass@localhost:5432/rumbo_db
- SECRET_KEY: clave para JWT
- ALGORITHM: HS256
- ACCESS_TOKEN_EXPIRE_MINUTES: 1440

Frontend (frontend/.env):
- VITE_API_URL: http://localhost:8000/api
