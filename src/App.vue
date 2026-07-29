<template>
  <v-app>
    <!-- Banner de estado de red - Siempre visible cuando hay cambios -->
    <v-snackbar
      v-model="showNetworkBanner"
      :timeout="timeout"
      :color="snackColor"
      position="top"
      theme="dark"
      :location="isOnline ? 'top' : 'top'"
      class="network-snackbar"
    >
      <div class="d-flex align-center gap-2">
        <v-icon v-if="isOnline" size="small">mdi-check-circle</v-icon>
        <v-icon v-else size="small" animation="spin">mdi-wifi-off</v-icon>
        <span>{{ snackMessage }}</span>
      </div>
      <template #actions>
        <v-btn
          icon="mdi-close"
          size="x-small"
          variant="text"
          @click="showNetworkBanner = false"
        />
      </template>
    </v-snackbar>

    <!-- Overlay cuando está desconectado (opcional, para énfasis) -->
    <v-overlay v-if="!isOnline" class="offline-overlay" opacity="0.1" persistent />

    <!-- Centro de Notificaciones FCM -->
    <NotificationCenter />
    
    <!-- Contenido principal -->
    <router-view />
  </v-app>
</template>

<script lang="ts" setup>
import NotificationCenter from '@/components/NotificationCenter.vue'
import { useFCM } from '@/composables/useFCM'
import { useNetworkStatus } from '@/composables/useNetworkStatus'

// Inicializar Firebase Cloud Messaging
useFCM()

const { isOnline, showNetworkBanner, snackMessage, snackColor, timeout } = useNetworkStatus()
</script>

<style scoped>
.network-snackbar {
  z-index: 2500 !important;
}

.offline-overlay {
  pointer-events: none;
  z-index: 2400;
}

/* Animación suave para las transiciones del banner */
:deep(.v-snackbar__wrapper) {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
