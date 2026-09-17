# Rumbo en casa con HTTPS y Neon

Este perfil publica Rumbo solo en la red local, con HTTPS generado por Caddy y la base de datos alojada remotamente en Neon. No requiere abrir puertos en el router ni exponer la computadora a Internet.

## Preparacion

1. Instala Docker Desktop y reserva una IP local fija para la computadora en el router.
2. Haz que `rumbo.home` resuelva a esa IP mediante el DNS del router/Pi-hole. Como alternativa, usa directamente la IP en `RUMBO_HOST`.
3. Copia `.env.home.example` a `.env.home`.
4. Coloca en `DATABASE_URL` la URL **directa, no pooled**, de Neon con `sslmode=require`.
5. Genera `SECRET_KEY` con `python -c "import secrets; print(secrets.token_urlsafe(48))"`.

`.env.home` contiene secretos y no debe subirse a Git.

## Iniciar y actualizar

```bash
docker compose --env-file .env.home -f docker-compose.home.yml up -d --build
docker compose --env-file .env.home -f docker-compose.home.yml ps
```

El servicio `migrations` ejecuta Alembic una sola vez y el backend solo arranca si termina correctamente. Para actualizar:

```bash
git pull --ff-only
docker compose --env-file .env.home -f docker-compose.home.yml up -d --build
```

## Confiar en el certificado desde Android

Extrae la autoridad local de Caddy:

```bash
docker compose --env-file .env.home -f docker-compose.home.yml cp caddy:/data/caddy/pki/authorities/local/root.crt ./rumbo-home-ca.crt
```

Copia `rumbo-home-ca.crt` al telefono e instalalo como certificado CA de usuario desde Seguridad. Despues abre `https://rumbo.home` (o el valor de `RUMBO_HOST`) e instala la PWA desde el navegador. El aviso HTTPS debe desaparecer antes de introducir credenciales.

Los recordatorios locales se reevalúan al abrir o recuperar el foco de la app y cuando vuelve la conexion. No son push remoto: con la app totalmente cerrada, el sistema operativo no garantiza su entrega.

## Copia y restauracion verificable

Neon usa PostgreSQL 18 en este proyecto. Usa herramientas cliente 18 (o una version posterior compatible); no uses la imagen 16 del perfil antiguo. `docker compose --env-file` entrega variables a Compose, pero **no** las exporta a tu terminal, por lo que los comandos de copia deben leerlas explicitamente.

En PowerShell, crea primero una carpeta local ignorada por Git y carga las dos conexiones directas (sin `-pooler`) solo en la sesion actual:

```powershell
New-Item -ItemType Directory -Force backups | Out-Null
$env:DATABASE_URL = Read-Host "URL directa de origen"
$env:RESTORE_DATABASE_URL = Read-Host "URL directa de la rama aislada"
docker run --rm -e DATABASE_URL -v "${PWD}/backups:/backups" postgres:18-alpine sh -c 'pg_dump "$DATABASE_URL" -Fc -f /backups/rumbo.dump'
docker run --rm -e RESTORE_DATABASE_URL -v "${PWD}/backups:/backups" postgres:18-alpine sh -c 'pg_restore --clean --if-exists --no-owner -d "$RESTORE_DATABASE_URL" /backups/rumbo.dump'
```

Antes de una migracion importante, crea una rama de backup en Neon y ademas un dump logico:

```bash
docker run --rm -e DATABASE_URL="$DATABASE_URL" -v "$PWD/backups:/backups" postgres:18-alpine sh -c 'pg_dump "$DATABASE_URL" -Fc -f /backups/rumbo.dump'
```

Prueba la restauracion en una rama Neon temporal, nunca primero en produccion:

```bash
docker run --rm -e RESTORE_DATABASE_URL="$RESTORE_DATABASE_URL" -v "$PWD/backups:/backups" postgres:18-alpine sh -c 'pg_restore --clean --if-exists --no-owner -d "$RESTORE_DATABASE_URL" /backups/rumbo.dump'
```

Verifica alli que Alembic esta en `head`, que los conteos de usuarios/check-ins/logs coinciden y que puedes iniciar sesion. Elimina la rama temporal solo despues de documentar el resultado.

Los comandos usan `sh -c` deliberadamente: PowerShell solo pasa la variable al contenedor y la expansion de `$DATABASE_URL` ocurre dentro de este. La URL no aparece en la linea de comandos ni en el historial. Al terminar, limpia las variables de la sesion con `Remove-Item Env:DATABASE_URL,Env:RESTORE_DATABASE_URL`.

Los JSON/CSV exportados por Rumbo sirven para consulta y portabilidad, pero no sustituyen una copia restaurable de PostgreSQL. Protege `backups/rumbo.dump` como un secreto: contiene datos personales aunque no incluya la contraseña de conexion.

El repositorio también incluye el flujo manual **Database Restore Check**. Usa dos secretos temporales de GitHub (`AUDIT_SOURCE_DATABASE_URL` y `AUDIT_RESTORE_DATABASE_URL`), exige URLs directas y diferentes, genera un dump con PostgreSQL 18, restaura únicamente en el destino aislado, compara Alembic y conteos, y prueba registro/inicio de sesión contra la aplicación restaurada. El dump se elimina del ejecutor y nunca se publica como artefacto.

### Última verificación real

El 17 de septiembre de 2026 se ejecutó [Database Restore Check #35227859429](https://github.com/munozgonzalezmarvinalexander-ai/Sistema_Personal_de_Vida/actions/runs/35227859429) sobre PostgreSQL 18.6. El dump de producción se restauró en la rama Neon aislada `audit-pg-restore-20260916-v2` (`br-little-union-atajnjsh`), sin restaurar sobre producción. Antes de probar la aplicación, origen y destino coincidieron en la revisión Alembic `c7d14a9206b1` y en los conteos relevantes: 0 usuarios, 0 check-ins, 0 registros de hábitos, 17 elementos de biblioteca y 0 hábitos de usuario.

La API restaurada completó registro e inicio de sesión; por eso la rama aislada conserva después de la prueba 1 usuario sintético y sus 8 hábitos iniciales. Producción se volvió a consultar y permaneció con los conteos originales. El dump temporal se eliminó del ejecutor, no se publicó como artefacto y los dos secretos temporales de GitHub se retiraron al finalizar.

## Comportamiento y limites que conviene conocer

- Una racha considera activo cualquier dia con un check-in guardado o al menos un habito completado. Tolera un dia ausente; dos dias ausentes la cortan. La mejor racha mostrada y usada para nuevos logros se calcula sobre una ventana movil de 90 dias. Los logros ya obtenidos no se revocan.
- Los reportes convierten la fecha de creacion de habitos a `America/Guatemala`. Un habito inactivo solo aparece si tuvo actividad en el periodo. Como no existe historial de activacion/desactivacion, no es posible reconstruir si estuvo activo en cada dia antiguo.
- Las correlaciones son exploratorias, no prueban causalidad. La “confianza” es una heuristica basada en tamano de muestra y fuerza estadistica; las relaciones de ayer a hoy conservan siempre su direccion temporal.
- Los borradores de Hoy viven unicamente en el navegador, separados por usuario y fecha. “Descartar borradores locales” no borra datos ya guardados en Neon.
- Las actualizaciones de la PWA se ofrecen sin forzar una recarga; si recargas con cambios pendientes, el navegador muestra la advertencia de salida.

## Diagnostico

```bash
docker compose --env-file .env.home -f docker-compose.home.yml logs --tail=100 migrations backend caddy
docker compose --env-file .env.home -f docker-compose.home.yml exec backend python -m alembic current
```

Si otro equipo no abre la app, revisa primero resolucion DNS, firewall local para 80/443 y que el certificado se haya instalado. No configures port-forwarding en el router.
