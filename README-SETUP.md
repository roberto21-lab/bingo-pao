# Configuración del Entorno de Desarrollo

## Configuración de la URL del Backend

El frontend se conecta al backend usando la variable de entorno `VITE_API_URL`.

### Pasos para configurar tu entorno local:

1. **Copia el archivo de ejemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Edita el archivo `.env` y configura la URL del backend:**
   ```bash
   # Para desarrollo local (backend corriendo en tu PC)
   VITE_API_URL=http://localhost:3000
   
   # O para conectarte al backend de otro desarrollador vía Cloudflare Tunnel
   # Pide la URL de Cloudflare Tunnel al desarrollador que está corriendo el backend
   VITE_API_URL=https://penguin-island-richmond-among.trycloudflare.com
   ```

3. **Reinicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

### Notas importantes:

- El archivo `.env` está en `.gitignore` y **NO se commitea** al repositorio
- Cada desarrollador debe tener su propio archivo `.env` con su configuración
- Si cambias la URL, debes reiniciar el servidor de desarrollo para que tome efecto
- La URL se usa tanto para las peticiones HTTP como para las conexiones WebSocket

### Obtener la URL de Cloudflare Tunnel:

Si otro desarrollador está corriendo el backend y quiere compartir su URL:

1. El desarrollador debe tener Cloudflare Tunnel corriendo
2. La URL se muestra en la consola cuando inicia el tunnel (formato: `https://xxxxx.trycloudflare.com`)
3. Comparte esa URL con los otros desarrolladores
4. Los otros desarrolladores la agregan en su archivo `.env` como `VITE_API_URL`

### Verificar la configuración:

Puedes verificar qué URL está usando el frontend abriendo la consola del navegador y buscando los logs de conexión del socket o las peticiones HTTP.

