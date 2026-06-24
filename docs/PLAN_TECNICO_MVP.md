# Plan Técnico - Rumbo MVP

## Fases implementadas

### Fase 0 - Setup
- [x] Estructura monorepo (backend, frontend, docs)
- [x] Configuración FastAPI + SQLAlchemy + Alembic
- [x] Configuración React + Vite + TypeScript
- [x] Variables de entorno
- [x] CORS configurado

### Fase 1 - MVP Núcleo
- [x] Modelo Users con auth JWT
- [x] Modelo Habits con 3 niveles
- [x] Modelo HabitLogs con puntuación
- [x] Modelo DailyCheckins con métricas
- [x] Endpoints de Auth (register, login, me)
- [x] CRUD completo de Hábitos
- [x] Check-in diario con métricas
- [x] Logs de hábitos por nivel
- [x] Reporte semanal
- [x] Seed de hábitos por defecto al registrarse
- [x] Frontend completo (Login, Registro, Hoy, Hábitos, Reporte)

## Fases futuras (NO implementadas)

### Fase 2 - Visualización
- Historial/calendario de check-ins
- Gráficas de tendencias (sueño, ánimo, energía)

### Fase 3 - Reportes avanzados
- Comparación semana vs semana anterior
- Insights automáticos

### Fase 4 - Experimentos
- Crear pruebas de 7/14/30 días
- Evaluar métricas antes/durante

### Fase 5 - Biblioteca de hábitos
- Catálogo con clasificación por evidencia

### Fase 6 - Gamificación
- Logros, rachas flexibles, niveles

### Fase 7 - Avanzado
- PWA / offline
- Notificaciones
- IA con sugerencias
