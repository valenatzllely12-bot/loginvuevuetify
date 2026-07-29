<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" permanent>
      <v-list>
        <v-list-item
          title="Bienvenido"
          subtitle="Menú"
          prepend-icon="mdi-home"
          to="/welcome"
        ></v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-item
          title="Productos"
          prepend-icon="mdi-package"
          to="/productos"
        ></v-list-item>

        <v-list-item
          title="Almacenes"
          prepend-icon="mdi-warehouse"
          to="/almacenes"
        ></v-list-item>
      </v-list>

      <template v-slot:append>
        <v-list>
          <v-list-item
            title="Cerrar sesión"
            prepend-icon="mdi-logout"
            @click="handleLogout"
            :loading="loading"
          ></v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-main>
      <div class="welcome-container">
        <v-card class="welcome-card" elevation="4">
          <v-card-title class="text-center text-h3 font-weight-bold">
            ¡Bienvenido!
          </v-card-title>
          
          <v-card-text class="text-center mt-6">
            <p class="text-h6">Hola, {{ user?.email }}</p>
            <p class="text-body1 mt-4">Sesión iniciada correctamente</p>
          </v-card-text>
        </v-card>
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { user, loading, logout } = useAuth()
const drawer = ref(true)

const handleLogout = async () => {
  await logout()
}
</script>

<style scoped>
.welcome-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.welcome-card {
  min-width: 400px;
}
</style>
