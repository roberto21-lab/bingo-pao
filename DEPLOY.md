# Guía de Despliegue en Firebase Hosting

## ⚠️ IMPORTANTE: Configuración de WebSocket

Firebase Hosting **NO maneja WebSockets directamente**. El frontend se conecta a un backend WebSocket externo usando la variable `VITE_API_URL`.

## Pasos para Desplegar:

### 1. Configurar la URL del Backend

Antes de hacer el build, **DEBES** crear un archivo `.env.production` con la URL de tu backend:

```bash
# En la carpeta bingo-pao
cp .env.production.example .env.production
```

Edita `.env.production` y configura la URL de tu backend:

```bash
# Ejemplo: Si usas Cloudflare Tunnel
VITE_API_URL=https://penguin-island-richmond-among.trycloudflare.com

# O si tienes un servidor propio
VITE_API_URL=https://api.tudominio.com
```

**⚠️ CRÍTICO:** Esta URL debe ser:
- ✅ Pública y accesible desde internet
- ✅ Usar HTTPS (no HTTP) si es posible
- ✅ Apuntar al backend que maneja WebSockets

### 2. Hacer el Build

```bash
npm run build
```

Esto creará la carpeta `dist/` con los archivos optimizados para producción.

### 3. Verificar el Build

Antes de desplegar, verifica que la URL esté correcta:

```bash
# Buscar en el código compilado
grep -r "VITE_API_URL\|localhost:3000" dist/
```

Si ves `localhost:3000` en el build, significa que la variable no se configuró correctamente.

### 4. Desplegar a Firebase

```bash
firebase deploy --only hosting
```

## Verificar la Conexión WebSocket

Después de desplegar:

1. Abre la aplicación en el navegador
2. Abre la consola del navegador (F12)
3. Busca los logs de conexión del socket
4. Deberías ver: `✅ Socket conectado: [socket-id]`

Si ves errores de conexión:
- Verifica que la URL en `.env.production` sea correcta
- Verifica que el backend esté corriendo y accesible
- Verifica que CORS esté configurado correctamente en el backend

## Notas Importantes:

- ⚠️ **NO commitees** `.env.production` al repositorio (ya está en `.gitignore`)
- ⚠️ Cada entorno (desarrollo, producción) necesita su propia URL
- ⚠️ Si cambias la URL del backend, debes hacer un nuevo build y redeploy
- ⚠️ El backend debe estar corriendo y accesible desde internet para que funcione

## Troubleshooting:

### Problema: Los números no se actualizan en tiempo real

**Causa:** El frontend no puede conectarse al backend WebSocket.

**Solución:**
1. Verifica que `VITE_API_URL` en `.env.production` sea correcta
2. Verifica que el backend esté corriendo y accesible
3. Verifica los logs del backend para ver si hay clientes conectados
4. Verifica la consola del navegador para errores de conexión

### Problema: Error de CORS

**Causa:** El backend no permite conexiones desde el dominio de Firebase.

**Solución:**
1. Agrega el dominio de Firebase a la lista de orígenes permitidos en el backend
2. Verifica la configuración de CORS en `bingo-pao-backend/src/socket/socketServer.ts`

