# Rumbo - Frontend

Frontend de la aplicacion Rumbo, construido con React + Vite + TypeScript.

## Setup

```bash
npm install
npm run dev
```

La app estara en `http://localhost:5173`.

Requiere que el backend este corriendo en `http://localhost:8000` (configurable en `.env`).

## Scripts

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de produccion (tsc + vite) |
| `npm run preview` | Previsualizar el build de produccion |

## Estructura

```
src/
  api/           - Cliente axios + tipos TypeScript
  context/       - AuthContext (JWT + estado de sesion)
  components/    - Layout (sidebar + bottom nav)
  pages/         - Login, Register, Today, Habits, WeeklyReport
  App.tsx        - Router con rutas protegidas
  main.tsx       - Entry point
  index.css      - Estilos (responsive + dark mode)
```

## Configuracion

Variable de entorno en `.env`:

```
VITE_API_URL=http://localhost:8000/api
```
