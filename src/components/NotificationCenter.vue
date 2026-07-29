<template>
  <v-snackbar v-model="show" :color="currentNotification?.read ? 'info' : 'success'" location="top right" timeout="6000">
    <template v-if="currentNotification">
      <div class="d-flex align-center justify-space-between w-100">
        <div>
          <strong>{{ currentNotification.title }}</strong>
          <p class="mb-0 mt-2">{{ currentNotification.message }}</p>
          <small class="text-caption">{{ formatTime(currentNotification.timestamp) }}</small>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" @click="show = false" />
      </div>
    </template>
  </v-snackbar>

  <!-- Panel de notificaciones -->
  <v-menu location="bottom end" transition="slide-y-transition" :close-on-content-click="false">
    <template v-slot:activator="{ props }">
      <v-badge :content="unreadCount" color="red" floating overlap v-bind="props">
        <v-btn icon="mdi-bell" />
      </v-badge>
    </template>

    <v-list class="notification-menu" style="max-width: 400px; max-height: 500px; overflow-y: auto">
      <v-list-subheader v-if="notifications.length > 0">
        <div class="d-flex justify-space-between align-center w-100">
          <span>Notificaciones</span>
          <v-btn
            v-if="notifications.length > 0"
            size="small"
            variant="text"
            @click="clearNotifications"
          >
            Limpiar
          </v-btn>
        </div>
      </v-list-subheader>

      <v-empty-state
        v-if="notifications.length === 0"
        icon="mdi-bell-outline"
        title="Sin notificaciones"
        text="No hay notificaciones en este momento"
      />

      <v-list-item
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-item"
        :class="{ unread: !notification.read }"
        @click="markAsRead(notification.id)"
      >
        <template v-slot:prepend>
          <v-badge
            v-if="!notification.read"
            color="red"
            dot
            class="mr-2"
          />
        </template>

        <v-list-item-title>{{ notification.title }}</v-list-item-title>
        <v-list-item-subtitle class="text-wrap">
          {{ notification.message }}
        </v-list-item-subtitle>
        <v-list-item-subtitle class="text-caption mt-1">
          {{ formatTime(notification.timestamp) }}
        </v-list-item-subtitle>

        <template v-slot:append>
          <v-btn
            icon="mdi-close"
            size="x-small"
            variant="text"
            @click.stop="deleteNotification(notification.id)"
          />
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFCM, notifications } from '@/composables/useFCM'

const { markAsRead, clearNotifications, deleteNotification } = useFCM()

const show = ref(false)
const currentNotification = ref<any>(null)

const unreadCount = computed(() => {
  return notifications.value.filter((n) => !n.read).length
})

// Mostrar snackbar cuando hay nueva notificación
watch(
  () => notifications.value.length,
  () => {
    if (notifications.value.length > 0) {
      currentNotification.value = notifications.value[0]
      show.value = true
    }
  }
)

// Formatear hora
const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return 'Hace unos segundos'
  if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`

  return new Date(date).toLocaleString('es-ES')
}
</script>

<style scoped>
.notification-item {
  border-left: 3px solid transparent;
  transition: all 0.3s ease;
}

.notification-item.unread {
  background-color: rgba(0, 150, 255, 0.1);
  border-left-color: #0096ff;
}

.notification-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.notification-menu {
  border-radius: 4px;
}
</style>
