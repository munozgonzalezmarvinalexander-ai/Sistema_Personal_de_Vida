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

Antes de una migracion importante, crea una rama de backup en Neon y ademas un dump logico:

```bash
docker run --rm -e DATABASE_URL="$DATABASE_URL" -v "$PWD/backups:/backups" postgres:16-alpine sh -c 'pg_dump "$DATABASE_URL" -Fc -f /backups/rumbo.dump'
```

Prueba la restauracion en una rama Neon temporal, nunca primero en produccion:

```bash
docker run --rm -e RESTORE_DATABASE_URL="$RESTORE_DATABASE_URL" -v "$PWD/backups:/backups" postgres:16-alpine sh -c 'pg_restore --clean --if-exists --no-owner -d "$RESTORE_DATABASE_URL" /backups/rumbo.dump'
```

Verifica alli que Alembic esta en `head`, que los conteos de usuarios/check-ins/logs coinciden y que puedes iniciar sesion. Elimina la rama temporal solo despues de documentar el resultado.

## Diagnostico

```bash
docker compose --env-file .env.home -f docker-compose.home.yml logs --tail=100 migrations backend caddy
docker compose --env-file .env.home -f docker-compose.home.yml exec backend python -m alembic current
```

Si otro equipo no abre la app, revisa primero resolucion DNS, firewall local para 80/443 y que el certificado se haya instalado. No configures port-forwarding en el router.
