# Manejo de Desconexión a Internet - Guía Técnica

## 📋 Descripción General

Esta aplicación PWA implementa un sistema robusto para manejar la falta de conexión a internet, permitiendo que:

1. ✅ El login cargue completamente sin conexión (HTML, CSS, JS, imágenes, estilos)
2. ✅ Se detecte automáticamente cuando el usuario pierde conexión
3. ✅ Se muestre un mensaje claro indicando el estado offline
4. ✅ Se reintente conectar automáticamente
5. ✅ Se permita usar la app en modo offline con datos cacheados

---

## 🏗️ Arquitectura del Sistema

### 1. **Caching de Recursos (Workbox + Service Worker)**

Ubicación: [`vite.config.mts`](vite.config.mts#L125)

**Estrategias de Cache:**

| Tipo de Recurso | Estrategia | Cache | Expiración |
|---|---|---|---|
| **HTML** | Network First | `html-cache` | 1 día |
| **JS/CSS** | Cache First | `static-resources-cache` | 7 días |
| **Imágenes** | Cache First | `images-cache` | 30 días |
| **Fuentes** | Cache First | `*-fonts-cache` | 1 año |
| **APIs Firebase** | Network First | `firebase-*-cache` | 5-10 min |

**Network First**: Intenta conectar primero, usa caché si falla
**Cache First**: Usa caché primero, conecta si no está disponible

### 2. **Detección de Estado de Red**

Ubicación: [`src/composables/useNetworkStatus.ts`](src/composables/useNetworkStatus.ts)

**Métodos de Detección:**

```typescript
// Eventos nativos del navegador
window.addEventListener('online', handleOnline)
window.addEventListener('offline', handleOffline)

// Validación activa (cada 30 segundos)
validateConnection() - Hace HEAD request a /index.html

// Network Information API
navigator.connection.addEventListener('change', ...)
```

**Estados Gestionados:**

- `isOnline` - Estado actual de conexión
- `showNetworkBanner` - Mostrar/ocultar alerta
- `connectionAttempts` - Número de intentos de reconexión
- `lastConnectionTime` - Último cambio de estado

### 3. **Service Worker Mejorado**

Ubicación: [`public/firebase-messaging-sw.js`](public/firebase-messaging-sw.js)

**Responsabilidades:**

1. Manejo de Firebase Cloud Messaging (FCM)
2. Caching inteligente de recursos
3. Limpieza de cachés antiguas
4. Manejo de notificaciones push

---

## 🎯 Flujo de Uso - Usuario Sin Conexión

```
┌─ Usuario intenta acceder a la aplicación
│
├─ Service Worker intercepta requests
│  └─ Lee desde caché los recursos estáticos
│
├─ Composable useNetworkStatus detecta offline
│  └─ Muestra banner: "✗ Sin conexión a internet"
│
├─ Si hay datos en caché
│  └─ Aplicación funciona con datos locales
│
└─ Cuando reconecta
   └─ Banner: "✓ Conexión restaurada"
   └─ Reintenta operaciones fallidas
```

---

## 📱 Componentes de UI

### App.vue
- **Mostrado en**: Parte superior de la app
- **Comportamiento**: 
  - Snackbar que aparece/desaparece automáticamente
  - Animación suave slideDown
  - Verde cuando conecta, rojo cuando desconecta

### OfflineIndicator.vue
- **Uso**: En páginas específicas donde se necesita feedback detallado
- **Muestra**:
  - Icono pulsante de wifi-off
  - Mensaje explicativo
  - Botón para reintentar
  - Info de diagnóstico (modo desarrollo)

---

## 🔧 Configuración de Workbox

### globPatterns
```javascript
['**/*.{js,css,html,ico,png,svg,vue,mjs,woff,woff2,eot,ttf,otf}']
```
Define qué archivos se cachean automáticamente.

### runtimeCaching
Define cómo se cachean APIs externas:
- **urlPattern**: Regex para identificar URLs
- **handler**: Estrategia (CacheFirst, NetworkFirst)
- **options**: Configuración específica (expiration, timeout)

---

## ⚙️ Personalizaciones Disponibles

### 1. Cambiar Mensaje de Desconexión

En `src/composables/useNetworkStatus.ts`:
```typescript
snackMessage.value = '✗ Sin conexión a internet. Estás trabajando en modo offline.'
```

### 2. Ajustar Tiempo de Validación

En `src/composables/useNetworkStatus.ts`:
```typescript
// Cambiar de 30000ms (30 segundos) a otro valor
setInterval(async () => { ... }, 30000)
```

### 3. Agregar Más Estrategias de Cache

En `vite.config.mts`, en la sección `runtimeCaching`:
```javascript
{
  urlPattern: /^https:\/\/tuapi\.com\/.*/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'tu-api-cache',
    networkTimeoutSeconds: 5,
    expiration: { maxEntries: 50, maxAgeSeconds: 300 }
  }
}
```

---

## 🧪 Pruebas Manuales

### Simular Desconexión en Chrome DevTools

1. Abrir DevTools (F12)
2. Ir a `Network`
3. Marcar "Offline"
4. Recargar la página
5. Ver que el contenido se carga desde caché

### Simular Conexión Lenta

1. DevTools → Network
2. Seleccionar "Slow 3G" o "Fast 3G"
3. Observar que el app usa caché con timeout

### Verificar Service Worker

1. DevTools → Application → Service Workers
2. Ver estado de instalación
3. Verificar cachés en Storage → Cache

---

## 🐛 Debugging

### Ver logs del Service Worker

```javascript
// En consola del navegador
console.log('[useNetworkStatus] Online detected...')
console.log('[Service Worker] Fetch event:', event)
```

### Forzar actualización del Service Worker

```javascript
// En consola del navegador
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister())
})
```

### Limpiar todos los cachés

```javascript
// En consola del navegador
caches.keys().then(names => {
  names.forEach(name => caches.delete(name))
})
```

---

## 📊 Recursos Cacheados

### Precache (automático, construido en)
- `index.html`
- Bundles de JavaScript compilados
- CSS compilado
- Imágenes de `/public/img`
- Favicon

### Runtime Cache (bajo demanda)
- Google Fonts
- Gstatic Fonts
- Material Design Icons
- APIs de Firebase (Firestore, Auth, FCM)
- Cualquier imagen solicitada

---

## 🚀 Deploy y Consideraciones

### Antes de Deploy

1. ✅ Verificar que el manifest.json sea válido
2. ✅ Probar en modo offline
3. ✅ Verificar iconos de app en `/public/img/icons/`
4. ✅ Verificar que HTTPS esté habilitado (requerido para PWA)

### Post-Deploy

1. El Service Worker se instalará en la primera visita
2. Las actualizaciones se cargarán en segundo plano
3. El usuario verá notificaciones de actualización

---

## 📝 Cambios Realizados

### vite.config.mts
- ✅ Mejorada configuración de Workbox
- ✅ Agregadas más estrategias de runtimeCaching
- ✅ Optimizadas expirations de caché

### useNetworkStatus.ts
- ✅ Agregada validación activa de conexión
- ✅ Agregado Network Information API
- ✅ Mejorados mensajes y reintentos automáticos

### App.vue
- ✅ Reemplazado Alert con Snackbar
- ✅ Mejor UX con animaciones
- ✅ Agregado overlay opcional para énfasis

### firebase-messaging-sw.js
- ✅ Mejorada limpieza de cachés
- ✅ Agregado manejo de message events
- ✅ Mejor logging

### Nuevo: OfflineIndicator.vue
- ✅ Componente reutilizable para estados offline
- ✅ Botón para reintentar manualmente
- ✅ Info de diagnóstico

### Nuevo: src/sw.ts
- ✅ Service Worker TypeScript con mejor tipado
- ✅ Estrategias avanzadas de caching
- ✅ Manejo robusto de errores

---

## 🔗 Referencias

- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA - Web.dev](https://web.dev/progressive-web-apps/)
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
