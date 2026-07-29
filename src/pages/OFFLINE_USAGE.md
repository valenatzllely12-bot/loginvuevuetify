# Usando OfflineIndicator en Páginas

## Ejemplo 1: Mostrar Banner cuando está Offline

```vue
<template>
  <div>
    <!-- Mostrar OfflineIndicator cuando no hay conexión -->
    <OfflineIndicator />
    
    <!-- Contenido normal -->
    <div v-if="isOnline">
      <!-- Tu contenido aquí -->
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import OfflineIndicator from '@/components/OfflineIndicator.vue'

const { isOnline } = useNetworkStatus()
</script>
```

## Ejemplo 2: Deshabilitar Formularios cuando está Offline

```vue
<template>
  <v-form @submit.prevent="handleSubmit">
    <v-text-field
      v-model="email"
      :disabled="!isOnline"
      label="Email"
    />
    <v-btn 
      type="submit"
      :disabled="!isOnline"
    >
      {{ isOnline ? 'Enviar' : 'Sin conexión' }}
    </v-btn>
  </v-form>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useNetworkStatus } from '@/composables/useNetworkStatus'

const { isOnline } = useNetworkStatus()
const email = ref('')

const handleSubmit = async () => {
  if (!isOnline.value) {
    console.warn('No hay conexión')
    return
  }
  // Procesar formulario
}
</script>
```

## Ejemplo 3: Mostrar Diferentes Vistas según Conexión

```vue
<template>
  <v-container>
    <!-- Vista Offline -->
    <OfflineIndicator />
    
    <!-- Vista Online -->
    <v-row v-if="isOnline">
      <v-col cols="12">
        <ProductsList />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import OfflineIndicator from '@/components/OfflineIndicator.vue'
import ProductsList from '@/components/ProductsList.vue'

const { isOnline } = useNetworkStatus()
</script>
```

## Ejemplo 4: Notificar al Usuario de Cambios de Estado

```vue
<template>
  <div>
    <v-snackbar 
      v-model="showSnackbar"
      :color="connectionRestored ? 'success' : 'error'"
      :timeout="3000"
    >
      {{ connectionRestored 
        ? '✓ Conexión restaurada' 
        : '✗ Conexión perdida' 
      }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useNetworkStatus } from '@/composables/useNetworkStatus'

const { isOnline } = useNetworkStatus()
const showSnackbar = ref(false)
const connectionRestored = ref(false)

// Reaccionar a cambios de conexión
watch(isOnline, (online) => {
  connectionRestored.value = online
  showSnackbar.value = true
})
</script>
```

## Integración en Páginas Existentes

### En pages/register.vue

```vue
<script setup>
import Register from '@/components/Register.vue'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import OfflineIndicator from '@/components/OfflineIndicator.vue'

const { isOnline } = useNetworkStatus()
</script>

<template>
  <div>
    <!-- Mostrar indicador cuando está offline -->
    <OfflineIndicator />
    
    <!-- Registración (funciona en offline con datos cacheados) -->
    <Register v-if="isOnline || false" />
    
    <!-- Mensaje útil -->
    <v-alert 
      v-if="!isOnline"
      type="warning"
      class="mt-4"
    >
      Algunos campos pueden no guardarse sin conexión
    </v-alert>
  </div>
</template>
```

### En pages/productos.vue

```vue
<script setup>
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import OfflineIndicator from '@/components/OfflineIndicator.vue'
import { useProducts } from '@/composables/useProducts'

const { isOnline } = useNetworkStatus()
const { products, loadProducts } = useProducts()

// Cargar productos si estamos online
if (isOnline.value) {
  loadProducts()
}
</script>

<template>
  <v-container>
    <OfflineIndicator />
    
    <v-row>
      <v-col cols="12">
        <!-- Mostrar productos del caché o del servidor -->
        <ProductList :products="products" />
      </v-col>
    </v-row>
  </v-container>
</template>
```

## API del Composable useNetworkStatus

```typescript
const {
  isOnline,              // ref<boolean> - Estado actual
  showNetworkBanner,     // ref<boolean> - Mostrar banner
  snackMessage,          // ref<string> - Mensaje del banner
  snackColor,            // ref<'success' | 'error' | 'info'>
  timeout,               // ref<number> - Timeout en ms
  lastConnectionTime,    // ref<number | null> - Timestamp del último cambio
  connectionAttempts,    // ref<number> - Intentos de reconexión
  attemptReconnect,      // () => Promise<void> - Reintentar manualmente
  validateConnection,    // () => Promise<boolean> - Validar conexión
} = useNetworkStatus()
```

## Casos de Uso

✅ **Desactivar botones de envío**  
✅ **Mostrar mensajes de validación**  
✅ **Cargar datos en caché**  
✅ **Pausar sincronización**  
✅ **Mostrar indicador de estado**  
✅ **Reintentar operaciones fallidas**

## Testing

```vue
<!-- Test en Chrome DevTools -->
1. F12 → Network
2. Toggle "Offline"
3. Ver que OfflineIndicator aparece
4. Verificar que componentes se deshabilitan
5. Toggle Online de nuevo
6. Ver que se recupera
```

---

Para más información, ver [OFFLINE_HANDLING.md](../OFFLINE_HANDLING.md)
