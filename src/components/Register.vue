<template>
  <v-sheet class="mx-auto pa-8" max-width="400" rounded="lg" elevation="4">
    <h2 class="text-h5 text-center mb-6 font-weight-bold">Registro</h2>
    
    <v-alert v-if="error" type="error" class="mb-4" closable>
      {{ error }}
    </v-alert>

    <v-form validate-on="submit lazy" @submit.prevent="handleRegister">
      <v-text-field
        v-model="email"
        :rules="emailRules"
        label="Correo electrónico"
        type="email"
        variant="outlined"
        color="primary"
        prepend-inner-icon="mdi-email"
      ></v-text-field>

      <v-text-field
        v-model="password"
        :rules="passwordRules"
        label="Contraseña"
        type="password"
        variant="outlined"
        color="primary"
        prepend-inner-icon="mdi-lock"
        class="mt-4"
      ></v-text-field>

      <v-text-field
        v-model="confirmPassword"
        :rules="confirmPasswordRules"
        label="Confirmar contraseña"
        type="password"
        variant="outlined"
        color="primary"
        prepend-inner-icon="mdi-lock-check"
        class="mt-4"
      ></v-text-field>

      <v-btn
        :loading="loading"
        class="mt-6"
        text="Registrarse"
        type="submit"
        block
        color="primary"
        size="large"
        rounded="lg"
      ></v-btn>
    </v-form>

    <div class="text-center mt-4">
      <span class="text-body2">¿Ya tienes cuenta? </span>
      <router-link to="/" class="text-primary text-decoration-none font-weight-bold">
        Inicia sesión aquí
      </router-link>
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { register, loading, error } = useAuth()

const emailRules = [
  (value: string) => !!value || 'El correo es requerido.',
  (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'El correo debe ser válido.',
]
const passwordRules = [
  (value: string) => !!value || 'La contraseña es requerida.',
  (value: string) => (value && value.length >= 8) || 'La contraseña debe tener al menos 8 caracteres.',
  (value: string) => /[A-Z]/.test(value) || 'La contraseña debe contener al menos una mayúscula.',
  (value: string) => /[a-z]/.test(value) || 'La contraseña debe contener al menos una minúscula.',
  (value: string) => /[0-9]/.test(value) || 'La contraseña debe contener al menos un número.',
]

const confirmPasswordRules = computed(() => [
  (value: string) => !!value || 'Confirmar contraseña es requerido.',
  (value: string) => value === password.value || 'Las contraseñas no coinciden.',
])

const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const handleRegister = async () => {
  await register(email.value, password.value)
}
</script>
