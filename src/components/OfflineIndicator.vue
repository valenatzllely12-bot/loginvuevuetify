<template>
  <v-container v-if="!isOnline" fluid class="py-4">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card color="error" class="pa-6 text-center">
          <!-- Icono de desconexión -->
          <v-icon size="60" color="white" class="mb-4">mdi-wifi-off</v-icon>

          <!-- Título -->
          <h2 class="text-h5 font-weight-bold mb-2 text-white">Sin Conexión a Internet</h2>

          <!-- Descripción -->
          <p class="text-subtitle-1 mb-4 text-white-80">
            No pudimos conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.
          </p>

          <!-- Información de disponibilidad offline -->
          <v-alert
            v-if="isOfflineMode"
            type="info"
            variant="tonal"
            class="mb-4"
            icon="mdi-database-lock"
          >
            <strong>Modo Offline Activo:</strong> Puedes seguir usando la aplicación con datos en caché,
            pero algunas funciones no estarán disponibles.
          </v-alert>

          <!-- Botones de acción -->
          <div class="d-flex gap-3 justify-center">
            <v-btn
              v-if="canRetry"
              color="white"
              variant="elevated"
              prepend-icon="mdi-refresh"
              @click="handleRetry"
              :loading="isRetrying"
            >
              {{ isRetrying ? 'Intentando reconectar...' : 'Reintentar' }}
            </v-btn>

            <v-btn
              color="white"
              variant="text"
              prepend-icon="mdi-home"
              @click="goHome"
            >
              Ir a Inicio
            </v-btn>
          </div>

          <!-- Información de diagnóstico (en modo desarrollo) -->
          <v-expand-transition>
            <v-card v-if="showDiagnostics" color="rgba(255,255,255,0.1)" class="mt-4 pa-3">
              <v-card-text class="text-white-80 text-caption">
                <div>Estado de navegador: {{ navigator.onLine ? 'Online' : 'Offline' }}</div>
                <div>Último intento: {{ lastAttemptTime }}</div>
                <div>Intentos de reconexión: {{ connectionAttempts }}</div>
              </v-card-text>
            </v-card>
          </v-expand-transition>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import { useRouter } from 'vue-router'

const router = useRouter()

// Usar el composable de estado de red
const {
  isOnline,
  connectionAttempts,
  lastConnectionTime,
  attemptReconnect,
  validateConnection,
} = useNetworkStatus()

// Estado local del componente
const isRetrying = ref(false)
const showDiagnostics = ref(false)
const canRetry = ref(true)

const isOfflineMode = computed(() => !isOnline.value)

const lastAttemptTime = computed(() => {
  if (!lastConnectionTime.value) return 'Nunca'
  const date = new Date(lastConnectionTime.value)
  return date.toLocaleTimeString('es-ES')
})

/**
 * Intenta reconectar manualmente
 */
const handleRetry = async () => {
  isRetrying.value = true
  canRetry.value = false

  try {
    // Validar la conexión
    const isConnected = await validateConnection()

    if (isConnected) {
      // Forzar reconexión
      await attemptReconnect()
    } else {
      // Mostrar mensaje de error
      showDiagnostics.value = true
      setTimeout(() => {
        canRetry.value = true
        isRetrying.value = false
      }, 2000)
    }
  } catch (error) {
    console.error('Error al reintentar conexión:', error)
    canRetry.value = true
    isRetrying.value = false
  } finally {
    if (isOnline.value) {
      isRetrying.value = false
    }
  }
}

/**
 * Navega a la página de inicio
 */
const goHome = () => {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.text-white-80 {
  color: rgba(255, 255, 255, 0.8);
}

.v-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.v-icon) {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
