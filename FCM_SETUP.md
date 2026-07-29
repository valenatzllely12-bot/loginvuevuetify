# Guía de Configuración de Firebase Cloud Messaging (FCM)

## 📋 Información de tu Proyecto Firebase

- **Project ID**: `login-d7825`
- **Sender ID**: `813199889787`
- **API Key**: `AIzaSyApLV1LzftaypzeFpLIyDkuiHJ-Fzu9W50`

## 🔧 Paso 1: Obtener la VAPID Key

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **login-d7825**
3. En el menú izquierdo, busca **Configuración del Proyecto** (Engranaje ⚙️)
4. Haz clic en la pestaña **Mensajería en la nube** (Cloud Messaging)
5. En la sección **Web API Key**, verás:
   - **API Key**: (ya deberías tenerla en tu firebase.ts)
   - **Sender ID**: `813199889787`
6. En la sección **Web Push Certificates**, busca **Certificados de par de claves**
7. Si no hay un certificado generado:
   - Haz clic en **Generar un par de claves**
   - Se generará una **Clave pública (VAPID)**

## 🔑 Paso 2: Configurar la VAPID Key en tu proyecto

Una vez tengas la VAPID Key de Firebase Console:

1. Abre el archivo `src/composables/useFCM.ts`
2. Busca la línea:
   ```typescript
   const VAPID_KEY = 'YOUR_VAPID_KEY_HERE'
   ```
3. Reemplázala con tu clave VAPID:
   ```typescript
   const VAPID_KEY = 'TU_CLAVE_VAPID_AQUI'
   ```

## 📱 Paso 3: Habilitar el Servicio de Mensajería

1. En la pestaña **Mensajería en la nube** (Cloud Messaging)
2. Verifica que esté habilitado en la sección de **Web Push Certificates**
3. Asegúrate de que tu dominio esté autorizado (aunque en desarrollo funciona en localhost)

## 🚀 Paso 4: Usar el Componente en tu App

En tu archivo principal `src/App.vue` o en tu layout `src/layouts/default.vue`:

```vue
<template>
  <v-app>
    <!-- Incluir el centro de notificaciones -->
    <NotificationCenter />
    
    <!-- Tu contenido aquí -->
    <v-main>
      <RouterView />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import NotificationCenter from '@/components/NotificationCenter.vue'
import { useFCM } from '@/composables/useFCM'

// Inicializar FCM cuando la app se monta
const { initializeFCM } = useFCM()
</script>
```

## 📤 Paso 5: Enviar Mensajes desde Firebase Console

### Opción A: Desde la Consola (No se requiere registrar tokens)

1. En Firebase Console, ve a **Engagement** → **Messaging**
2. Haz clic en **Create your first campaign** o **New campaign**
3. Selecciona **Firebase Notification messages**
4. Llena los campos:
   - **Title**: Título de tu notificación
   - **Body**: Contenido de tu notificación
   - **Target**: 
     - Por defecto: todos los usuarios
     - O selecciona usuarios específicos
5. Haz clic en **Send test message** o **Publish**

### Opción B: Desde un Servidor (Requiere registrar tokens)

Para enviar mensajes a usuarios específicos, necesitas guardar sus tokens FCM.

**En tu base de datos (Firestore), crea una colección llamada `fcm_tokens`:**

```
Collection: fcm_tokens
Document: {usuario_id}
  - token: "eXCJvyJ..."
  - userId: "user@example.com"
  - timestamp: 2024-01-15T10:30:00Z
  - active: true
```

**En tu composable `useFCM.ts`, actualiza la función `saveFCMTokenToDatabase`:**

```typescript
import { db } from '@/config/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useAuthStore } from '@/stores'

const saveFCMTokenToDatabase = async (token: string) => {
  try {
    const authStore = useAuthStore()
    const userId = authStore.user?.uid
    
    if (!userId) return

    await setDoc(
      doc(db, 'fcm_tokens', userId),
      {
        token,
        userId,
        timestamp: serverTimestamp(),
        active: true,
      },
      { merge: true }
    )
    
    console.log('Token guardado en Firestore')
  } catch (error) {
    console.error('Error saving FCM token:', error)
  }
}
```

## ✅ Paso 6: Verificar que Funciona

1. Abre tu aplicación Vue en el navegador
2. Verifica que aparezca un popup pidiendo permiso para notificaciones
3. Haz clic en **Permitir**
4. Revisa la consola (F12) → Console tab
5. Deberías ver:
   - "Service Worker registered successfully"
   - "FCM Token: [tu_token]"

## 🧪 Paso 7: Enviar Mensaje de Prueba

1. En Firebase Console → **Messaging** (Cloud Messaging)
2. Crea un nuevo mensaje
3. Haz clic en **Send a test message**
4. Pega el token FCM que viste en tu consola
5. Envía el mensaje
6. **¡Deberías ver la notificación en tu app!**

## 📝 Estructura de Mensajes FCM

### Mensaje con datos personalizados:

```json
{
  "data": {
    "notification_type": "order_status",
    "order_id": "12345",
    "custom_url": "https://example.com/order/12345"
  },
  "notification": {
    "title": "Tu pedido ha sido enviado",
    "body": "Tu pedido #12345 está en camino"
  }
}
```

## 🔐 Seguridad

- **La VAPID Key** es pública, puedes compartirla sin problemas
- **Los Tokens FCM** son únicos por dispositivo/navegador
- **Las claves privadas** de tu Firebase nunca deben estar expuestas en el código cliente

## 🐛 Solución de Problemas

### "Error: Permission denied" o no funciona FCM

1. Verifica que tu VAPID Key está correcta en `useFCM.ts`
2. Revisa que el Service Worker está registrado (console → F12)
3. Verifica que tienes permisos de notificación habilitados en tu navegador

### "Service Worker no se registra"

1. Verifica que `firebase-messaging-sw.js` está en la carpeta `public/`
2. Limpia el navegador (caché) y recarga
3. En Firefox, verifica `about:preferences#privacy` → Permisos → Notificaciones

### "El token es indefinido"

1. Verifica que has dado permiso para notificaciones
2. Recarga la página después de dar permiso
3. Revisa que la VAPID Key está configurada correctamente

## 📚 Recursos Adicionales

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Protocol](https://tools.ietf.org/html/draft-thomson-webpush-protocol)
- [Notification API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notification)
