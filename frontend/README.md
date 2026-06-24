# Rumbo - Frontend

Frontend PWA de la aplicacion Rumbo, construido con React + Vite + TypeScript.

## Setup

```bash
npm install
npm run dev
```

App: http://localhost:5173

Requiere backend corriendo en http://localhost:8000.

## Scripts

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Servidor desarrollo con HMR |
| `npm run build` | Build produccion (tsc + vite + PWA) |
| `npm run preview` | Previsualizar build produccion |

## PWA

Rumbo es una Progressive Web App instalable en Android, iOS y escritorio.

### Probar PWA

1. `npm run build`
2. `npm run preview`
3. Abrir en Chrome/Edge
4. DevTools > Application > Manifest (verificar datos)
5. DevTools > Application > Service Workers (verificar registro)

### Instalar en Android/Chrome

1. Abrir la app en Chrome
2. Esperar unos segundos
3. Aparece banner "Instalar Rumbo" o usar menu > "Instalar app"
4. La app se agrega a la pantalla de inicio

### Instalar en iOS/Safari

1. Abrir en Safari
2. Compartir > "Agregar a pantalla de inicio"
3. El prompt de instalacion no aparece en iOS (limitacion de Safari)

### Probar offline

1. DevTools > Network > marcar "Offline"
2. Aparece banner amarillo con dos lineas:
   "Sin conexion" + "Puedes ver la app, pero guardar datos requiere internet"
3. La app se abre gracias al cache de assets estaticos
4. Al reconectar, funciona normalmente

### Que se cachea

- Assets estaticos: JS, CSS, HTML, iconos, SVG (precache)
- /api/health: NetworkFirst, 60s cache, solo para verificar disponibilidad
- /api/habit-library: StaleWhileRevalidate, 1h cache (lectura publica)

### Que NO se cachea

- /api/auth/* (login, registro, tokens)
- /api/checkins/* (datos privados del usuario)
- /api/habits/* (habitos del usuario)
- /api/habit-logs/* (registros diarios)
- /api/experiments/* (experimentos del usuario)
- /api/gamification/* (logros y progreso)
- /api/reports/* (reportes semanales y tendencias)

Esto es intencional: los datos privados no deben persistir en
cache del service worker sin control del usuario.

### Limitaciones actuales

- PWA instalable con offline basico (solo shell de la app)
- No hay sincronizacion offline: check-ins, habitos y experimentos
  requieren conexion al backend
- No se almacenan datos del usuario localmente
- No hay cola de acciones pendientes para sincronizar despues
- El prompt de instalacion se oculta despues de descartarlo (localStorage)
- En modo standalone no se muestra el prompt de instalacion

## Estructura

```
src/
  api/           - Cliente axios + tipos TypeScript
  context/       - AuthContext (JWT + sesion)
  components/    - Layout, OfflineBanner, InstallPrompt
  pages/         - Hoy, Habitos, Progreso, Experimentos,
                   Biblioteca, Logros, Reporte, Login, Register
  App.tsx        - Router con rutas protegidas + PWA components
  main.tsx       - Entry point
  index.css      - Estilos (responsive + dark mode)
```

## Configuracion

```
VITE_API_URL=http://localhost:8000/api
```
