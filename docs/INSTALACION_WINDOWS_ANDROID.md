# Instalar y usar Rumbo en Windows 11 y Android

Esta guía permite instalar Rumbo desde cero en una laptop con Windows 11 Home de 64 bits y usarlo desde un teléfono Android conectado a la misma red WiFi. No requiere publicar la aplicación en Internet, abrir puertos del router ni instalar un APK.

Los comandos están escritos para **PowerShell**. Cuando un paso requiere permisos de administrador se indica expresamente. En los demás pasos usa una ventana normal de PowerShell.

## 1. Cómo funciona esta instalación

Rumbo queda distribuido así:

| Componente | Dónde funciona | Función |
|---|---|---|
| Docker Desktop | Laptop | Ejecuta los contenedores Linux de Rumbo mediante WSL 2. |
| Caddy | Laptop, contenedor `caddy` | Publica Rumbo por HTTPS en los puertos 443 y 80 de la red doméstica. |
| Frontend | Laptop, contenedor `frontend` | Sirve la interfaz web y los archivos de la PWA. |
| Backend | Laptop, contenedor `backend` | Gestiona cuentas, hábitos, check-ins, reportes y demás funciones. |
| Migraciones | Laptop, contenedor temporal `migrations` | Actualiza el esquema de PostgreSQL antes de iniciar el backend. |
| PostgreSQL | Neon | Guarda de forma persistente la cuenta, contraseña cifrada, hábitos y registros. |
| PWA | Android | Es la aplicación web instalada desde Chrome; no es un APK. |

La laptop debe estar encendida, conectada a la WiFi y con Docker Desktop y los contenedores funcionando para que el teléfono pueda abrir Rumbo. Neon también debe ser accesible por Internet.

Qué ocurre ante una interrupción:

- Si la laptop está apagada, suspendida o con la tapa cerrada y configurada para suspender, el teléfono no puede conectarse.
- Si el teléfono pierde la WiFi doméstica, no puede alcanzar la dirección privada de la laptop. Los datos móviles no sustituyen esa conexión local.
- Si la WiFi sigue funcionando pero se cae Internet, el teléfono puede llegar al frontend de la laptop y una PWA ya instalada puede mostrar archivos almacenados en caché, pero el backend no puede consultar ni guardar en Neon.
- Si Neon no responde, Rumbo muestra un error y no reintenta escrituras inciertas. Los cambios sin guardar de la pantalla Hoy se conservan como borrador local en ese navegador.
- Los recursos de la interfaz tienen soporte sin conexión limitado; Rumbo no es una aplicación completamente offline.
- Los recordatorios son locales. Se revisan cuando Rumbo está abierto, recupera el foco o vuelve la conexión; Android no garantiza que aparezcan con la aplicación completamente cerrada.

## 2. Preparar Windows 11

### Paso 1. Confirmar que Windows es de 64 bits

**Dispositivo:** laptop. **Carpeta:** cualquiera. **PowerShell normal.**

Abre Inicio, busca **Información del sistema** y comprueba que `Tipo de sistema` indique `PC basado en x64`. También puedes ejecutar:

```powershell
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsArchitecture
```

Debe aparecer Windows 11 y una arquitectura de 64 bits.

### Paso 2. Comprobar la virtualización

**Dispositivo:** laptop. **Sin comandos.**

Abre **Administrador de tareas > Rendimiento > CPU** y busca `Virtualización: Habilitada`.

Si aparece deshabilitada, reinicia la laptop, entra en BIOS/UEFI y activa una opción llamada normalmente **Intel Virtualization Technology**, **VT-x**, **AMD-V** o **SVM Mode**. La ubicación depende del fabricante. Guarda los cambios y vuelve a iniciar Windows.

### Paso 3. Instalar o actualizar WSL 2

**Dispositivo:** laptop. **Carpeta:** cualquiera. **PowerShell como administrador.**

Primero comprueba la versión:

```powershell
wsl --version
```

Si muestra una versión, actualízala:

```powershell
wsl --update
```

Si Windows indica que WSL no está instalado, ejecuta:

```powershell
wsl --install
```

Reinicia Windows si el comando lo solicita. Rumbo no necesita que trabajes dentro de una consola Linux: Docker Desktop usa WSL 2 internamente.

### Paso 4. Instalar Git

**Dispositivo:** laptop. **Carpeta:** cualquiera. **PowerShell normal.**

```powershell
winget install --id Git.Git -e --source winget
```

Cierra PowerShell, abre una ventana nueva y comprueba la instalación:

```powershell
git --version
```

Debe aparecer un número de versión. Si `winget` no está disponible, descarga Git for Windows desde <https://git-scm.com/install/windows>, usa las opciones recomendadas del instalador y vuelve a ejecutar la comprobación.

### Paso 5. Instalar Docker Desktop

**Dispositivo:** laptop. **Carpeta:** cualquiera. **PowerShell normal.**

```powershell
winget install --id Docker.DockerDesktop -e --source winget
```

Si Windows solicita elevación, acéptala. Reinicia la laptop si el instalador o WSL lo pide.

### Paso 6. Iniciar Docker Desktop

**Dispositivo:** laptop. **Sin comandos.**

Abre **Docker Desktop** desde Inicio, acepta sus condiciones para uso personal y selecciona el motor basado en **WSL 2** si presenta esa opción. Windows 11 Home utiliza contenedores Linux, que son los que necesita Rumbo. No es obligatorio iniciar sesión en Docker Hub para ejecutar este proyecto.

Espera hasta que Docker Desktop indique que el motor está funcionando.

### Paso 7. Comprobar Docker y Compose

**Dispositivo:** laptop. **Carpeta:** cualquiera. **PowerShell normal.**

```powershell
docker version
docker compose version
docker run --rm hello-world
```

Los dos primeros comandos deben mostrar versiones de cliente y servidor. El último debe terminar con el mensaje de bienvenida de Docker. La primera ejecución puede tardar mientras descarga una imagen pequeña.

## 3. Descargar Rumbo

### Paso 8. Crear una carpeta fuera de OneDrive

**Dispositivo:** laptop. **Carpeta inicial:** cualquiera. **PowerShell normal.**

```powershell
New-Item -ItemType Directory -Path C:\Rumbo -Force
Set-Location C:\Rumbo
```

Usar `C:\Rumbo` evita sincronizaciones parciales, bloqueos y cambios de ruta causados por OneDrive.

### Paso 9. Clonar el repositorio

**Dispositivo:** laptop. **Carpeta:** `C:\Rumbo`. **PowerShell normal.**

```powershell
git clone https://github.com/munozgonzalezmarvinalexander-ai/Sistema_Personal_de_Vida.git
Set-Location C:\Rumbo\Sistema_Personal_de_Vida
git status --short --branch
```

El último comando debe indicar la rama `main` sin listar archivos modificados.

### Si ya existe una copia

No vuelvas a clonar encima de la carpeta existente y no borres `.env.home`.

**Dispositivo:** laptop. **Carpeta:** `C:\Rumbo\Sistema_Personal_de_Vida`. **PowerShell normal.**

1. Guarda una copia privada de la configuración si existe:

   ```powershell
   New-Item -ItemType Directory -Path C:\Rumbo\configuracion-privada -Force
   if (Test-Path .env.home) { Copy-Item .env.home C:\Rumbo\configuracion-privada\.env.home }
   ```

2. Revisa cambios locales:

   ```powershell
   git status --short
   ```

3. Si no aparece nada, actualiza normalmente:

   ```powershell
   git pull --ff-only
   ```

4. Si aparecen archivos, consérvalos antes de actualizar:

   ```powershell
   git stash push --include-untracked -m "Cambios locales antes de actualizar Rumbo"
   git pull --ff-only
   git stash pop
   ```

   Si `git stash pop` informa conflictos, no borres archivos ni fuerces la actualización. Conserva la copia de `.env.home` y resuelve los archivos indicados antes de continuar.

## 4. Configurar Neon y las variables

### Paso 10. Obtener la conexión directa del proyecto Neon existente

**Dispositivo:** laptop. **Aplicación:** navegador web.

1. Entra en la consola de Neon con tu cuenta.
2. Abre el proyecto que ya usa Rumbo; no crees otro proyecto.
3. Selecciona la rama de producción y la base de datos `neondb`.
4. Pulsa **Connect**.
5. Elige **Connection string**.
6. Desactiva **Connection pooling** o selecciona la conexión directa.
7. Copia la URL y guárdala temporalmente en un administrador de contraseñas.

El host directo no contiene `-pooler`. Neon recomienda una conexión directa para migraciones y `pg_dump`. La URL suele tener esta forma ficticia:

```text
postgresql://rumbo_owner:CLAVE_FICTICIA@ep-ejemplo.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

No compartas esa dirección: incluye una contraseña. Si la conexión copiada no contiene `sslmode=require`, agrégalo como parámetro antes de usarla.

### Paso 11. Copiar la plantilla de configuración

**Dispositivo:** laptop. **Carpeta:** `C:\Rumbo\Sistema_Personal_de_Vida`. **PowerShell normal.**

```powershell
Copy-Item .env.home.example .env.home
```

`.env.home` está ignorado por Git y no debe subirse al repositorio.

### Paso 12. Generar `SECRET_KEY` sin instalar Python

**Dispositivo:** laptop. **Carpeta:** proyecto. **PowerShell normal.**

```powershell
$RumboRandomBytes = New-Object byte[] 48
$RumboRandomGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$RumboRandomGenerator.GetBytes($RumboRandomBytes)
$RumboSecret = [Convert]::ToBase64String($RumboRandomBytes)
$RumboSecret
$RumboRandomGenerator.Dispose()
Remove-Variable RumboRandomBytes,RumboRandomGenerator
```

Copia el resultado únicamente a `.env.home`. Debe tener bastante más de los 32 caracteres mínimos. Al terminar de editar el archivo ejecuta `Remove-Variable RumboSecret`.

### Paso 13. Encontrar la IPv4 doméstica correcta

**Dispositivo:** laptop, conectada a la WiFi doméstica. **Carpeta:** cualquiera. **PowerShell normal.**

```powershell
Get-NetIPConfiguration | Where-Object { $_.NetAdapter.Status -eq "Up" -and $_.IPv4DefaultGateway } | Select-Object InterfaceAlias, IPv4Address, IPv4DefaultGateway
```

Elige la fila del adaptador físico **Wi-Fi** que tenga la puerta de enlace de tu router. La dirección suele comenzar por `192.168.`, `10.` o por `172.16.` a `172.31.`. No elijas interfaces llamadas `vEthernet`, `WSL`, `Docker`, `VPN`, `Bluetooth` ni adaptadores sin puerta de enlace.

Para obtener solo la dirección del adaptador, reemplaza `Wi-Fi` si tu interfaz tiene otro nombre:

```powershell
$RumboIp = (Get-NetIPConfiguration -InterfaceAlias "Wi-Fi").IPv4Address.IPAddress | Select-Object -First 1
$RumboIp
```

En los ejemplos siguientes se usa la IP ficticia `192.168.1.50`. Sustitúyela por la tuya.

### Paso 14. Reservar la IP en el router

**Dispositivo:** laptop. **Aplicación:** panel del router.

Si tu router lo permite, crea una **reserva DHCP** para que la dirección de la laptop no cambie. La opción puede llamarse `DHCP reservation`, `Address reservation`, `Static lease` o `IP reservada`. Asocia la IPv4 seleccionada con la dirección MAC del adaptador Wi-Fi.

No configures reenvío de puertos, `port forwarding`, DMZ ni acceso remoto. Rumbo debe seguir siendo accesible solo desde la red doméstica.

### Paso 15. Editar `.env.home`

**Dispositivo:** laptop. **Carpeta:** `C:\Rumbo\Sistema_Personal_de_Vida`. **PowerShell normal.**

```powershell
notepad .env.home
```

Deja exactamente tres variables, usando tus valores reales:

```dotenv
DATABASE_URL=postgresql+psycopg://rumbo_owner:CLAVE_FICTICIA@ep-ejemplo.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SECRET_KEY=VALOR_ALEATORIO_GENERADO_EN_EL_PASO_12
RUMBO_HOST=192.168.1.50
```

Al pegar la URL de Neon, cambia solamente el prefijo `postgresql://` por `postgresql+psycopg://`. Conserva usuario, contraseña, host, base de datos y parámetros. `RUMBO_HOST` debe contener solo la IP: no agregues `https://`, puerto ni barra final.

Las variables son:

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión directa y cifrada al PostgreSQL de Neon. La usan las migraciones y el backend. |
| `SECRET_KEY` | Firma los tokens de inicio de sesión. Si la cambias, las sesiones existentes dejan de ser válidas. |
| `RUMBO_HOST` | IPv4 o nombre local para el certificado, CORS y la dirección de acceso. La guía usa la IPv4. |

En Bloc de notas selecciona **Archivo > Guardar**, no `Guardar como`. Como el archivo ya existe, conservará el nombre `.env.home` y no terminará en `.txt`.

### Paso 16. Comprobar el nombre y las variables sin mostrar secretos

**Dispositivo:** laptop. **Carpeta:** proyecto. **PowerShell normal.**

```powershell
Get-Item .env.home | Select-Object Name, Length
Get-Content .env.home | ForEach-Object { if ($_ -match '^([^#=]+)=') { $matches[1] } }
$RumboSecretLine = Get-Content .env.home | Where-Object { $_ -like 'SECRET_KEY=*' }
($RumboSecretLine -replace '^SECRET_KEY=', '').Length
Remove-Variable RumboSecretLine
```

Debe aparecer el nombre `.env.home`, las tres variables y una longitud de clave de al menos 32. No publiques el contenido del archivo ni capturas que muestren sus valores.

### Paso 17. Limpiar la clave temporal de PowerShell

**Dispositivo:** laptop. **PowerShell normal.**

```powershell
Remove-Variable RumboSecret -ErrorAction SilentlyContinue
```

## 5. Permitir únicamente la red WiFi privada

### Paso 18. Confirmar que la WiFi tiene perfil privado

**Dispositivo:** laptop. **Carpeta:** cualquiera. **PowerShell normal.**

```powershell
Get-NetConnectionProfile | Select-Object InterfaceAlias, Name, NetworkCategory
```

La WiFi doméstica debe figurar como `Private`. No cambies a privado una red pública, de hotel o de cafetería.

Si tu WiFi doméstica aparece como pública, cambia solo esa interfaz:

**PowerShell como administrador:**

```powershell
Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Private
```

### Paso 19. Crear la regla limitada de firewall

**Dispositivo:** laptop. **Carpeta:** cualquiera. **PowerShell como administrador.**

```powershell
New-NetFirewallRule -DisplayName "Rumbo HTTPS - red privada" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 443 -Profile Private -RemoteAddress LocalSubnet
```

Esta regla permite HTTPS solo desde la subred local cuando Windows considera la conexión privada. No abre el router ni hace Rumbo público. La guía usa siempre la URL `https://`; por eso no es necesario abrir el puerto 80 en el firewall.

### Paso 20. Comprobar la regla

**Dispositivo:** laptop. **PowerShell normal.**

```powershell
Get-NetFirewallRule -DisplayName "Rumbo HTTPS - red privada" | Select-Object DisplayName, Enabled, Profile, Direction, Action
```

Debe aparecer habilitada, de entrada, privada y permitida.

## 6. Arrancar Rumbo por primera vez

### Paso 21. Construir e iniciar el perfil doméstico

**Dispositivo:** laptop. **Carpeta:** `C:\Rumbo\Sistema_Personal_de_Vida`. **PowerShell normal.**

```powershell
Set-Location C:\Rumbo\Sistema_Personal_de_Vida
docker compose --env-file .env.home -f docker-compose.home.yml up -d --build
```

La primera ejecución descarga imágenes de Python, Node, Nginx y Caddy, instala dependencias y compila el frontend. Puede tardar varios minutos. El servicio `migrations` ejecuta Alembic una vez; el backend solo arranca si esa migración termina correctamente.

### Paso 22. Comprobar los contenedores y la migración

**Dispositivo:** laptop. **Carpeta:** proyecto. **PowerShell normal.**

```powershell
docker compose --env-file .env.home -f docker-compose.home.yml ps -a
```

El resultado correcto es:

- `migrations`: terminado con código `0` (`Exited (0)`). Es normal que no permanezca activo.
- `backend`, `frontend` y `caddy`: `Up`; backend y frontend pueden tardar unos segundos en marcarse saludables.

Comprueba además la revisión de Alembic:

```powershell
docker compose --env-file .env.home -f docker-compose.home.yml exec backend python -m alembic current
```

Debe mostrar una revisión seguida de `(head)`.

### Paso 23. Consultar errores si algo no arrancó

**Dispositivo:** laptop. **Carpeta:** proyecto. **PowerShell normal.**

```powershell
docker compose --env-file .env.home -f docker-compose.home.yml logs --tail=100 migrations backend frontend caddy
```

No continúes con certificados o credenciales hasta que `migrations` termine con código 0 y los otros tres servicios estén activos.

## 7. Instalar la autoridad HTTPS local

Caddy crea una autoridad certificadora exclusiva de esta instalación y conserva sus claves privadas dentro del volumen `caddy_data`. Solo se extrae el certificado público `root.crt`; nunca extraigas, copies ni compartas archivos `.key`.

### Paso 24. Extraer únicamente el certificado público

**Dispositivo:** laptop. **Carpeta:** `C:\Rumbo\Sistema_Personal_de_Vida`. **PowerShell normal.**

```powershell
docker compose --env-file .env.home -f docker-compose.home.yml cp caddy:/data/caddy/pki/authorities/local/root.crt .\rumbo-home-ca.crt
Get-Item .\rumbo-home-ca.crt | Select-Object Name, Length
```

Debe existir `rumbo-home-ca.crt` y tener un tamaño mayor que cero. El archivo está ignorado por Git.

### Paso 25. Registrar la huella SHA-256

**Dispositivo:** laptop. **Carpeta:** proyecto. **PowerShell normal.**

```powershell
certutil -hashfile .\rumbo-home-ca.crt SHA256
```

Guarda la huella en una nota local. Si Android permite ver los detalles del certificado instalado, compara esa huella. Si no los muestra, instala únicamente el archivo que acabas de extraer y transferir directamente desde tu laptop.

### Paso 26. Confiar en el certificado en Windows

**Dispositivo:** laptop. **Carpeta:** proyecto. **PowerShell normal.**

```powershell
certutil -user -addstore Root .\rumbo-home-ca.crt
```

Debe informar que el certificado se agregó correctamente al almacén raíz del usuario actual. Cierra y vuelve a abrir Chrome si ya estaba abierto.

### Paso 27. Probar primero desde la laptop

**Dispositivo:** laptop. **Aplicación:** Chrome o Edge.

Abre la dirección formada con tu `RUMBO_HOST`, por ejemplo:

```text
https://192.168.1.50
```

La página debe abrir sin advertencia de certificado. Comprueba también la API desde PowerShell, sustituyendo la IP:

```powershell
Invoke-RestMethod -Uri "https://192.168.1.50/api/health"
```

Debe devolver `status` igual a `ok`, `app` igual a `Rumbo` y `environment` igual a `production`.

Si aparece una advertencia HTTPS, no introduzcas correo ni contraseña. Revisa la URL, la IP de `.env.home`, la instalación del certificado y la fecha/hora de Windows.

### Paso 28. Transferir el certificado al teléfono

**Dispositivos:** laptop y Android.

Copia `rumbo-home-ca.crt` por cable USB o Quick Share directamente al teléfono. No lo envíes a chats públicos, correo compartido ni almacenamiento público. Es un certificado público, pero confiar en él concede autoridad a la instalación de Caddy que posee su clave privada.

### Paso 29. Instalar el certificado CA en Android

**Dispositivo:** Android. **Sin comandos.**

Los nombres cambian según fabricante y versión. Busca una de estas rutas:

- Android/Pixel/Motorola: **Ajustes > Seguridad y privacidad > Más ajustes de seguridad > Cifrado y credenciales > Instalar un certificado > Certificado de CA**.
- Samsung: **Ajustes > Seguridad y privacidad > Más ajustes de seguridad > Instalar desde almacenamiento del dispositivo > Certificado de CA**.
- Xiaomi/Redmi/otros: **Ajustes > Contraseñas y seguridad o Seguridad > Privacidad/Cifrado y credenciales > Instalar certificado > Certificado de CA**.

Selecciona `rumbo-home-ca.crt`. Elige **Certificado de CA**, no certificado WiFi ni certificado de VPN/aplicaciones. Android puede exigir PIN, patrón o huella y advertir que el tráfico cifrado puede ser inspeccionado; es esperado al instalar una CA privada. Cancela si el archivo no proviene directamente de tu laptop.

Después, busca **Credenciales de usuario** o **Certificados de confianza > Usuario**. Debe aparecer `Caddy Local Authority`. Compara la huella SHA-256 si el teléfono la muestra.

## 8. Instalar y configurar Rumbo en Android

### Paso 30. Conectar Android a la misma WiFi

**Dispositivo:** Android.

Confirma que el teléfono usa exactamente la misma red doméstica que la laptop. Desactiva temporalmente una VPN. No uses la red de invitados: muchos routers aíslan a sus clientes e impiden que el teléfono alcance la laptop.

### Paso 31. Abrir la dirección HTTPS exacta

**Dispositivo:** Android. **Aplicación:** Chrome.

Escribe la misma dirección probada en la laptop, por ejemplo:

```text
https://192.168.1.50
```

Debe abrir sin advertencias. No continúes si Chrome muestra `Tu conexión no es privada`, un nombre de certificado incorrecto o una IP distinta.

### Paso 32. Crear la cuenta personal

**Dispositivo:** Android o laptop. **Aplicación:** Rumbo.

Pulsa **Crear cuenta**, introduce tu nombre, correo y una contraseña exclusiva, y completa el registro. Rumbo crea 8 hábitos iniciales. La contraseña se envía por HTTPS y se almacena en PostgreSQL como hash bcrypt, no en texto plano.

Si ya creaste la cuenta, usa **Iniciar sesión**. No crees cuentas adicionales para esta instalación personal.

### Paso 33. Instalar la PWA

**Dispositivo:** Android. **Aplicación:** Chrome.

Usa el botón **Instalar** que puede mostrar Rumbo. Si no aparece, abre el menú de tres puntos de Chrome y elige una de estas opciones, según la versión:

- **Instalar aplicación**.
- **Instalar app**.
- **Agregar a pantalla de inicio**.
- **Instalar y crear acceso directo**.

Confirma la instalación. Rumbo aparecerá en la pantalla de inicio o en el cajón de aplicaciones y se abrirá en una ventana independiente. No se descarga ni se instala ningún APK.

### Paso 34. Activar y probar notificaciones

**Dispositivo:** Android. **Aplicación:** PWA Rumbo.

1. Abre **Recordatorios** dentro de Rumbo.
2. Pulsa **Activar notificaciones**.
3. Acepta el permiso de Android/Chrome.
4. Pulsa **Enviar prueba**.

Debe aparecer una notificación de Rumbo. Si no aparece, abre **Ajustes de Android > Aplicaciones > Rumbo o Chrome > Notificaciones** y habilítalas. Recuerda que los recordatorios actuales funcionan mientras la app está abierta o vuelve a activarse; no son notificaciones push garantizadas con la app cerrada.

## 9. Prueba final de funcionamiento

### Paso 35. Guardar un registro real pequeño

**Dispositivo:** laptop o Android. **Aplicación:** Rumbo.

En **Hoy**, marca un hábito con su nivel correcto, introduce una métrica sencilla y una nota breve, y pulsa **Guardar día**. Debe aparecer `Día guardado correctamente`.

### Paso 36. Confirmar la persistencia

**Dispositivo:** el mismo dispositivo.

Cierra Rumbo, vuelve a abrirlo e inicia sesión si fuera necesario. Comprueba que el hábito, la métrica y la nota siguen presentes. Esos datos provienen de Neon, no del almacenamiento temporal del navegador.

### Paso 37. Confirmar la sincronización entre laptop y teléfono

**Dispositivos:** laptop y Android.

Abre Rumbo en el otro dispositivo con la misma cuenta. Actualiza la página o vuelve a entrar en **Hoy**. Debe mostrar los mismos datos guardados.

### Paso 38. Probar un guardado fallido sin arriesgar datos

**Dispositivo:** Android. **Aplicación:** PWA Rumbo.

1. Anota el valor actualmente guardado en un campo de Hoy.
2. Cambia ese campo por un valor temporal reconocible, pero todavía no lo guardes.
3. Desactiva la WiFi del teléfono. Los datos móviles no alcanzarán la IP privada de la laptop.
4. Pulsa **Guardar día** y confirma que aparece un error.
5. Cierra y vuelve a abrir Rumbo: el cambio debe seguir como borrador local si la pantalla puede cargarse desde caché.
6. Reconecta la misma WiFi.
7. Pulsa **Descartar borrador de este día** para restaurar los últimos datos confirmados del servidor.

No uses **Eliminar todos mis borradores locales** salvo que quieras borrar los borradores de todas las fechas de ese navegador. Ninguna de esas dos opciones elimina datos ya guardados en Neon.

### Paso 39. Reconocer una actualización de la PWA

**Dispositivo:** Android o laptop. **Aplicación:** Rumbo.

Después de actualizar los contenedores puede aparecer **Hay una actualización de Rumbo**, con botones **Actualizar** y **Después**. Si hay cambios sin guardar, el botón Actualizar permanece deshabilitado; guarda o descarta primero. Luego pulsa **Actualizar** y confirma que la app vuelve a abrir.

## 10. Uso diario

### Paso 40. Iniciar Rumbo después de encender la laptop

**Dispositivo:** laptop. **Carpeta:** proyecto. **PowerShell normal.**

Abre Docker Desktop y espera a que el motor esté listo. Los servicios tienen política `unless-stopped` y normalmente vuelven a iniciarse con Docker. Compruébalo:

```powershell
Set-Location C:\Rumbo\Sistema_Personal_de_Vida
docker compose --env-file .env.home -f docker-compose.home.yml ps -a
```

Si no están activos, ejecútalos sin reconstruir:

```powershell
docker compose --env-file .env.home -f docker-compose.home.yml up -d
```

### Paso 41. Detener Rumbo

**Dispositivo:** laptop. **Carpeta:** proyecto. **PowerShell normal.**

```powershell
docker compose --env-file .env.home -f docker-compose.home.yml stop
```

Los contenedores se detienen sin borrar configuración, imágenes, certificados ni datos de Neon.

### Paso 42. Volver a iniciar Rumbo

**Dispositivo:** laptop. **Carpeta:** proyecto. **PowerShell normal.**

```powershell
docker compose --env-file .env.home -f docker-compose.home.yml start
```

Si cambió código o configuración, usa `up -d --build` en lugar de `start`.

### Paso 43. Evitar la suspensión cuando necesites acceso móvil

**Dispositivo:** laptop. **Sin comandos.**

Abre **Configuración > Sistema > Energía y batería > Pantalla, suspensión e hibernación**. Mientras la laptop esté conectada a corriente, configura la suspensión según el tiempo durante el cual necesites acceder desde el teléfono.

En **Panel de control > Hardware y sonido > Opciones de energía > Elegir el comportamiento del cierre de la tapa**, evita suspender al cerrar la tapa solo si la laptop queda conectada, ventilada y en un lugar seguro. Apagar la pantalla no interrumpe Rumbo; suspender Windows sí.

### Paso 44. Iniciar Docker con Windows

**Dispositivo:** laptop. **Aplicación:** Docker Desktop.

En **Settings > General**, activa **Start Docker Desktop when you sign in to your computer**. Después de un reinicio verifica una vez que `backend`, `frontend` y `caddy` regresan a `Up`.

## 11. Actualizar Rumbo

### Paso 45. Guardar la configuración antes de actualizar

**Dispositivo:** laptop. **Carpeta:** proyecto. **PowerShell normal.**

```powershell
New-Item -ItemType Directory -Path C:\Rumbo\configuracion-privada -Force
Copy-Item .env.home C:\Rumbo\configuracion-privada\.env.home -Force
```

Esta copia contiene secretos. No la subas a Git ni la compartas.

### Paso 46. Comprobar que el código no tiene cambios locales

**Dispositivo:** laptop. **Carpeta:** proyecto. **PowerShell normal.**

```powershell
git status --short --branch
```

Si lista archivos modificados, sigue el procedimiento de conservación indicado en **Si ya existe una copia** antes de continuar.

### Paso 47. Descargar la versión nueva

**Dispositivo:** laptop. **Carpeta:** proyecto. **PowerShell normal.**

```powershell
git pull --ff-only
```

Debe terminar sin conflictos. `.env.home` permanece porque Git lo ignora.

### Paso 48. Reconstruir e iniciar la versión nueva

**Dispositivo:** laptop. **Carpeta:** proyecto. **PowerShell normal.**

```powershell
docker compose --env-file .env.home -f docker-compose.home.yml up -d --build
docker compose --env-file .env.home -f docker-compose.home.yml ps -a
```

La migración debe terminar con código 0 y los otros servicios quedar activos. No uses `docker compose down -v`: `-v` borraría la autoridad local de Caddy y obligaría a volver a confiar en un certificado nuevo.

### Paso 49. Aplicar la actualización en Android

**Dispositivo:** Android. **Aplicación:** PWA Rumbo.

Abre Rumbo conectado a la WiFi. Cuando aparezca el aviso, guarda o descarta cambios pendientes y pulsa **Actualizar**. Si no aparece inmediatamente, cierra la PWA, vuelve a abrirla y espera unos segundos con conexión a la laptop.

## 12. Copias de seguridad y recuperación

La exportación JSON/CSV de Rumbo es útil para consultar o llevar tus datos a otro sistema, pero no sustituye una copia completa de PostgreSQL. Un respaldo completo conserva esquema, revisión de Alembic y todas las tablas.

### Paso 50. Crear una carpeta local privada para respaldos

**Dispositivo:** laptop. **Carpeta:** proyecto. **PowerShell normal.**

```powershell
New-Item -ItemType Directory -Path .\backups -Force
```

La carpeta está ignorada por Git. Sus archivos contienen datos personales y deben protegerse.

### Paso 51. Crear un dump con PostgreSQL 18

**Dispositivo:** laptop. **Carpeta:** proyecto. **PowerShell normal.**

```powershell
$env:DATABASE_URL = Read-Host "Pega la URL directa de Neon"
$RumboBackupFile = "rumbo-$(Get-Date -Format 'yyyyMMdd-HHmmss').dump"
docker run --rm -e DATABASE_URL -e BACKUP_FILE="$RumboBackupFile" -v "${PWD}/backups:/backups" postgres:18-alpine sh -c 'pg_dump "$DATABASE_URL" -Fc -f "/backups/$BACKUP_FILE"'
Get-Item ".\backups\$RumboBackupFile" | Select-Object Name, Length, LastWriteTime
Remove-Item Env:DATABASE_URL
```

En este paso pega la URL original de Neon que empieza por `postgresql://`, no la variante `postgresql+psycopg://` usada por SQLAlchemy en `.env.home`. El archivo debe existir y tener tamaño mayor que cero. `sh -c` se ejecuta dentro del contenedor PostgreSQL, no cambia la terminal de Windows; permite que la URL se expanda dentro del contenedor y no aparezca completa en la línea de comandos.

### Paso 52. Crear una rama aislada de recuperación en Neon

**Dispositivo:** laptop. **Aplicación:** consola de Neon.

En el proyecto existente abre **Branches**, crea una rama nueva basada en producción y llámala, por ejemplo, `restore-check-20260917`. Obtén su conexión **directa**, confirma que el host es distinto del de producción y no contiene `-pooler`.

Nunca pruebes primero una restauración sobre producción.

### Paso 53. Restaurar el dump únicamente en la rama aislada

**Dispositivo:** laptop. **Carpeta:** proyecto. **PowerShell normal.**

Usa el nombre real mostrado en el paso 51:

```powershell
$env:RESTORE_DATABASE_URL = Read-Host "Pega la URL directa postgresql:// de la rama aislada"
Get-ChildItem .\backups\*.dump | Select-Object Name, Length, LastWriteTime
$RumboBackupFile = Read-Host "Escribe el nombre exacto del dump que vas a restaurar"
docker run --rm -e RESTORE_DATABASE_URL -e BACKUP_FILE="$RumboBackupFile" -v "${PWD}/backups:/backups" postgres:18-alpine sh -c 'pg_restore --clean --if-exists --no-owner -d "$RESTORE_DATABASE_URL" "/backups/$BACKUP_FILE"'
```

`--clean` reemplaza objetos en la base destino. Antes de pulsar Intro confirma que `RESTORE_DATABASE_URL` pertenece a la rama aislada, nunca a producción.

### Paso 54. Comprobar la revisión restaurada

**Dispositivo:** laptop. **Carpeta:** proyecto. **PowerShell normal.**

```powershell
docker run --rm -e RESTORE_DATABASE_URL postgres:18-alpine sh -c 'psql "$RESTORE_DATABASE_URL" -c "SELECT version_num FROM alembic_version;"'
Remove-Item Env:RESTORE_DATABASE_URL
Remove-Variable RumboBackupFile
```

La consulta debe devolver una revisión. Para una verificación completa, compara conteos de usuarios, check-ins y registros de hábitos con producción y prueba el inicio de sesión usando temporalmente esa rama como `DATABASE_URL`.

### Paso 55. Recuperar sin sobrescribir producción

**Dispositivo:** laptop. **Aplicaciones:** Neon y Bloc de notas.

Cuando la rama restaurada esté verificada, la opción más segura es conservar producción intacta y cambiar `DATABASE_URL` de `.env.home` a la URL directa de la rama restaurada. En `.env.home`, vuelve a cambiar el prefijo de esa URL de `postgresql://` a `postgresql+psycopg://`. Después ejecuta:

```powershell
docker compose --env-file .env.home -f docker-compose.home.yml up -d --build
```

Prueba Rumbo y conserva el dump hasta confirmar la recuperación. El flujo manual **Database Restore Check** de GitHub ofrece otra verificación aislada, pero requiere configurar temporalmente sus dos secretos desde GitHub Actions.

## 13. Solución de problemas

Ejecuta las comprobaciones desde `C:\Rumbo\Sistema_Personal_de_Vida`, salvo que la tabla indique otra cosa.

| Síntoma | Causa probable | Comprobación | Solución concreta |
|---|---|---|---|
| Docker Desktop no inicia | WSL desactualizado, virtualización apagada o reinicio pendiente | `wsl --version`; Administrador de tareas > CPU > Virtualización | Ejecuta `wsl --update` como administrador, habilita virtualización en BIOS/UEFI y reinicia Windows. |
| `docker version` muestra solo cliente o error del daemon | Docker Desktop todavía no está listo | Mira el estado de Docker Desktop | Abre Docker Desktop y espera a que el motor indique que está funcionando. |
| Error de WSL 2 | Componentes de Windows incompletos | `wsl --status` y `wsl --version` | Ejecuta `wsl --install` o `wsl --update` como administrador y reinicia cuando se solicite. |
| Caddy no puede usar el puerto 80 o 443 | Otro programa escucha en ese puerto | `Get-NetTCPConnection -State Listen -LocalPort 80,443 | Select-Object LocalAddress,LocalPort,OwningProcess` | Identifica el proceso con `Get-Process -Id NUMERO`, detén o reconfigura la aplicación responsable y vuelve a ejecutar `up -d`. No finalices procesos desconocidos a la fuerza. |
| `migrations` termina con código distinto de 0 | URL de Neon incorrecta, pooled, contraseña errónea o migración fallida | `docker compose --env-file .env.home -f docker-compose.home.yml logs --tail=100 migrations` | Copia otra vez la conexión directa, usa `postgresql+psycopg://`, confirma `sslmode=require` y reinicia con `up -d --build`. No modifiques tablas manualmente. |
| Backend indica error de conexión a Neon | Sin Internet, Neon suspendido temporalmente o credencial inválida | Revisa Internet y `docker compose --env-file .env.home -f docker-compose.home.yml logs --tail=100 backend` | Reactiva/abre el proyecto en Neon, vuelve a obtener la URL directa y corrige `.env.home`. |
| La laptop abre Rumbo pero el teléfono no | WiFi distinta, red de invitados, VPN, aislamiento de clientes o firewall | Confirma la IP con `Get-NetIPConfiguration`; comprueba la regla con `Get-NetFirewallRule -DisplayName "Rumbo HTTPS - red privada"` | Usa la misma WiFi normal, desactiva la VPN, evita la red de invitados y recrea la regla privada si falta. |
| La IP de la laptop cambió | No existe reserva DHCP | Repite el paso 13 y compara con `RUMBO_HOST` | Reserva la IP en el router, actualiza `RUMBO_HOST` y ejecuta `up -d --build`. Abre la nueva URL. |
| Chrome muestra advertencia de certificado | CA no instalada, URL diferente, fecha incorrecta o volumen de Caddy recreado | Compara `certutil -hashfile .\rumbo-home-ca.crt SHA256` y la URL con `RUMBO_HOST` | Extrae otra vez `root.crt`, instala esa CA en ambos dispositivos, corrige fecha/hora y no introduzcas credenciales hasta que desaparezca el aviso. |
| Falta el botón para instalar | Chrome no considera segura la página, la PWA ya está instalada o el aviso se descartó | Comprueba HTTPS sin advertencias y busca Rumbo en el cajón de apps | Usa el menú de Chrome > **Instalar aplicación** o **Agregar a pantalla de inicio**. Si ya existe, abre la app instalada. |
| No aparecen notificaciones | Permiso denegado, ahorro de batería o app cerrada | Rumbo > Recordatorios muestra el estado del permiso | Habilita notificaciones para Rumbo/Chrome en Ajustes de Android, usa **Enviar prueba** y permite actividad en segundo plano si el fabricante la restringe. Aun así, no hay push garantizado con la app cerrada. |
| El teléfono deja de conectar al cerrar la tapa | Windows suspendió la laptop | Abre la tapa y ejecuta `docker compose --env-file .env.home -f docker-compose.home.yml ps -a` | Ajusta temporalmente suspensión y comportamiento de tapa según el paso 43. |
| La PWA muestra una versión antigua | Service worker pendiente o app no volvió a consultar la laptop | Busca el aviso **Hay una actualización de Rumbo** | Guarda o descarta cambios, pulsa **Actualizar**, cierra y reabre la PWA. Como último recurso, borra los datos del sitio solo después de guardar o descartar borradores; tendrás que iniciar sesión de nuevo. |
| `Invoke-RestMethod` falla en la laptop | Servicios detenidos, IP equivocada o CA no confiable | `docker compose --env-file .env.home -f docker-compose.home.yml ps -a` y `Test-NetConnection -ComputerName 127.0.0.1 -Port 443` | Inicia servicios, corrige `RUMBO_HOST` o reinstala el certificado público actual. |
| Rumbo muestra “Sin conexión” aunque la interfaz abre | El navegador no alcanza el backend o Neon | Revisa los logs de `backend` y prueba `/api/health` | Restaura WiFi/Internet, confirma que la laptop sigue activa y pulsa Reintentar. Los borradores locales no deben eliminarse. |

## 14. Comandos seguros de diagnóstico

**Dispositivo:** laptop. **Carpeta:** `C:\Rumbo\Sistema_Personal_de_Vida`. **PowerShell normal.**

Estado completo:

```powershell
docker compose --env-file .env.home -f docker-compose.home.yml ps -a
```

Últimos registros:

```powershell
docker compose --env-file .env.home -f docker-compose.home.yml logs --tail=100 migrations backend frontend caddy
```

Seguir registros en vivo; termina con `Ctrl+C`:

```powershell
docker compose --env-file .env.home -f docker-compose.home.yml logs --follow backend caddy
```

Revisión de base de datos:

```powershell
docker compose --env-file .env.home -f docker-compose.home.yml exec backend python -m alembic current
```

No uses como mantenimiento normal `docker compose down -v`, `docker volume prune`, `git reset --hard` ni comandos SQL que eliminen tablas. Los datos principales están en Neon, pero borrar volúmenes reemplazaría la autoridad HTTPS local y borrar cambios Git puede destruir trabajo no guardado.

## 15. Referencias oficiales

- [Instalar Git for Windows](https://git-scm.com/install/windows)
- [Instalar Docker Desktop en Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Docker Desktop con WSL 2](https://docs.docker.com/desktop/features/wsl/)
- [Instalar o actualizar WSL](https://learn.microsoft.com/windows/wsl/install)
- [Reglas del Firewall de Windows](https://learn.microsoft.com/windows/security/operating-system-security/network-security/windows-firewall/configure-with-command-line)
- [Conexiones directas y pooled de Neon](https://neon.com/docs/connect/connection-pooling)
- [HTTPS local de Caddy](https://caddyserver.com/docs/automatic-https#local-https)
- [Instalar una aplicación web desde Chrome en Android](https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid)
