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

## Setup

### 1. Base de datos

Crea la base de datos y el usuario en PostgreSQL:

```sql
CREATE USER rumbo_user WITH PASSWORD 'rumbo_pass';
CREATE DATABASE rumbo_db OWNER rumbo_user;
```

### 2. Backend

```bash
cd backend

# Crear entorno virtual (recomendado)
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
# Edita backend/.env con tus datos de PostgreSQL
# (ya viene con valores por defecto para desarrollo)

# Crear tablas (migración inicial)
alembic revision --autogenerate -m "initial"
alembic upgrade head

# Correr el servidor
uvicorn app.main:app --reload --port 8000
```

El API estará disponible en `http://localhost:8000`.
Documentación interactiva en `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Correr en modo desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173`.

### 4. Datos seed (hábitos iniciales)

Al registrar un usuario nuevo, puedes crear los hábitos por defecto llamando al endpoint de seed o creándolos manualmente desde la interfaz. Los hábitos predefinidos son:

- Sueño, Agua, Ejercicio, Inglés, Programación, Lectura, Meditación, Celular nocturno

## Endpoints principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Usuario actual |
| GET/POST | `/api/habits` | Listar/crear hábitos |
| PUT | `/api/habits/{id}` | Editar hábito |
| PATCH | `/api/habits/{id}/toggle` | Activar/desactivar |
| DELETE | `/api/habits/{id}` | Eliminar hábito |
| GET | `/api/checkins/today` | Check-in de hoy |
| POST | `/api/checkins` | Crear check-in |
| PUT | `/api/checkins/{id}` | Actualizar check-in |
| GET | `/api/checkins` | Listar check-ins (filtro por fecha) |
| POST | `/api/habit-logs` | Registrar nivel de hábito |
| PUT | `/api/habit-logs/{id}` | Actualizar nivel |
| GET | `/api/habit-logs` | Logs por fecha |
| GET | `/api/reports/weekly` | Reporte semanal |

## Pantallas

1. **Login / Registro** — autenticación
2. **Hoy** — pantalla principal: hábitos activos + métricas diarias
3. **Hábitos** — CRUD con niveles mínima/normal/ideal
4. **Reporte semanal** — resumen de puntos, promedios y hábitos más cumplidos

## Puntuación

- No hecho = 0 puntos
- Mínima = 1 punto
- Normal = 2 puntos
- Ideal = 3 puntos
- Solo se suman, nunca se restan

## Próximas fases

- Gráficas de tendencias y correlaciones
- Experimentos de 7/14/30 días
- Biblioteca de hábitos investigados
- Gamificación (logros, rachas flexibles)
- Modo offline / PWA
