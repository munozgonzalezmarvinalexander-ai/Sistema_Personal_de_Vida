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

Rumbo es una Progressive Web App instalable.

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

### Probar offline

1. DevTools > Network > marcar "Offline"
2. Aparece banner amarillo "Sin conexion"
3. La app se abre pero no puede cargar datos del backend
4. Al reconectar, funciona normalmente

### Limitaciones actuales

- Offline completo no implementado (no guarda datos localmente)
- Backend debe estar disponible para guardar check-ins, habitos, etc.
- Cache basico de assets estaticos solamente
- No se cachean respuestas JWT de forma persistente

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
